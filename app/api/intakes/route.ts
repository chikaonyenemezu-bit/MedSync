import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { extractIntake } from '@/lib/ai/extractIntake';
import type { NewIntakeInput } from '@/types/intake';

type StructuredInput = {
  demographics?: string;
  presentingComplaint?: string;
  medicationHistory?: string;
  recentMedicationChanges?: string;
  allergiesAndClinicalHistory?: string;
};

type WorkflowInput = {
  stage?: string;
  status?: string;
  fhirStatus?: string;
};

type ExtendedNewIntakeInput = NewIntakeInput & {
  structuredInput?: StructuredInput;
  workflow?: WorkflowInput;
};

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  let body: ExtendedNewIntakeInput;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.narrative?.trim()) {
    return NextResponse.json(
      { error: 'Narrative is required' },
      { status: 400 }
    );
  }

  if (!body.patientRef?.trim()) {
    return NextResponse.json(
      { error: 'Patient reference is required' },
      { status: 400 }
    );
  }

  const structuredInput = body.structuredInput ?? {};

  /*
    STEP 1:
    Create the clinical intake.

    Important:
    Your database uses an enum for status, so we keep status as "pending".
    The actual workflow stage is controlled by workflow_stage.
  */

  const { data: intake, error: insertError } = await supabase
    .from('intakes')
    .insert({
      patient_ref: body.patientRef.trim(),
      narrative: body.narrative.trim(),

      status: 'pending',
      workflow_stage: 'ai_extraction',
      fhir_status: 'not_generated',

      demographics: structuredInput.demographics ?? null,
      presenting_complaint: structuredInput.presentingComplaint ?? null,
      medication_history: structuredInput.medicationHistory ?? null,
      recent_medication_changes: structuredInput.recentMedicationChanges ?? null,
      allergies_clinical_history:
        structuredInput.allergiesAndClinicalHistory ?? null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);

    return NextResponse.json(
      {
        error: 'Failed to create intake',
        details: insertError.message,
      },
      { status: 500 }
    );
  }

  /*
    STEP 2:
    Log intake creation.
  */

  await supabase.rpc('log_audit_event', {
    p_event_type: 'intake_created',
    p_description: `Clinical intake created for ${body.patientRef}`,
    p_intake_id: intake.id,
    p_actor_label: 'Nurse',
    p_new_value: {
      patientRef: body.patientRef,
      structuredInput,
      workflow: {
        status: 'pending',
        workflowStage: 'ai_extraction',
        fhirStatus: 'not_generated',
      },
    },
    p_metadata: {
      source: 'nurse_led_intake',
    },
  });

  /*
    STEP 3:
    Log submission for AI extraction.
  */

  await supabase.rpc('log_audit_event', {
    p_event_type: 'submitted_for_ai_extraction',
    p_description: 'Clinical intake submitted for AI extraction',
    p_intake_id: intake.id,
    p_actor_label: 'Nurse',
    p_metadata: {
      workflowStage: 'ai_extraction',
      fhirStatus: 'not_generated',
    },
  });

  /*
    STEP 4:
    Run AI extraction.
  */

  let extracted;

  try {
    extracted = await extractIntake(body.narrative.trim());
  } catch (err) {
    console.error('Extraction error:', err);

    await supabase
      .from('intakes')
      .update({
        status: 'pending',
        workflow_stage: 'ai_extraction_failed',
        fhir_status: 'not_generated',
      })
      .eq('id', intake.id);

    await supabase.rpc('log_audit_event', {
      p_event_type: 'ai_extraction_failed',
      p_description: 'AI extraction failed',
      p_intake_id: intake.id,
      p_actor_label: 'AI extraction',
      p_metadata: {
        error: err instanceof Error ? err.message : 'Unknown extraction error',
        workflowStage: 'ai_extraction_failed',
      },
    });

    return NextResponse.json(
      {
        intake: {
          ...intake,
          workflow_stage: 'ai_extraction_failed',
        },
        extractionError: 'AI extraction failed',
      },
      { status: 207 }
    );
  }

  /*
    STEP 5:
    Save extracted clinical fields.
    Keep status as "pending" because your database enum accepts it.
    Move workflow_stage to "clinical_review".
  */

  const { data: updated, error: updateError } = await supabase
    .from('intakes')
    .update({
      status: 'pending',
      workflow_stage: 'clinical_review',
      fhir_status: 'not_generated',

      chief_complaint: extracted.chiefComplaint,
      duration: extracted.duration,
      onset: extracted.onset,
      severity: extracted.severity,
      associated_symptoms: extracted.associatedSymptoms,
      aggravating_factors: extracted.aggravatingFactors,
      alleviating_factors: extracted.alleviatingFactors,
      trigger: extracted.trigger,

      icd10_suggestion: extracted.icd10Suggestion,
      icd10_display: extracted.icd10Display,
      snomed_suggestion: extracted.snomedSuggestion,
      snomed_display: extracted.snomedDisplay,

      clinical_impression: extracted.clinicalImpression,
      urgency: extracted.urgency,
    })
    .eq('id', intake.id)
    .select()
    .single();

  if (updateError) {
    console.error('Update error:', updateError);

    await supabase.rpc('log_audit_event', {
      p_event_type: 'ai_extraction_save_failed',
      p_description: 'AI extraction completed but failed to save extracted fields',
      p_intake_id: intake.id,
      p_actor_label: 'System',
      p_metadata: {
        error: updateError.message,
      },
    });

    return NextResponse.json(
      {
        intake,
        extractionError: 'Failed to save extraction',
        details: updateError.message,
      },
      { status: 207 }
    );
  }

  /*
    STEP 6:
    Audit log AI extraction completed.
  */

  await supabase.rpc('log_audit_event', {
    p_event_type: 'ai_extraction_completed',
    p_description: `AI extraction completed. ICD-10-GM: ${
      extracted.icd10Suggestion ?? 'N/A'
    } — ${extracted.icd10Display ?? 'N/A'}. SNOMED CT: ${
      extracted.snomedSuggestion ?? 'N/A'
    } — ${extracted.snomedDisplay ?? 'N/A'}.`,
    p_intake_id: intake.id,
    p_actor_label: 'AI extraction',
    p_new_value: extracted as unknown as Record<string, unknown>,
    p_metadata: {
      model: 'llama-3.3-70b-versatile',
      workflowStage: 'clinical_review',
      status: 'pending',
      fhirStatus: 'not_generated',
    },
  });

  /*
    STEP 7:
    Audit log case ready for clinical review.
  */

  await supabase.rpc('log_audit_event', {
    p_event_type: 'ready_for_clinical_review',
    p_description: 'Case moved to clinical review queue',
    p_intake_id: intake.id,
    p_actor_label: 'System',
    p_metadata: {
      previousStage: 'ai_extraction',
      currentStage: 'clinical_review',
      status: 'pending',
    },
  });

  return NextResponse.json(
    {
      intake: updated,
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();

  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status');
  const workflowStage = searchParams.get('workflowStage');
  const fhirStatus = searchParams.get('fhirStatus');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  let query = supabase
    .from('intakes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (workflowStage) {
    query = query.eq('workflow_stage', workflowStage);
  }

  if (fhirStatus) {
    query = query.eq('fhir_status', fhirStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error('GET intakes error:', error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    intakes: data,
  });
}