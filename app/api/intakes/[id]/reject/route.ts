import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const body = await req.json().catch(() => ({}));

  const rejectionReason = body.rejectionReason?.trim();

  if (!rejectionReason) {
    return NextResponse.json(
      { error: 'Rejection reason is required' },
      { status: 400 }
    );
  }

  // 1. Fetch existing intake first for locking + audit trail
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
      { error: 'This intake is already locked and cannot be rejected' },
      { status: 409 }
    );
  }

  // 2. Update intake
  // IMPORTANT:
  // reviewed_by is probably a UUID column, so do NOT save "Clinician" there.
  // Only save body.reviewerId if you later pass a real UUID.
  const updatePayload = {
    status: 'rejected',
    workflow_stage: 'clinical_review_rejected',
    fhir_status: 'not_generated',

    reviewed_at: new Date().toISOString(),
    reviewed_by: body.reviewerId ?? null,

    rejection_reason: rejectionReason,
    clinician_notes: body.clinicianNotes ?? intake.clinician_notes ?? null,
  };

  const { data: updatedIntake, error: updateError } = await supabase
    .from('intakes')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Rejection update error:', updateError);

    return NextResponse.json(
      {
        error: 'Failed to reject intake',
        details: updateError.message,
      },
      { status: 500 }
    );
  }

  // 3. Audit log
  await supabase.rpc('log_audit_event', {
    p_event_type: 'intake_rejected',
    p_description: `Intake ${params.id} rejected. Reason: ${rejectionReason}`,
    p_intake_id: params.id,
    p_actor_id: body.reviewerId ?? null,
    p_actor_label: body.actorLabel ?? 'Clinician',
    p_previous_value: intake as unknown as Record<string, unknown>,
    p_new_value: {
      status: 'rejected',
      workflow_stage: 'clinical_review_rejected',
      fhir_status: 'not_generated',
      rejectionReason,
      clinicianNotes: body.clinicianNotes ?? null,
    },
    p_metadata: {
      previousStatus: intake.status,
      previousWorkflowStage: intake.workflow_stage ?? null,
      reasonProvided: true,
    },
  });

  return NextResponse.json({
    success: true,
    intake: updatedIntake,
  });
}