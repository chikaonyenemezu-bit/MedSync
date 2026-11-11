'use client';

import type { IntakeRecord } from '@/types/intake';

interface Props {
  intake: IntakeRecord;
  onOverride?: (field: 'icd10' | 'snomed', value: string) => void;
}

// English display labels for common ICD-10-GM codes.
// The official ICD-10-GM source label can remain German, but the UI should show English first.
const ICD10_EN: Record<string, string> = {
  'R07.1': 'Chest pain on breathing',
  'R07.2': 'Precordial pain',
  'R07.3': 'Other chest pain',
  'R07.4': 'Chest pain, unspecified',
  R51: 'Headache',
  R42: 'Dizziness and giddiness',
  'R10.0': 'Acute abdomen',
  'R10.1': 'Pain localised to upper abdomen',
  'R10.4': 'Other and unspecified abdominal pain',
  'R06.0': 'Dyspnoea',
  'R06.00': 'Dyspnoea, unspecified',
  'R50.9': 'Fever, unspecified',
  'R04.0': 'Epistaxis',
  R11: 'Nausea and vomiting',
  R55: 'Syncope and collapse',
  'R00.0': 'Tachycardia, unspecified',
  'G43.9': 'Migraine, unspecified',
  'I20.9': 'Angina pectoris, unspecified',
  'J06.9': 'Acute upper respiratory infection, unspecified',
  'J18.9': 'Pneumonia, unspecified',
  'K29.7': 'Gastritis, unspecified',
  'K21.0': 'Gastro-oesophageal reflux with oesophagitis',
  'M54.5': 'Low back pain',
  'F32.9': 'Depressive episode, unspecified',
  'F41.9': 'Anxiety disorder, unspecified',
};

function cleanCode(code: string | null | undefined) {
  if (!code) return null;
  return code.trim().toUpperCase();
}

function getEnglishIcd10Label(code: string | null | undefined) {
  const cleaned = cleanCode(code);
  if (!cleaned) return null;

  return ICD10_EN[cleaned] ?? null;
}

function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'blue' | 'purple' | 'green' | 'orange' | 'neutral';
}) {
  const tones = {
    blue: {
      background: '#EBF2FB',
      color: '#0C447C',
    },
    purple: {
      background: '#EEEDFE',
      color: '#534AB7',
    },
    green: {
      background: '#EAF3DE',
      color: '#3B6D11',
    },
    orange: {
      background: '#FFF7E8',
      color: '#854F0B',
    },
    neutral: {
      background: '#F5F5F4',
      color: '#6B6B6B',
    },
  };

  return (
    <span
      style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 999,
        fontWeight: 600,
        width: 'fit-content',
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

export default function CodingSuggestions({ intake, onOverride }: Props) {
  const icd10 = cleanCode(intake.icd10Confirmed ?? intake.icd10Suggestion);
  const snomed = intake.snomedConfirmed ?? intake.snomedSuggestion;

  const isICD10Overridden =
    !!intake.icd10Confirmed &&
    intake.icd10Confirmed !== intake.icd10Suggestion;

  const isSNOMEDOverridden =
    !!intake.snomedConfirmed &&
    intake.snomedConfirmed !== intake.snomedSuggestion;

  const officialGermanLabel = intake.icd10Display?.trim() ?? '';
  const englishLabel = getEnglishIcd10Label(icd10);

  const primaryIcdLabel =
    englishLabel ??
    officialGermanLabel ??
    'No ICD-10-GM label available';

  const showGermanSource =
    officialGermanLabel &&
    officialGermanLabel.toLowerCase() !== primaryIcdLabel.toLowerCase();

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
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span>Coding suggestions</span>

        <Badge tone="blue">AI-generated · clinician must confirm</Badge>
      </div>

      <div
        style={{
          padding: '0.875rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* ICD-10-GM */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 7,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
            >
              ICD-10-GM 2025
            </span>

            <Badge tone="neutral">German source catalog</Badge>

            {isICD10Overridden && <Badge tone="purple">Clinician override</Badge>}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                padding: '4px 10px',
                borderRadius: 'var(--border-radius-md)',
                background: '#EBF2FB',
                color: '#0C447C',
                fontWeight: 700,
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              {icd10 ?? '—'}
            </span>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {primaryIcdLabel}
              </div>

              {showGermanSource && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  Official ICD-10-GM German label:{' '}
                  <span style={{ fontStyle: 'italic' }}>
                    {officialGermanLabel}
                  </span>
                </div>
              )}

              {englishLabel && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  English display label used for dashboard readability.
                </div>
              )}

              {!englishLabel && officialGermanLabel && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  English display label not mapped yet. Showing official German
                  ICD-10-GM source label.
                </div>
              )}

              {onOverride && (
                <button
                  type="button"
                  onClick={() => onOverride('icd10', icd10 ?? '')}
                  style={{
                    marginTop: 8,
                    border: '0.5px solid var(--color-border-secondary)',
                    background: 'var(--color-background-primary)',
                    color: '#0C447C',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '5px 9px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Override ICD-10-GM
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            height: '0.5px',
            background: 'var(--color-border-tertiary)',
          }}
        />

        {/* SNOMED CT */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 7,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
            >
              SNOMED CT
            </span>

            {isSNOMEDOverridden && <Badge tone="purple">Clinician override</Badge>}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                padding: '4px 10px',
                borderRadius: 'var(--border-radius-md)',
                background: '#EEEDFE',
                color: '#3C3489',
                fontWeight: 700,
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              {snomed ?? '—'}
            </span>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {intake.snomedDisplay ?? 'No SNOMED CT label available'}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                SNOMED CT concept validated through the terminology service.
              </div>

              {onOverride && (
                <button
                  type="button"
                  onClick={() => onOverride('snomed', snomed ?? '')}
                  style={{
                    marginTop: 8,
                    border: '0.5px solid var(--color-border-secondary)',
                    background: 'var(--color-background-primary)',
                    color: '#3C3489',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '5px 9px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Override SNOMED CT
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            padding: '8px 10px',
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-md)',
            lineHeight: 1.5,
          }}
        >
          ICD-10-GM codes are validated against the German BfArM catalog. MedSync
          shows English-friendly labels where available, while retaining the
          official German source label for traceability. Suggestions must be
          confirmed or overridden by a clinician before approval.
        </div>
      </div>
    </div>
  );
}