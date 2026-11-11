import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/client';
import { StatusBadge, UrgencyBadge } from '@/components/shared/StatusBadge';

export const revalidate = 0;

const ACCENT = '#1A56A0';

function formatWorkflowLabel(value: string | null) {
  if (!value) return 'Not set';

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function ReviewQueuePage() {
  const supabase = createServiceClient();

  const { data: intakes, error } = await supabase
    .from('intakes')
    .select(
      `
      id,
      patient_ref,
      chief_complaint,
      presenting_complaint,
      urgency,
      status,
      workflow_stage,
      fhir_status,
      created_at,
      updated_at
    `
    )
    .eq('workflow_stage', 'clinical_review')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Review queue
        </h1>

        <div
          style={{
            background: '#FCEBEB',
            color: '#A32D2D',
            borderRadius: 'var(--border-radius-md)',
            padding: '12px 14px',
            fontSize: 13,
          }}
        >
          Failed to load review queue: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 4,
              letterSpacing: '-0.2px',
            }}
          >
            Clinical review queue
          </h1>

          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {intakes?.length ?? 0} cases awaiting clinician review after AI
            extraction.
          </div>
        </div>

        <Link
          href="/dashboard/intake/new"
          style={{
            background: ACCENT,
            color: '#fff',
            borderRadius: 'var(--border-radius-md)',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          New clinical intake
        </Link>
      </div>

      {/* Workflow summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Awaiting review
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            {intakes?.length ?? 0}
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Current workflow stage
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>
            Clinical Review
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Next stage
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Approval → FHIR Center
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 120px 130px 130px 140px',
            padding: '8px 1rem',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span>Patient</span>
          <span>Presenting complaint</span>
          <span>Urgency</span>
          <span>Status</span>
          <span>FHIR status</span>
          <span>Submitted</span>
        </div>

        {!intakes || intakes.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            No cases awaiting clinical review.{' '}
            <Link
              href="/dashboard/intake/new"
              style={{ color: ACCENT, fontWeight: 500 }}
            >
              Create a new intake
            </Link>
          </div>
        ) : (
          intakes.map((intake) => {
            const complaint =
              intake.chief_complaint ??
              intake.presenting_complaint ??
              'Awaiting extracted complaint';

            return (
              <Link
                key={intake.id}
                href={`/dashboard/intake/${intake.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 120px 130px 130px 140px',
                  alignItems: 'center',
                  padding: '12px 1rem',
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {intake.patient_ref}
                </span>

                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: 12,
                  }}
                >
                  {complaint}
                </span>

                <span>
                  <UrgencyBadge urgency={intake.urgency} />
                </span>

                <span>
                  <StatusBadge status={intake.status} />
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {formatWorkflowLabel(intake.fhir_status)}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {new Date(intake.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}