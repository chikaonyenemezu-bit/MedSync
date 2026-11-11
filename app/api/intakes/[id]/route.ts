import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { extractIntake } from '@/lib/ai/extractIntake';
import type { NewIntakeInput } from '@/types/intake';

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  const body: NewIntakeInput = await req.json();

  if (!body.narrative?.trim()) {
    return NextResponse.json({ error: 'Narrative is required' }, { status: 400 });
  }
  if (!body.patientRef?.trim()) {
    return NextResponse.json({ error: 'Patient reference is required' }, { status: 400 });
  }

  // 1. Insert intake with just the narrative
  const { data: intake, error: insertError } = await supabase
    .from('intakes')
    .insert({
      patient_ref: body.patientRef,
      narrative: body.narrative,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
  }

  // 2. Log intake created
  await supabase.rpc('log_audit_event', {
    p_event_type: 'intake_created',
    p_description: `Intake created for ${body.patientRef}`,
    p_intake_id: intake.id,
    p_actor_id: null,
    p_actor_label: 'System',
  });

  // 3. Run AI extraction — includes ICD-10-GM validation (BfArM) and SNOMED CT validation (Ontoserver)
  let extracted;
  try {
    extracted = await extractIntake(body.narrative);
  } catch (err) {
    console.error('Extraction error:', err);
    return NextResponse.json({ intake, extractionError: 'AI extraction failed' }, { status: 207 });
  }

  // 4. Save extracted + validated fields to Supabase
  const { data: updated, error: updateError } = await supabase
    .from('intakes')
    .update({
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
    return NextResponse.json({ intake, extractionError: 'Failed to save extraction' }, { status: 207 });
  }

  // 5. Audit log
  await supabase.rpc('log_audit_event', {
    p_event_type: 'ai_extraction_completed',
    p_description: `AI extraction completed. ICD-10-GM: ${extracted.icd10Suggestion} — ${extracted.icd10Display}. SNOMED CT: ${extracted.snomedSuggestion} — ${extracted.snomedDisplay}`,
    p_intake_id: intake.id,
    p_actor_id: null,
    p_actor_label: 'AI extraction',
    p_new_value: extracted as unknown as Record<string, unknown>,
    p_metadata: { model: 'llama-3.3-70b-versatile' },
  });

  return NextResponse.json({ intake: updated }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  let query = supabase
    .from('intakes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intakes: data });
}