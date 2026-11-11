import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/client';
import FHIRBundleViewer from '@/components/fhir/FHIRBundleViewer';
import type { FHIRExportRecord } from '@/types/fhir';

interface Props {
  params: { id: string };
}

const ACCENT = '#1A56A0';

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not set';

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
}) {
  const styles = {
    success: {
      background: '#EAF3DE',
      color: '#3B6D11',
    },
    info: {
      background: '#EBF2FB',
      color: ACCENT,
    },
    warning: {
      background: '#FFF7E8',
      color: '#854F0B',
    },
    danger: {
      background: '#FCEBEB',
      color: '#A32D2D',
    },
    neutral: {
      background: '#F5F5F4',
      color: '#6B6B6B',
    },
  };

  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 999,
        fontWeight: 600,
        width: 'fit-content',
        ...styles[tone],
      }}
    >
      {label}
    </span>
  );
}

function getFhirTone(status: string | null | undefined) {
  if (status === 'exported') return 'success';
  if (status === 'generated_local') return 'info';
  if (status === 'generating') return 'warning';
  if (status === 'generation_failed') return 'danger';
  return 'neutral';
}

function getValidationTone(status: string | null | undefined) {
  if (status === 'valid') return 'success';
  if (status === 'invalid') return 'danger';
  if (status === 'not_validated') return 'neutral';
  return 'neutral';
}

export default async function InteroperabilityDetailPage({ params }: Props) {
  const supabase = createServiceClient();

  // Fetch latest FHIR export by intake_id
  const { data: exportRow, error } = await supabase
    .from('fhir_exports')
    .select('*')
    .eq('intake_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !exportRow) notFound();

  // Fetch intake context
  const { data: intake } = await supabase
    .from('intakes')
    .select(
      `
      id,
      patient_ref,
      chief_complaint,
      presenting_complaint,
      clinical_impression,
      status,
      workflow_stage,
      fhir_status,
      reviewed_at,
      reviewed_by,
      created_at
      `
    )
    .eq('id', params.id)
    .single();

  const fhirExport: FHIRExportRecord = {
    id: exportRow.id,
    intakeId: exportRow.intake_id,
    bundle: exportRow.bundle,
    patientResourceId: exportRow.patient_resource_id,
    observationResourceId: exportRow.observation_resource_id,
    conditionResourceId: exportRow.condition_resource_id,
    encounterResourceId: exportRow.encounter_resource_id,
    clinicalImpressionId: exportRow.clinical_impression_id,
    validationStatus: exportRow.validation_status,
    validationErrors: exportRow.validation_errors,
    validatedAt: exportRow.validated_at,
    exportedAt: exportRow.exported_at,
    exportDestination: exportRow.export_destination,
    createdAt: exportRow.created_at,
    updatedAt: exportRow.updated_at,
  };

  const resourceCount = fhirExport.bundle.entry?.length ?? 0;

  const clinicalSummary =
    intake?.chief_complaint ??
    intake?.presenting_complaint ??
    intake?.clinical_impression ??
    'No clinical summary documented';

  const fhirStatus = intake?.fhir_status ?? 'not_generated';
  const workflowStage = intake?.workflow_stage ?? 'fhir_export';
  const caseStatus = intake?.status ?? 'approved';

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/dashboard/interoperability"
          style={{
            fontSize: 12,
            color: ACCENT,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ← Back to FHIR Center
        </Link>
      </div>

      {/* Case / FHIR header */}
      <div
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '16px 18px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 6,
              }}
            >
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                FHIR bundle — {intake?.patient_ref ?? params.id}
              </h1>

              <Badge label={formatLabel(caseStatus)} tone="success" />
              <Badge
                label={formatLabel(fhirStatus)}
                tone={getFhirTone(fhirStatus)}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                maxWidth: 720,
              }}
            >
              {clinicalSummary}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, auto)',
              gap: 14,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>Workflow stage</div>
              <div style={{ color: ACCENT, fontWeight: 600 }}>
                {formatLabel(workflowStage)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>Generated</div>
              <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {new Date(fhirExport.createdAt).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow tracker */}
      <div
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            color: 'var(--color-text-primary)',
          }}
        >
          Case workflow
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
          }}
        >
          {[
            'Intake',
            'AI Extraction',
            'Clinical Review',
            'Approval',
            'FHIR Export',
          ].map((step, index) => {
            const isCompleted = index < 4;
            const isActive = index === 4;

            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color:
                    isCompleted || isActive
                      ? ACCENT
                      : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      isCompleted || isActive
                        ? ACCENT
                        : 'var(--color-background-secondary)',
                    border: `1px solid ${
                      isCompleted || isActive
                        ? ACCENT
                        : 'var(--color-border-tertiary)'
                    }`,
                    color:
                      isCompleted || isActive
                        ? '#fff'
                        : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bundle info strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '0.75rem 1rem',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Bundle type
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {fhirExport.bundle.type ?? 'collection'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '0.75rem 1rem',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Resources
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {resourceCount} resources
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '0.75rem 1rem',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Validation
          </div>
          <Badge
            label={formatLabel(fhirExport.validationStatus)}
            tone={getValidationTone(fhirExport.validationStatus)}
          />
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '0.75rem 1rem',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Export destination
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fhirExport.exportDestination ?? 'Stored locally'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '0.75rem 1rem',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginBottom: 4,
            }}
          >
            Bundle ID
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fhirExport.bundle.id ?? fhirExport.id}
          </div>
        </div>
      </div>

      {/* Resource map */}
      <div
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Generated FHIR resources
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0,
          }}
        >
          {[
            { label: 'Patient', value: fhirExport.patientResourceId },
            { label: 'Encounter', value: fhirExport.encounterResourceId },
            { label: 'Observation', value: fhirExport.observationResourceId },
            { label: 'Condition', value: fhirExport.conditionResourceId },
            {
              label: 'ClinicalImpression',
              value: fhirExport.clinicalImpressionId,
            },
          ].map((resource) => (
            <div
              key={resource.label}
              style={{
                padding: '12px 14px',
                borderRight: '0.5px solid var(--color-border-tertiary)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 4,
                }}
              >
                {resource.label}
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: ACCENT,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {resource.value ?? 'Not generated'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FHIRBundleViewer fhirExport={fhirExport} />
    </div>
  );
}