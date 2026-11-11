import { createServiceClient } from '@/lib/supabase/client';

export const revalidate = 0;

const EVENT_COLORS: Record<string, { bg: string; text: string }> = {
  intake_created:           { bg: '#E6F1FB', text: '#185FA5' },
  ai_extraction_completed:  { bg: '#EEEDFE', text: '#534AB7' },
  intake_approved:          { bg: '#EAF3DE', text: '#3B6D11' },
  intake_rejected:          { bg: '#FCEBEB', text: '#A32D2D' },
  intake_updated:           { bg: '#FAEEDA', text: '#854F0B' },
  fhir_bundle_generated:    { bg: '#EAF3DE', text: '#3B6D11' },
  fhir_bundle_validated:    { bg: '#EAF3DE', text: '#3B6D11' },
  fhir_bundle_exported:     { bg: '#EEEDFE', text: '#534AB7' },
  icd10_suggested:          { bg: '#F5F5F4', text: '#6B6B6B' },
  snomed_suggested:         { bg: '#F5F5F4', text: '#6B6B6B' },
  icd10_confirmed:          { bg: '#EAF3DE', text: '#3B6D11' },
  snomed_confirmed:         { bg: '#EAF3DE', text: '#3B6D11' },
  icd10_overridden:         { bg: '#FAEEDA', text: '#854F0B' },
  snomed_overridden:        { bg: '#FAEEDA', text: '#854F0B' },
};

function formatEventLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AuditPage() {
  const supabase = createServiceClient();

  const { data: entries } = await supabase
    .from('audit_log')
    .select(`
      id,
      event_type,
      description,
      actor_label,
      created_at,
      intake_id,
      intakes (patient_ref)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Audit trail</h1>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {entries?.length ?? 0} events recorded
        </div>
      </div>

      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '160px 120px 1fr 120px 160px',
          padding: '8px 1rem',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          fontSize: 11, fontWeight: 500,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.04em',
        }}>
          <span>Event</span>
          <span>Patient</span>
          <span>Description</span>
          <span>Actor</span>
          <span>Timestamp</span>
        </div>

        {!entries || entries.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            No audit events yet.
          </div>
        ) : (
          entries.map((entry, i) => {
            const colors = EVENT_COLORS[entry.event_type] ?? { bg: '#F5F5F4', text: '#6B6B6B' };
            const intake = Array.isArray(entry.intakes) ? entry.intakes[0] : entry.intakes;
            return (
              <div key={entry.id} style={{
                display: 'grid', gridTemplateColumns: '160px 120px 1fr 120px 160px',
                alignItems: 'center', padding: '10px 1rem', gap: 8,
                borderBottom: i < entries.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
              }}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  background: colors.bg, color: colors.text,
                  fontWeight: 500, width: 'fit-content',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 150,
                }}>
                  {formatEventLabel(entry.event_type)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  {intake?.patient_ref ?? '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {entry.description}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {entry.actor_label ?? 'System'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                  {new Date(entry.created_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}