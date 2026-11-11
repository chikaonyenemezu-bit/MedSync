'use client';

import type { IntakeRecord } from '@/types/intake';

interface Props {
  intake: IntakeRecord;
}

const FIELDS = [
  { key: 'chiefComplaint',      label: 'Chief complaint' },
  { key: 'duration',            label: 'Duration' },
  { key: 'onset',               label: 'Onset' },
  { key: 'severity',            label: 'Severity' },
  { key: 'trigger',             label: 'Trigger' },
  { key: 'clinicalImpression',  label: 'Clinical impression' },
] as const;

export default function ExtractedDataCard({ intake }: Props) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        fontSize: 13, fontWeight: 500,
      }}>
        AI extracted data
      </div>

      <div style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13 }}>{intake[key] ?? '—'}</div>
            </div>
          ))}
        </div>

        {intake.associatedSymptoms && intake.associatedSymptoms.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Associated symptoms</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {intake.associatedSymptoms.map((s, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: '2px 10px', borderRadius: 999,
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {intake.aggravatingFactors && intake.aggravatingFactors.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Aggravating factors</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {intake.aggravatingFactors.map((f, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: '2px 10px', borderRadius: 999,
                  background: '#FAEEDA', color: '#854F0B',
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
