'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';
import {
  Bell,
  ChevronDown,
  Check,
  Edit,
  Download,
  ArrowUpRight,
  User,
  Activity,
  FileText,
  Eye,
  Stethoscope,
  Database,
  ClipboardList,
  GitBranch,
  ShieldCheck,
  Clock,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { StatusBadge, UrgencyBadge } from '@/components/shared/StatusBadge';
import type { IntakeStatus, UrgencyLevel } from '@/types/intake';

const ACCENT = '#1A56A0';
const ACCENT_LIGHT = '#EBF2FB';

interface Metrics {
  totalIntakes: number;
  pending: number;
  approved: number;
  fhirExports: number;
}

interface RecentIntake {
  id: string;
  patient_ref: string;
  chief_complaint: string | null;
  duration: string | null;
  onset: string | null;
  severity: string | null;
  associated_symptoms: string[] | null;
  aggravating_factors: string[] | null;
  clinical_impression: string | null;
  icd10_suggestion: string | null;
  icd10_display: string | null;
  snomed_suggestion: string | null;
  narrative: string;
  urgency: UrgencyLevel;
  status: IntakeStatus;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  actor_label: string | null;
}

interface DonutSlice {
  label: string;
  pct: number;
  color: string;
}

interface FHIRExport {
  intake_id: string;
  bundle: {
    resourceType: string;
    type: string;
    id: string;
    entry?: { resource: { resourceType: string; id: string } }[];
  };
  validation_status: string;
  export_destination?: string | null;
  exported_at?: string | null;
  created_at: string;
}

interface Props {
  metrics: Metrics;
  recentIntakes: RecentIntake[];
  recentActivity: ActivityEntry[];
  sparkData: {
    intakes: number[];
    pending: number[];
    approved: number[];
    fhir: number[];
  };
  donutData: DonutSlice[];
  fhirByIntake: Record<string, FHIRExport>;
}

const FHIR_ICONS: Record<string, ElementType> = {
  Patient: User,
  Encounter: Activity,
  Condition: FileText,
  Observation: Eye,
  ClinicalImpression: Stethoscope,
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((value) => ({ value }));

  return (
    <ResponsiveContainer width="100%" height={34}>
      <LineChart data={pts}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.8}
          dot={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 10,
            padding: '4px 7px',
            borderRadius: 6,
            border: '0.5px solid var(--color-border-tertiary)',
          }}
          formatter={(value) => [value, '']}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data }: { data: DonutSlice[] }) {
  const radius = 32;
  const cx = 45;
  const cy = 45;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg
      width={90}
      height={90}
      viewBox="0 0 90 90"
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
    >
      {data.map((item, index) => {
        const dash = (item.pct / 100) * circumference;
        const offset = circumference - (cumulative / 100) * circumference;
        cumulative += item.pct;

        return (
          <circle
            key={`${item.label}-${index}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={14}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

function SmallBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'orange' | 'red' | 'neutral' | 'purple';
}) {
  const tones = {
    blue: {
      background: '#EBF2FB',
      color: '#0C447C',
    },
    green: {
      background: '#EAF3DE',
      color: '#3B6D11',
    },
    orange: {
      background: '#FFF7E8',
      color: '#854F0B',
    },
    red: {
      background: '#FCEBEB',
      color: '#A32D2D',
    },
    neutral: {
      background: '#F5F5F4',
      color: '#6B6B6B',
    },
    purple: {
      background: '#EEEDFE',
      color: '#3C3489',
    },
  };

  return (
    <span
      style={{
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 999,
        width: 'fit-content',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  color,
  spark,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  color: string;
  spark: number[];
  icon: ElementType;
}) {
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1rem 1.125rem',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div>
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
              fontSize: 29,
              fontWeight: 700,
              letterSpacing: '-0.6px',
              lineHeight: 1,
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--border-radius-md)',
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={17} color={color} />
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          marginBottom: 4,
        }}
      >
        {helper}
      </div>

      <Spark data={spark} color={color} />
    </div>
  );
}

function WorkflowStep({
  label,
  value,
  icon: Icon,
  active,
}: {
  label: string;
  value: number;
  icon: ElementType;
  active?: boolean;
}) {
  return (
    <div
      style={{
        background: active ? ACCENT_LIGHT : 'var(--color-background-primary)',
        border: `0.5px solid ${
          active ? '#B5D4F4' : 'var(--color-border-tertiary)'
        }`,
        borderRadius: 'var(--border-radius-lg)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: active ? ACCENT : 'var(--color-background-secondary)',
          color: active ? '#fff' : 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>

      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
            color: active ? ACCENT : 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.3,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.1px',
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {action}
      </div>

      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div
      style={{
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'var(--color-background-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
        }}
      >
        <FileText size={18} color="var(--color-text-secondary)" />
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          maxWidth: 280,
          margin: '0 auto',
        }}
      >
        {description}
      </div>

      {href && action && (
        <Link
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 12,
            fontSize: 12,
            color: ACCENT,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {action}
          <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  );
}

export default function DashboardClient({
  metrics,
  recentIntakes,
  recentActivity,
  sparkData,
  donutData,
  fhirByIntake,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    recentIntakes[0]?.id ?? null
  );

  const selected =
    recentIntakes.find((intake) => intake.id === selectedId) ??
    recentIntakes[0] ??
    null;

  const selectedFHIR = selected ? fhirByIntake[selected.id] : null;

  const extractedCount = recentIntakes.filter(
    (intake) => intake.chief_complaint || intake.clinical_impression
  ).length;

  const clinicalSummary =
    selected?.chief_complaint ??
    selected?.clinical_impression ??
    'No clinical summary available yet';

  const metricCards = [
    {
      label: 'Clinical intakes',
      value: metrics.totalIntakes,
      helper: 'Nurse-led narratives captured',
      color: '#378ADD',
      spark: sparkData.intakes,
      icon: ClipboardList,
    },
    {
      label: 'In review',
      value: metrics.pending,
      helper: 'Awaiting clinician decision',
      color: '#E2904A',
      spark: sparkData.pending,
      icon: Clock,
    },
    {
      label: 'Approved',
      value: metrics.approved,
      helper: 'Reviewed clinical records',
      color: '#3B9E6A',
      spark: sparkData.approved,
      icon: ShieldCheck,
    },
    {
      label: 'FHIR exports',
      value: metrics.fhirExports,
      helper: 'Bundles generated for exchange',
      color: '#7F77DD',
      spark: sparkData.fhir,
      icon: Database,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--color-background-secondary)',
      }}
    >
      {/* Topbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.5rem',
          background: 'var(--color-background-primary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '-0.3px',
            }}
          >
            Clinical Dashboard

          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              marginTop: 2,
            }}
          >
            Monitor clinical intake, AI extraction, review decisions, and FHIR
            interoperability.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/dashboard/intake/new"
            style={{
              background: ACCENT,
              color: '#fff',
              borderRadius: 'var(--border-radius-md)',
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            New clinical intake
          </Link>

          <div style={{ position: 'relative' }}>
            <Bell
              size={18}
              color="var(--color-text-secondary)"
              style={{ cursor: 'pointer' }}
            />

            {metrics.pending > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  background: '#E24B4A',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {metrics.pending}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              DR
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Dr. Sarah Miller
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Clinical Reviewer
              </div>
            </div>

            <ChevronDown size={14} color="var(--color-text-secondary)" />
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
        }}
      >
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EBF2FB 100%)',
            border: '0.5px solid #B5D4F4',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.25rem 1.35rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            boxShadow: '0 14px 30px rgba(26, 86, 160, 0.08)',
          }}
        >
          <div>
            <SmallBadge tone="blue">
              <GitBranch size={11} />
              Clinical interoperability workflow
            </SmallBadge>

            <h1
              style={{
                fontSize: 26,
                fontWeight: 750,
                letterSpacing: '-0.7px',
                margin: '10px 0 6px',
                lineHeight: 1.15,
              }}
            >
              From nurse-led patient narratives to FHIR-ready clinical records.
            </h1>

            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 780,
              }}
            >
              NexusCare captures clinical intake narratives, extracts structured
              information, supports clinician review, and generates interoperable
              FHIR R4 bundles for audit and exchange.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Link
              href="/dashboard/review"
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid #B5D4F4',
                color: ACCENT,
                background: '#fff',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Review queue
            </Link>

            <Link
              href="/dashboard/interoperability"
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--border-radius-md)',
                border: 'none',
                color: '#fff',
                background: ACCENT,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              FHIR Center
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >

          {metricCards.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        {/* Workflow pipeline */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <WorkflowStep
            label="Intake created"
            value={metrics.totalIntakes}
            icon={ClipboardList}
            active
          />
          <WorkflowStep
            label="AI extracted"
            value={extractedCount}
            icon={Activity}
          />
          <WorkflowStep
            label="Clinical review"
            value={metrics.pending}
            icon={Stethoscope}
            active={metrics.pending > 0}
          />
          <WorkflowStep
            label="Approved"
            value={metrics.approved}
            icon={ShieldCheck}
          />
          <WorkflowStep
            label="FHIR exported"
            value={metrics.fhirExports}
            icon={Database}
          />
        </div>

        {/* Main command area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            gap: 14,
            marginBottom: 14,
            alignItems: 'start',
          }}
        >
          {/* Case queue */}
          <SectionCard
            title="Active case queue"
            subtitle="Recent intakes moving through the review workflow"
            action={
              <Link
                href="/dashboard/review"
                style={{
                  fontSize: 11,
                  color: ACCENT,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                View all
              </Link>
            }
          >
            {recentIntakes.length === 0 ? (
              <EmptyState
                title="No intakes yet"
                description="Create the first nurse-led clinical intake to start the workflow."
                href="/dashboard/intake/new"
                action="Create intake"
              />
            ) : (
              <div>
                {recentIntakes.map((intake) => {
                  const isSelected = selected?.id === intake.id;

                  return (
                    <button
                      key={intake.id}
                      onClick={() => setSelectedId(intake.id)}
                      style={{
                        width: '100%',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: isSelected ? ACCENT_LIGHT : 'transparent',
                        borderLeft: isSelected
                          ? `3px solid ${ACCENT}`
                          : '3px solid transparent',
                        borderBottom:
                          '0.5px solid var(--color-border-tertiary)',
                        padding: '11px 13px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background:
                                intake.urgency === 'emergency' ||
                                intake.urgency === 'urgent'
                                  ? '#E24B4A'
                                  : intake.urgency === 'moderate'
                                    ? '#EF9F27'
                                    : '#639922',
                            }}
                          />

                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {intake.patient_ref}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {formatTime(intake.created_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.45,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 7,
                        }}
                      >
                        {intake.chief_complaint ??
                          intake.clinical_impression ??
                          'Pending AI extraction'}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <StatusBadge status={intake.status} />
                        <UrgencyBadge urgency={intake.urgency} />
                      </div>
                    </button>
                  );
                })}

                <div
                  style={{
                    padding: '10px 1rem',
                    borderTop: '0.5px solid var(--color-border-tertiary)',
                  }}
                >
                  <Link
                    href="/dashboard/intake/new"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      fontSize: 12,
                      color: ACCENT,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Create new clinical intake
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Selected workspace */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'auto auto',
              gap: 14,
            }}
          >
            <SectionCard
              title={
                selected
                  ? `Case workspace — ${selected.patient_ref}`
                  : 'Case workspace'
              }
              subtitle="Review extracted clinical data, coding suggestions, and interoperability readiness"
              action={
                selected ? (
                  <Link
                    href={`/dashboard/intake/${selected.id}`}
                    style={{
                      fontSize: 11,
                      color: ACCENT,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Open full case
                    <ArrowUpRight size={12} />
                  </Link>
                ) : null
              }
            >
              {!selected ? (
                <EmptyState
                  title="No case selected"
                  description="Select a case from the queue to review clinical extraction and FHIR output."
                />
              ) : (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr 1fr',
                      gap: 0,
                      borderBottom:
                        '0.5px solid var(--color-border-tertiary)',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 1rem',
                        borderRight:
                          '0.5px solid var(--color-border-tertiary)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          marginBottom: 4,
                        }}
                      >
                        Presenting complaint
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}
                      >
                        {clinicalSummary}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 1rem',
                        borderRight:
                          '0.5px solid var(--color-border-tertiary)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          marginBottom: 6,
                        }}
                      >
                        Current status
                      </div>

                      <StatusBadge status={selected.status} />
                    </div>

                    <div style={{ padding: '12px 1rem' }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          marginBottom: 6,
                        }}
                      >
                        Urgency
                      </div>

                      <UrgencyBadge urgency={selected.urgency} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        borderRight:
                          '0.5px solid var(--color-border-tertiary)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        <FileText size={14} color={ACCENT} />
                        Clinical narrative
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.7,
                          color: 'var(--color-text-secondary)',
                          background: 'var(--color-background-secondary)',
                          padding: '10px 12px',
                          borderRadius: 'var(--border-radius-md)',
                          maxHeight: 132,
                          overflow: 'hidden',
                          fontStyle: 'italic',
                        }}
                      >
                        “{selected.narrative}”
                      </div>
                    </div>

                    <div style={{ padding: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        <Activity size={14} color={ACCENT} />
                        AI extracted data
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px 12px',
                        }}
                      >
                        {[
                          ['Duration', selected.duration],
                          ['Onset', selected.onset],
                          ['Severity', selected.severity],
                          [
                            'Symptoms',
                            selected.associated_symptoms?.join(', '),
                          ],
                          [
                            'Aggravating',
                            selected.aggravating_factors?.join(', '),
                          ],
                          ['Impression', selected.clinical_impression],
                        ].map(([label, value]) => (
                          <div key={label as string}>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'var(--color-text-secondary)',
                                marginBottom: 2,
                              }}
                            >
                              {label}
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: value ? 700 : 400,
                                color: value
                                  ? 'var(--color-text-primary)'
                                  : 'var(--color-text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {(value as string) || 'Not extracted'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '0.5px solid var(--color-border-tertiary)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      {selected.icd10_suggestion ? (
                        <SmallBadge tone="blue">
                          ICD-10 {selected.icd10_suggestion}
                        </SmallBadge>
                      ) : (
                        <SmallBadge>ICD-10 pending</SmallBadge>
                      )}

                      {selected.snomed_suggestion ? (
                        <SmallBadge tone="purple">
                          SNOMED CT {selected.snomed_suggestion}
                        </SmallBadge>
                      ) : (
                        <SmallBadge>SNOMED pending</SmallBadge>
                      )}

                      {selectedFHIR ? (
                        <SmallBadge tone="green">
                          <Check size={10} />
                          FHIR generated
                        </SmallBadge>
                      ) : (
                        <SmallBadge tone="orange">
                          <AlertTriangle size={10} />
                          FHIR pending approval
                        </SmallBadge>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <Link
                        href={`/dashboard/intake/${selected.id}`}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--border-radius-md)',
                          border: '0.5px solid var(--color-border-secondary)',
                          background: '#fff',
                          fontSize: 12,
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textDecoration: 'none',
                          fontWeight: 700,
                        }}
                      >
                        <Edit size={13} />
                        Review case
                      </Link>

                      <Link
                        href={`/dashboard/intake/${selected.id}`}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--border-radius-md)',
                          border: 'none',
                          background: ACCENT,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textDecoration: 'none',
                        }}
                      >
                        <Check size={13} />
                        Approve / reject
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Interoperability output"
              subtitle="FHIR R4 bundle preview generated after clinician approval"
              action={
                selectedFHIR && selected ? (
                  <Link
                    href={`/dashboard/interoperability/${selected.id}`}
                    style={{
                      fontSize: 11,
                      color: ACCENT,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Open FHIR bundle
                    <ArrowUpRight size={12} />
                  </Link>
                ) : null
              }
            >
              {!selected ? (
                <EmptyState
                  title="No case selected"
                  description="Select a case to preview its interoperability output."
                />
              ) : !selectedFHIR ? (
                <div
                  style={{
                    padding: '1.25rem 1rem',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <SmallBadge tone="orange">
                      <Clock size={10} />
                      FHIR not generated
                    </SmallBadge>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        marginTop: 10,
                        marginBottom: 6,
                      }}
                    >
                      Approve this case to generate a FHIR R4 bundle.
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.7,
                        maxWidth: 520,
                      }}
                    >
                      Once approved, NexusCare creates a machine-readable FHIR
                      transaction bundle containing Patient, Encounter,
                      Observation, Condition, and ClinicalImpression resources.
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--color-background-secondary)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '12px 14px',
                      fontSize: 11,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.8,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      Bundle will include:
                    </div>
                    <div>• Patient resource</div>
                    <div>• Encounter context</div>
                    <div>• Clinical observations</div>
                    <div>• Condition / complaint coding</div>
                    <div>• ClinicalImpression summary</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      borderBottom:
                        '0.5px solid var(--color-border-tertiary)',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 1rem',
                        borderRight:
                          '0.5px solid var(--color-border-tertiary)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        What this is
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        A FHIR R4 transaction bundle generated from the approved
                        intake.
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px 1rem',
                        borderRight:
                          '0.5px solid var(--color-border-tertiary)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        What it contains
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        Patient, Encounter, Observation, Condition, and
                        ClinicalImpression resources.
                      </div>
                    </div>

                    <div style={{ padding: '12px 1rem' }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        Why it matters
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        Enables structured exchange, auditability, validation,
                        and interoperability.
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.9fr 1.1fr',
                      gap: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderRight:
                          '0.5px solid var(--color-border-tertiary)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Bundle resources
                        </div>

                        <SmallBadge tone="green">
                          <Check size={10} />
                          {selectedFHIR.bundle.entry?.length ?? 0} generated
                        </SmallBadge>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {(selectedFHIR.bundle.entry ?? []).map(
                          (entry, index) => {
                            const resourceType = entry.resource.resourceType;
                            const Icon =
                              FHIR_ICONS[resourceType] ?? FileText;

                            return (
                              <div
                                key={`${resourceType}-${index}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  background:
                                    'var(--color-background-secondary)',
                                  borderRadius: 'var(--border-radius-md)',
                                  padding: '7px 9px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    minWidth: 0,
                                  }}
                                >
                                  <Icon size={14} color={ACCENT} />

                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {resourceType}
                                    </div>

                                    <div
                                      style={{
                                        fontSize: 10,
                                        color:
                                          'var(--color-text-secondary)',
                                        fontFamily: 'monospace',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 190,
                                      }}
                                    >
                                      {resourceType}/{entry.resource.id}
                                    </div>
                                  </div>
                                </div>

                                <Check size={14} color="#639922" />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem 1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Generated FHIR R4 Bundle JSON
                          </div>

                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--color-text-secondary)',
                              marginTop: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            Structured output created after clinical approval.
                          </div>
                        </div>

                        <SmallBadge
                          tone={
                            selectedFHIR.validation_status === 'valid'
                              ? 'green'
                              : 'neutral'
                          }
                        >
                          {selectedFHIR.validation_status}
                        </SmallBadge>
                      </div>

                      <pre
                        style={{
                          fontSize: 10,
                          background: 'var(--color-background-secondary)',
                          borderRadius: 'var(--border-radius-md)',
                          padding: '10px 12px',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                          margin: 0,
                          color: 'var(--color-text-secondary)',
                          fontFamily: 'monospace',
                          maxHeight: 145,
                        }}
                      >
                        {JSON.stringify(
                          {
                            resourceType: 'Bundle',
                            type: selectedFHIR.bundle.type,
                            id: selectedFHIR.bundle.id,
                            entry: selectedFHIR.bundle.entry?.map((entry) => ({
                              resourceType: entry.resource.resourceType,
                              id: entry.resource.id,
                            })),
                          },
                          null,
                          2
                        )}
                      </pre>

                      <div
                        style={{
                          marginTop: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          Export destination:{' '}
                          <span
                            style={{
                              color: 'var(--color-text-primary)',
                              fontWeight: 700,
                            }}
                          >
                            {selectedFHIR.export_destination ??
                              'Stored locally'}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/interoperability/${selected.id}`}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 'var(--border-radius-md)',
                            border: '0.5px solid #378ADD',
                            background: 'none',
                            fontSize: 12,
                            color: '#378ADD',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            textDecoration: 'none',
                            flexShrink: 0,
                          }}
                        >
                          <Download size={13} />
                          Full bundle
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            gap: 14,
          }}
        >
          <SectionCard
            title="Recent audit activity"
            subtitle="Latest workflow events across intakes, reviews, and FHIR exports"
            action={
              <Link
                href="/dashboard/audit"
                style={{
                  fontSize: 11,
                  color: ACCENT,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                View audit trail
              </Link>
            }
          >
            {recentActivity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Audit events will appear after intakes are created, reviewed, or exported."
              />
            ) : (
              <div>
                {recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr',
                      gap: 10,
                      padding: '10px 1rem',
                      borderBottom:
                        '0.5px solid var(--color-border-tertiary)',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {formatTime(entry.created_at)}
                    </span>

                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.45,
                          marginBottom: 2,
                        }}
                      >
                        {entry.description}
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {entry.actor_label ?? 'System'} · {entry.event_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Clinical analytics"
            subtitle="Complaint distribution and 7-day intake trend"
            action={
              <SmallBadge tone="blue">
                <BarChart3 size={10} />
                Live data
              </SmallBadge>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  borderRight: '0.5px solid var(--color-border-tertiary)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Intake by complaint type
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <DonutChart data={donutData} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {donutData.map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: item.color,
                            flexShrink: 0,
                          }}
                        />

                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--color-text-secondary)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.label}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem' }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Intake trend
                </div>

                <ResponsiveContainer width="100%" height={92}>
                  <LineChart
                    data={sparkData.intakes.map((value, index) => ({
                      value,
                      day: `Day ${index + 1}`,
                    }))}
                  >
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#378ADD"
                      strokeWidth={1.9}
                      dot={{ r: 2.7, fill: '#378ADD' }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 10 }}
                      formatter={(value) => [value, 'Intakes']}
                      labelFormatter={(label) => label}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      background: 'var(--color-background-secondary)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '8px 10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 2,
                      }}
                    >
                      This week
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 750,
                        color: ACCENT,
                      }}
                    >
                      {sparkData.intakes.reduce((a, b) => a + b, 0)}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--color-background-secondary)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '8px 10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 2,
                      }}
                    >
                      FHIR generated
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 750,
                        color: '#7F77DD',
                      }}
                    >
                      {metrics.fhirExports}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}