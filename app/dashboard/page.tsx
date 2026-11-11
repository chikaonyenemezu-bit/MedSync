import { createServiceClient } from '@/lib/supabase/client';
import DashboardClient from './DashboardClient';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServiceClient();

  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const iso = sevenDaysAgo.toISOString();

  const [
    { count: totalIntakes },
    { count: pendingCount },
    { count: approvedCount },
    { count: fhirCount },
    { data: recentIntakes },
    { data: recentActivity },
    { data: last7Days },
    { data: allIntakes },
    { data: fhirExports },
  ] = await Promise.all([
    // Metric counts
    supabase.from('intakes').select('*', { count: 'exact', head: true }),
    supabase.from('intakes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('intakes').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('fhir_exports').select('*', { count: 'exact', head: true }),

    // Recent intakes with all fields for review panel
    supabase
      .from('intakes')
      .select('id, patient_ref, chief_complaint, duration, onset, severity, associated_symptoms, aggravating_factors, clinical_impression, icd10_suggestion, icd10_display, snomed_suggestion, narrative, urgency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),

    // Recent audit log
    supabase
      .from('audit_log')
      .select('id, event_type, description, created_at, actor_label')
      .order('created_at', { ascending: false })
      .limit(8),

    // Last 7 days intakes for sparkline
    supabase
      .from('intakes')
      .select('created_at, status')
      .gte('created_at', iso)
      .order('created_at', { ascending: true }),

    // All intakes for donut chart (chief complaint distribution)
    supabase
      .from('intakes')
      .select('chief_complaint'),

    // FHIR exports for selected intakes
    supabase
  .from('fhir_exports')
  .select('intake_id, bundle, patient_resource_id, observation_resource_id, condition_resource_id, encounter_resource_id, clinical_impression_id, validation_status, export_destination, exported_at, created_at')
  .order('created_at', { ascending: false }),
  ]);

  // Build 7-day sparkline data (count per day)
  const days: Record<string, { intakes: number; approved: number; fhir: number; pending: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { intakes: 0, approved: 0, fhir: 0, pending: 0 };
  }
  for (const row of last7Days ?? []) {
    const key = row.created_at.slice(0, 10);
    if (days[key]) {
      days[key].intakes++;
      if (row.status === 'approved') days[key].approved++;
      if (row.status === 'pending') days[key].pending++;
    }
  }
  const sparkData = {
    intakes:  Object.values(days).map((d) => d.intakes),
    pending:  Object.values(days).map((d) => d.pending),
    approved: Object.values(days).map((d) => d.approved),
    fhir:     Object.values(days).map((_, i) => i), // fhir exports not time-indexed easily
  };

  // Build donut chart data from real chief complaints
  const complaintCounts: Record<string, number> = {};
  for (const row of allIntakes ?? []) {
    if (!row.chief_complaint) continue;
    const key = row.chief_complaint.trim();
    complaintCounts[key] = (complaintCounts[key] ?? 0) + 1;
  }
  const total = Object.values(complaintCounts).reduce((a, b) => a + b, 0) || 1;
  const COLORS = ['#378ADD', '#7F77DD', '#3B9E6A', '#E2904A', '#B4B2A9'];
  const donutData = Object.entries(complaintCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count], i) => ({
      label,
      pct: Math.round((count / total) * 100),
      color: COLORS[i],
    }));

  // Map fhir exports by intake_id for quick lookup
 type FHIRRow = {
  intake_id: string;
  bundle: {
    resourceType: string;
    type: string;
    id: string;
    entry?: { resource: { resourceType: string; id: string } }[];
  };
  patient_resource_id: string | null;
  observation_resource_id: string | null;
  condition_resource_id: string | null;
  encounter_resource_id: string | null;
  clinical_impression_id: string | null;
  validation_status: string;
  export_destination: string | null;
  exported_at: string | null;
  created_at: string;
};
  const fhirByIntake: Record<string, FHIRRow> = {};
  for (const exp of fhirExports ?? []) {
    if (!fhirByIntake[exp.intake_id]) {
      fhirByIntake[exp.intake_id] = exp;
    }
  }

  return (
    <DashboardClient
      metrics={{
        totalIntakes: totalIntakes ?? 0,
        pending: pendingCount ?? 0,
        approved: approvedCount ?? 0,
        fhirExports: fhirCount ?? 0,
      }}
      recentIntakes={recentIntakes ?? []}
      recentActivity={recentActivity ?? []}
      sparkData={sparkData}
      donutData={donutData.length > 0 ? donutData : [
        { label: 'No data yet', pct: 100, color: '#B4B2A9' },
      ]}
      fhirByIntake={fhirByIntake}
    />
  );
}