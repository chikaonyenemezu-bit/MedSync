import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';
import { buildBundle } from '@/lib/fhir/buildBundle';
import { submitBundleToHAPI } from '@/lib/fhir/submitBundle';
import type { IntakeRecord } from '@/types/intake';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const body = await req.json().catch(() => ({}));

  // 1. Fetch intake
  const { data: intake, error: fetchError } = await supabase
    .from('intakes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchError || !intake) {
    return NextResponse.json(
      { error: 'Intake not found' },
      { status: 404 }
    );
  }

  if (
    intake.status === 'approved' ||
    intake.status === 'rejected' ||
    intake.status === 'exported'
  ) {
    return NextResponse.json(
      { error: 'This intake is already locked' },
      { status: 409 }
    );
  }

  const confirmedIcd10 =
    body.icd10Override ??
    intake.icd10_confirmed ??
    intake.icd10_suggestion;

  const confirmedSnomed =
    body.snomedOverride ??
    intake.snomed_confirmed ??
    intake.snomed_suggestion;

  // 2. First mark case as approved and FHIR generation in progress
  const { data: approvedIntake, error: approvalError } = await supabase
    .from('intakes')
    .update({
      status: 'approved',
      workflow_stage: 'fhir_export',
      fhir_status: 'generating',

      reviewed_at: new Date().toISOString(),
      reviewed_by: body.reviewerId ?? null,
      clinician_notes: body.clinicianNotes ?? intake.clinician_notes,

      icd10_confirmed: confirmedIcd10,
      snomed_confirmed: confirmedSnomed,
    })
    .eq('id', params.id)
    .select()
    .single();

  if (approvalError) {
    console.error('Approval update error:', approvalError);

    return NextResponse.json(
      {
        error: 'Failed to approve intake',
        details: approvalError.message,
      },
      { status: 500 }
    );
  }

  await supabase.rpc('log_audit_event', {
    p_event_type: 'intake_approved',
    p_description: `Intake ${params.id} approved by clinician`,
    p_intake_id: params.id,
    p_actor_label: body.actorLabel ?? 'Clinician',
    p_previous_value: intake as unknown as Record<string, unknown>,
    p_new_value: {
      status: 'approved',
      workflow_stage: 'fhir_export',
      fhir_status: 'generating',
      clinicianNotes: body.clinicianNotes ?? null,
      icd10Confirmed: confirmedIcd10,
      snomedConfirmed: confirmedSnomed,
    },
    p_metadata: {
      previousStage: intake.workflow_stage ?? 'clinical_review',
      currentStage: 'fhir_export',
    },
  });

  // 3. Map approved intake to IntakeRecord
  const intakeRecord: IntakeRecord = {
    id: approvedIntake.id,
    patientRef: approvedIntake.patient_ref,
    narrative: approvedIntake.narrative,

    chiefComplaint: approvedIntake.chief_complaint,
    duration: approvedIntake.duration,
    onset: approvedIntake.onset,
    severity: approvedIntake.severity,
    associatedSymptoms: approvedIntake.associated_symptoms,
    aggravatingFactors: approvedIntake.aggravating_factors,
    alleviatingFactors: approvedIntake.alleviating_factors,
    trigger: approvedIntake.trigger,

    icd10Suggestion: approvedIntake.icd10_suggestion,
    icd10Display: approvedIntake.icd10_display,
    snomedSuggestion: approvedIntake.snomed_suggestion,
    snomedDisplay: approvedIntake.snomed_display,

    clinicalImpression: approvedIntake.clinical_impression,
    urgency: approvedIntake.urgency,

    status: approvedIntake.status,
    reviewedBy: approvedIntake.reviewed_by,
    reviewedAt: approvedIntake.reviewed_at,
    rejectionReason: approvedIntake.rejection_reason,
    clinicianNotes: approvedIntake.clinician_notes,
    icd10Confirmed: approvedIntake.icd10_confirmed,
    snomedConfirmed: approvedIntake.snomed_confirmed,

    createdAt: approvedIntake.created_at,
    updatedAt: approvedIntake.updated_at,
  };

  // 4. Build FHIR bundle
  let bundle;

  try {
    bundle = buildBundle(intakeRecord);
  } catch (err) {
    console.error('FHIR bundle build error:', err);

    await supabase
      .from('intakes')
      .update({
        workflow_stage: 'fhir_export_failed',
        fhir_status: 'generation_failed',
      })
      .eq('id', params.id);

    await supabase.rpc('log_audit_event', {
      p_event_type: 'fhir_bundle_generation_failed',
      p_description: `FHIR bundle generation failed for intake ${params.id}`,
      p_intake_id: params.id,
      p_actor_label: 'System',
      p_metadata: {
        error: err instanceof Error ? err.message : 'Unknown FHIR build error',
      },
    });

    return NextResponse.json(
      {
        error: 'Intake approved, but FHIR bundle generation failed',
      },
      { status: 207 }
    );
  }

  // 5. Try to submit to HAPI
  const hapiResult = await submitBundleToHAPI(bundle);

  if (!hapiResult.success) {
    console.warn('HAPI FHIR submission failed:', hapiResult.error);
  }

  // 6. Store FHIR bundle locally
  const { data: fhirExport, error: fhirInsertError } = await supabase
    .from('fhir_exports')
    .insert({
      intake_id: params.id,
      bundle,

      patient_resource_id: `pat-${params.id}`,
      observation_resource_id: `obs-${params.id}`,
      condition_resource_id: `con-${params.id}`,
      encounter_resource_id: `enc-${params.id}`,
      clinical_impression_id: `ci-${params.id}`,

      validation_status: 'not_validated',
      export_destination: hapiResult.success
        ? 'HAPI FHIR R4 (hapi.fhir.org)'
        : null,
      exported_at: hapiResult.success ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (fhirInsertError) {
    console.error('FHIR export insert error:', fhirInsertError);

    await supabase
      .from('intakes')
      .update({
        workflow_stage: 'fhir_export_failed',
        fhir_status: 'generation_failed',
      })
      .eq('id', params.id);

    await supabase.rpc('log_audit_event', {
      p_event_type: 'fhir_bundle_storage_failed',
      p_description: `FHIR bundle storage failed for intake ${params.id}`,
      p_intake_id: params.id,
      p_actor_label: 'System',
      p_metadata: {
        error: fhirInsertError.message,
      },
    });

    return NextResponse.json(
      {
        error: 'Intake approved, but failed to store FHIR bundle',
        details: fhirInsertError.message,
      },
      { status: 207 }
    );
  }

  // 7. IMPORTANT FIX:
  // Update the intake row after FHIR generation/export.
  // This is what your FHIR detail page reads for the top badges.
  const finalWorkflowStage = hapiResult.success
    ? 'fhir_exported'
    : 'fhir_ready';

  const finalFhirStatus = hapiResult.success
    ? 'exported'
    : 'generated_local';

  const { data: finalIntake, error: finalUpdateError } = await supabase
    .from('intakes')
    .update({
      workflow_stage: finalWorkflowStage,
      fhir_status: finalFhirStatus,
    })
    .eq('id', params.id)
    .select()
    .single();

  if (finalUpdateError) {
    console.error('Final intake update error:', finalUpdateError);

    return NextResponse.json(
      {
        error: 'FHIR bundle created, but failed to update final workflow status',
        details: finalUpdateError.message,
        fhirExport,
      },
      { status: 207 }
    );
  }

  // 8. Audit FHIR result
  if (hapiResult.success) {
    await supabase.rpc('log_audit_event', {
      p_event_type: 'fhir_bundle_exported',
      p_description: `FHIR R4 bundle submitted to HAPI FHIR. Bundle URL: ${hapiResult.bundleUrl}`,
      p_intake_id: params.id,
      p_fhir_export_id: fhirExport.id,
      p_actor_label: 'System',
      p_metadata: {
        bundleUrl: hapiResult.bundleUrl,
        resourceUrls: hapiResult.resourceUrls,
        workflowStage: finalWorkflowStage,
        fhirStatus: finalFhirStatus,
      },
    });
  } else {
    await supabase.rpc('log_audit_event', {
      p_event_type: 'fhir_bundle_generated',
      p_description: `FHIR R4 bundle generated for intake ${params.id}. Stored locally because HAPI export was unavailable.`,
      p_intake_id: params.id,
      p_fhir_export_id: fhirExport.id,
      p_actor_label: 'System',
      p_metadata: {
        hapiError: hapiResult.error,
        workflowStage: finalWorkflowStage,
        fhirStatus: finalFhirStatus,
      },
    });
  }

  return NextResponse.json({
    success: true,
    intake: finalIntake,
    fhirExport,
    hapiSubmission: hapiResult.success
      ? {
          submitted: true,
          bundleUrl: hapiResult.bundleUrl,
          resourceUrls: hapiResult.resourceUrls,
        }
      : {
          submitted: false,
          error: hapiResult.error,
        },
  });
}