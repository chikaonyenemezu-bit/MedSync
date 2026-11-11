-- ============================================================
-- 003_audit_log.sql
-- Immutable audit trail for all intake and FHIR events
-- ============================================================

create type audit_event_type as enum (
  -- Intake lifecycle
  'intake_created',
  'intake_updated',
  'ai_extraction_completed',
  'intake_assigned',
  'intake_reviewed',
  'intake_approved',
  'intake_rejected',

  -- FHIR lifecycle
  'fhir_bundle_generated',
  'fhir_bundle_validated',
  'fhir_bundle_exported',

  -- Coding
  'icd10_suggested',
  'icd10_confirmed',
  'icd10_overridden',
  'snomed_suggested',
  'snomed_confirmed',
  'snomed_overridden'
);

create table audit_log (
  id              uuid primary key default gen_random_uuid(),

  -- What happened
  event_type      audit_event_type not null,
  description     text not null,                          -- Human-readable event description

  -- What record was affected
  intake_id       uuid references intakes(id) on delete set null,
  fhir_export_id  uuid references fhir_exports(id) on delete set null,

  -- Who did it
  actor_id        uuid references auth.users(id),
  actor_label     text,                                   -- e.g. "Dr. Sarah Miller", "AI extraction"

  -- What changed (before/after for updates)
  previous_value  jsonb,
  new_value       jsonb,

  -- Context
  metadata        jsonb,                                  -- Any extra context (model version, latency, etc.)

  -- Timestamp — no updated_at; audit log is append-only
  created_at      timestamptz default now()
);

-- Indexes
create index idx_audit_log_intake_id    on audit_log(intake_id);
create index idx_audit_log_event_type   on audit_log(event_type);
create index idx_audit_log_actor_id     on audit_log(actor_id);
create index idx_audit_log_created_at   on audit_log(created_at desc);

-- RLS — audit log is read-only for authenticated users; inserts via service role only
alter table audit_log enable row level security;

create policy "clinicians can read audit log"
  on audit_log for select
  to authenticated
  using (true);

-- No update or delete policies — audit log is immutable

-- Helper function: insert audit event (call from API routes via service role)
create or replace function log_audit_event(
  p_event_type      audit_event_type,
  p_description     text,
  p_intake_id       uuid default null,
  p_fhir_export_id  uuid default null,
  p_actor_id        uuid default null,
  p_actor_label     text default null,
  p_previous_value  jsonb default null,
  p_new_value       jsonb default null,
  p_metadata        jsonb default null
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into audit_log (
    event_type, description, intake_id, fhir_export_id,
    actor_id, actor_label, previous_value, new_value, metadata
  ) values (
    p_event_type, p_description, p_intake_id, p_fhir_export_id,
    p_actor_id, p_actor_label, p_previous_value, p_new_value, p_metadata
  )
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;
