import type { IntakeStatus, UrgencyLevel } from '@/types/intake';

const STATUS_CONFIG: Record<IntakeStatus, { bg: string; text: string; label: string }> = {
  pending:    { bg: '#FAEEDA', text: '#854F0B', label: 'Pending' },
  in_review:  { bg: '#E6F1FB', text: '#185FA5', label: 'In review' },
  approved:   { bg: '#EAF3DE', text: '#3B6D11', label: 'Approved' },
  rejected:   { bg: '#FCEBEB', text: '#A32D2D', label: 'Rejected' },
  exported:   { bg: '#EEEDFE', text: '#534AB7', label: 'Exported' },
};

const URGENCY_CONFIG: Record<UrgencyLevel, { bg: string; text: string; dot: string; label: string }> = {
  routine:   { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922',  label: 'Routine' },
  moderate:  { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27',  label: 'Moderate' },
  urgent:    { bg: '#FCEBEB', text: '#A32D2D', dot: '#E24B4A',  label: 'Urgent' },
  emergency: { bg: '#500000', text: '#FCEBEB', dot: '#E24B4A',  label: 'Emergency' },
};

interface StatusBadgeProps {
  status: IntakeStatus;
}

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  showDot?: boolean;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, padding: '3px 9px', borderRadius: 999,
      background: config.bg, color: config.text, fontWeight: 500,
    }}>
      {config.label}
    </span>
  );
}

export function UrgencyBadge({ urgency, showDot = true }: UrgencyBadgeProps) {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, padding: '3px 9px', borderRadius: 999,
      background: config.bg, color: config.text, fontWeight: 500,
    }}>
      {showDot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot }} />
      )}
      {config.label}
    </span>
  );
}
