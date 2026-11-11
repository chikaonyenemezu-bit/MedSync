'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';
import type { IntakeRecord } from '@/types/intake';

interface Props {
  intake: IntakeRecord & {
    workflowStage?: string | null;
    fhirStatus?: string | null;
  };
}

const ACCENT = '#1A56A0';

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not set';

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ReviewPanel({ intake }: Props) {
  const router = useRouter();

  const [notes, setNotes] = useState(intake.clinicianNotes ?? '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLocked =
    intake.status === 'approved' ||
    intake.status === 'rejected' ||
    intake.status === 'exported';

  const canApprove = !isLocked && !loadingAction;
  const canReject = !isLocked && !loadingAction;

  async function handleApprove() {
    if (!canApprove) return;

    setLoadingAction('approve');
    setError(null);

    try {
      const res = await fetch(`/api/intakes/${intake.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicianNotes: notes,
          workflow: {
            status: 'approved',
            workflowStage: 'fhir_ready',
            fhirStatus: 'not_generated',
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to approve intake');
      }

      router.push(`/dashboard/interoperability/${intake.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim() || !canReject) return;

    setLoadingAction('reject');
    setError(null);

    try {
      const res = await fetch(`/api/intakes/${intake.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
          clinicianNotes: notes,
          workflow: {
            status: 'rejected',
            workflowStage: 'clinical_review_rejected',
            fhirStatus: 'not_generated',
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to reject intake');
      }

      router.push('/dashboard/review');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ClipboardCheck size={14} color={ACCENT} />
        Clinical review
      </div>

      <div
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Workflow status summary */}
        <div
          style={{
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '10px 12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                marginBottom: 3,
              }}
            >
              Current workflow stage
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: ACCENT,
              }}
            >
              {formatLabel(intake.workflowStage ?? 'clinical_review')}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                marginBottom: 3,
              }}
            >
              FHIR status
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {formatLabel(intake.fhirStatus ?? 'not_generated')}
            </div>
          </div>
        </div>

        {/* Clinical safety reminder */}
        {!isLocked && (
          <div
            style={{
              background: '#FFF7E8',
              border: '0.5px solid #F2C879',
              borderRadius: 'var(--border-radius-md)',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              color: '#854F0B',
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              Confirm AI-extracted coding suggestions and clinical impression before approval.
              Approval will move this case to the FHIR Center for bundle generation.
            </span>
          </div>
        )}

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Clinician review notes
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLocked}
            placeholder="Optional reviewer notes, amendments, or coding rationale..."
            rows={3}
            style={{
              width: '100%',
              resize: 'vertical',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          />
        </div>

        {showRejectForm && !isLocked && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 6,
                color: '#A32D2D',
              }}
            >
              Rejection reason <span style={{ color: '#A32D2D' }}>*</span>
            </label>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Document why this intake cannot be approved. Example: insufficient clinical detail, coding mismatch, or requires nurse amendment."
              rows={3}
              style={{
                width: '100%',
                resize: 'vertical',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius-md)',
              background: '#FCEBEB',
              color: '#A32D2D',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={13} />
            {error}
          </div>
        )}

        {!isLocked && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleApprove}
              disabled={!canApprove}
              style={{
                flex: 2,
                padding: '9px 0',
                borderRadius: 'var(--border-radius-md)',
                border: 'none',
                background: canApprove ? ACCENT : 'var(--color-background-secondary)',
                color: canApprove ? '#fff' : 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: canApprove ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <CheckCircle size={14} />
              {loadingAction === 'approve'
                ? 'Approving...'
                : 'Approve & move to FHIR Center'}
            </button>

            <button
              onClick={() => setShowRejectForm((previous) => !previous)}
              disabled={!canReject}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid #F09595',
                background: showRejectForm ? '#FCEBEB' : 'none',
                color: '#A32D2D',
                fontSize: 13,
                cursor: canReject ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <XCircle size={14} />
              Reject
            </button>
          </div>
        )}

        {showRejectForm && !isLocked && (
          <button
            onClick={handleReject}
            disabled={loadingAction === 'reject' || !rejectionReason.trim()}
            style={{
              width: '100%',
              padding: '9px 0',
              borderRadius: 'var(--border-radius-md)',
              border: 'none',
              background:
                loadingAction === 'reject' || !rejectionReason.trim()
                  ? 'var(--color-background-secondary)'
                  : '#A32D2D',
              color:
                loadingAction === 'reject' || !rejectionReason.trim()
                  ? 'var(--color-text-secondary)'
                  : '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor:
                loadingAction === 'reject' || !rejectionReason.trim()
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {loadingAction === 'reject' ? 'Rejecting...' : 'Confirm rejection'}
          </button>
        )}

        {isLocked && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '10px 12px',
            }}
          >
            This intake has been {intake.status}. No further clinical review actions
            are available.
          </div>
        )}
      </div>
    </div>
  );
}