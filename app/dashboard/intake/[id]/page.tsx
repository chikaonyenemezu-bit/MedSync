import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/client';
import ExtractedDataCard from '@/components/intake/ExtractedDataCard';
import CodingSuggestions from '@/components/intake/CodingSuggestions';
import ReviewPanel from '@/components/review/ReviewPanel';
import { StatusBadge, UrgencyBadge } from '@/components/shared/StatusBadge';
import type { IntakeRecord } from '@/types/intake';

interface Props {
  params: { id: string };
}

const ACCENT = '#1A56A0';

const WORKFLOW_STEPS = [
  {
    key: 'intake',
    label: 'Intake',
  },
  {
    key: 'ai_extraction',
    label: 'AI Extraction',
  },
  {
    key: 'clinical_review',
    label: 'Clinical Review',
  },
  {
    key: 'approval',
    label: 'Approval',
  },
  {
    key: 'fhir_export',
    label: 'FHIR Export',
  },
];

type IntakeDetailRecord = IntakeRecord & {
  workflowStage: string | null;
  fhirStatus: string | null;
  demographics: string | null;
  presentingComplaint: string | null;
  medicationHistory: string | null;
  recentMedicationChanges: string | null;
  allergiesClinicalHistory: string | null;
};

function mapRow(row: Record<string, unknown>): IntakeDetailRecord {
  return {
    id: row.id as string,
    patientRef: row.patient_ref as string,
    narrative: row.narrative as string,

    chiefComplaint: row.chief_complaint as string | null,
    duration: row.duration as string | null,
    onset: row.onset as string | null,
    severity: row.severity as string | null,
    associatedSymptoms: row.associated_symptoms as string[] | null,
    aggravatingFactors: row.aggravating_factors as string[] | null,
    alleviatingFactors: row.alleviating_factors as string[] | null,
    trigger: row.trigger as string | null,

    icd10Suggestion: row.icd10_suggestion as string | null,
    icd10Display: row.icd10_display as string | null,
    snomedSuggestion: row.snomed_suggestion as string | null,
    snomedDisplay: row.snomed_display as string | null,

    clinicalImpression: row.clinical_impression as string | null,
    urgency: row.urgency as IntakeRecord['urgency'],
    status: row.status as IntakeRecord['status'],

    reviewedBy: row.reviewed_by as string | null,
    reviewedAt: row.reviewed_at as string | null,
    rejectionReason: row.rejection_reason as string | null,
    clinicianNotes: row.clinician_notes as string | null,
    icd10Confirmed: row.icd10_confirmed as string | null,
    snomedConfirmed: row.snomed_confirmed as string | null,

    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,

    workflowStage: row.workflow_stage as string | null,
    fhirStatus: row.fhir_status as string | null,

    demographics: row.demographics as string | null,
    presentingComplaint: row.presenting_complaint as string | null,
    medicationHistory: row.medication_history as string | null,
    recentMedicationChanges: row.recent_medication_changes as string | null,
    allergiesClinicalHistory: row.allergies_clinical_history as string | null,
  };
}

function formatWorkflowLabel(value: string | null) {
  if (!value) return 'Not set';

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getCurrentWorkflowIndex(workflowStage: string | null, status: string | null) {
  if (workflowStage === 'fhir_export' || workflowStage === 'exported') return 4;
  if (workflowStage === 'approval' || status === 'approved') return 3;
  if (workflowStage === 'clinical_review') return 2;
  if (workflowStage === 'ai_extraction') return 1;

  return 0;
}

function WorkflowTracker({
  workflowStage,
  status,
}: {
  workflowStage: string | null;
  status: string | null;
}) {
  const currentIndex = getCurrentWorkflowIndex(workflowStage, status);

  return (
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
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div
              key={step.key}
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

              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          lineHeight: 1.6,
          fontStyle: value ? 'normal' : 'italic',
        }}
      >
        {value || 'Not documented'}
      </div>
    </div>
  );
}

export default async function IntakeDetailPage({ params }: Props) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('intakes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) notFound();

  const intake = mapRow(data);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1160, margin: '0 auto' }}>
      {/* Case status header */}
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
                {intake.patientRef}
              </h1>

              <StatusBadge status={intake.status} />
              <UrgencyBadge urgency={intake.urgency} />
            </div>

            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
              }}
            >
              Created {new Date(intake.createdAt).toLocaleString('en-GB')} · Last
              updated {new Date(intake.updatedAt).toLocaleString('en-GB')}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, auto)',
              gap: 12,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>Current stage</div>
              <div
                style={{
                  color: ACCENT,
                  fontWeight: 600,
                }}
              >
                {formatWorkflowLabel(intake.workflowStage)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>FHIR status</div>
              <div
                style={{
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                }}
              >
                {formatWorkflowLabel(intake.fhirStatus)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>Case ID</div>
              <div
                style={{
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {intake.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WorkflowTracker
        workflowStage={intake.workflowStage}
        status={intake.status}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nurse documented intake */}
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
              }}
            >
              Nurse-documented clinical intake
            </div>

            <div style={{ padding: '0 1rem' }}>
              <DetailItem
                label="Patient demographics"
                value={intake.demographics}
              />
              <DetailItem
                label="Presenting complaint"
                value={intake.presentingComplaint}
              />
              <DetailItem
                label="Medication history"
                value={intake.medicationHistory}
              />
              <DetailItem
                label="Recent medication changes"
                value={intake.recentMedicationChanges}
              />
              <DetailItem
                label="Allergies, reactions and clinical history"
                value={intake.allergiesClinicalHistory}
              />
            </div>
          </div>

          {/* Patient narrative */}
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
              }}
            >
              Generated clinical narrative
            </div>

            <div
              style={{
                padding: '0.875rem 1rem',
                fontSize: 13,
                lineHeight: 1.7,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-background-secondary)',
              }}
            >
              “{intake.narrative}”
            </div>
          </div>

          <ExtractedDataCard intake={intake} />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CodingSuggestions intake={intake} />
          <ReviewPanel intake={intake} />
        </div>
      </div>
    </div>
  );
}