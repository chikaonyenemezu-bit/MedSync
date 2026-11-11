import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/client';

export const revalidate = 0;

const ACCENT = '#1A56A0';

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not set';

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function FhirStatusBadge({ status }: { status: string | null }) {
  const isExported = status === 'exported';
  const isGenerated = status === 'generated_local';
  const isGenerating = status === 'generating';
  const isFailed = status === 'generation_failed';

  let background = '#F5F5F4';
  let color = '#6B6B6B';
  let label = formatLabel(status);

  if (isExported) {
    background = '#EAF3DE';
    color = '#3B6D11';
    label = 'Exported';
  }

  if (isGenerated) {
    background = '#EBF2FB';
    color = ACCENT;
    label = 'Generated local';
  }

  if (isGenerating) {
    background = '#FFF7E8';
    color = '#854F0B';
    label = 'Generating';
  }

  if (isFailed) {
    background = '#FCEBEB';
    color = '#A32D2D';
    label = 'Failed';
  }

  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 999,
        width: 'fit-content',
        background,
        color,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function ValidationBadge({ status }: { status: string | null }) {
  const isValid = status === 'valid';

  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 999,
        width: 'fit-content',
        background: isValid ? '#EAF3DE' : '#F5F5F4',
        color: isValid ? '#3B6D11' : '#6B6B6B',
        fontWeight: 600,
      }}
    >
      {formatLabel(status)}
    </span>
  );
}

export default async function InteroperabilityPage() {
  const supabase = createServiceClient();

  const { data: exports, error } = await supabase
    .from('fhir_exports')
    .select(
      `
      id,
      intake_id,
      validation_status,
      export_destination,
      exported_at,
      created_at,
      intakes (
        patient_ref,
        chief_complaint,
        presenting_complaint,
        status,
        workflow_stage,
        fhir_status
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          FHIR Center
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
          Failed to load FHIR exports: {error.message}
        </div>
      </div>
    );
  }

  const totalExports = exports?.length ?? 0;

  const exportedCount =
    exports?.filter((item) => {
      const intake = Array.isArray(item.intakes) ? item.intakes[0] : item.intakes;
      return intake?.fhir_status === 'exported';
    }).length ?? 0;

  const localGeneratedCount =
    exports?.filter((item) => {
      const intake = Array.isArray(item.intakes) ? item.intakes[0] : item.intakes;
      return intake?.fhir_status === 'generated_local';
    }).length ?? 0;

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
            FHIR Center
          </h1>

          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Approved clinical intakes converted into FHIR R4 bundles for
            interoperability, validation, and export tracking.
          </div>
        </div>

        <Link
          href="/dashboard/review"
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
          Go to review queue
        </Link>
      </div>

      {/* Summary cards */}
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
            FHIR bundles generated
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{totalExports}</div>
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
            Exported to HAPI FHIR
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#3B6D11' }}>
            {exportedCount}
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
            Stored locally
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: ACCENT }}>
            {localGeneratedCount}
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 130px 130px 160px 150px',
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
          <span>Clinical summary</span>
          <span>Case status</span>
          <span>FHIR status</span>
          <span>Validation</span>
          <span>Generated</span>
        </div>

        {!exports || exports.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            No FHIR bundles yet. Approve an intake to generate one.
          </div>
        ) : (
          exports.map((exp) => {
            const intake = Array.isArray(exp.intakes)
              ? exp.intakes[0]
              : exp.intakes;

            const complaint =
              intake?.chief_complaint ??
              intake?.presenting_complaint ??
              'No clinical summary documented';

            return (
              <Link
                key={exp.id}
                href={`/dashboard/interoperability/${exp.intake_id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 130px 130px 160px 150px',
                  alignItems: 'center',
                  padding: '12px 1rem',
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {intake?.patient_ref ?? '—'}
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

                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {formatLabel(intake?.status)}
                </span>

                <span>
                  <FhirStatusBadge status={intake?.fhir_status ?? null} />
                </span>

                <span>
                  <ValidationBadge status={exp.validation_status} />
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {new Date(exp.created_at).toLocaleString('en-GB', {
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