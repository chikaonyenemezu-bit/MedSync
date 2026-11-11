-- ============================================================
-- 002_fhir_exports.sql
-- Stores generated FHIR R4 bundles per approved intake
-- ============================================================

create type fhir_validation_status as enum (
  'pending',
  'valid',
  'invalid',
  'not_validated'
);

create table fhir_exports (
  id                    uuid primary key default gen_random_uuid(),
  intake_id             uuid not null references intakes(id) on delete cascade,

  -- FHIR bundle (full R4 JSON)
  bundle                jsonb not null,

  -- Individual resource IDs for quick lookup
  patient_resource_id       text,
  observation_resource_id   text,
  condition_resource_id     text,
  encounter_resource_id     text,
  clinical_impression_id    text,

  -- Validation
  validation_status     fhir_validation_status default 'not_validated',
  validation_errors     jsonb,                            -- Array of validation error objects
  validated_at          timestamptz,

  -- Export tracking
  exported_at           timestamptz,
  export_destination    text,                             -- e.g. "HAPI FHIR R4", "Epic FHIR endpoint"

  -- Metadata
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create trigger fhir_exports_updated_at
  before update on fhir_exports
  for each row execute function update_updated_at();

-- Indexes
create index idx_fhir_exports_intake_id        on fhir_exports(intake_id);
create index idx_fhir_exports_validation_status on fhir_exports(validation_status);
create index idx_fhir_exports_created_at        on fhir_exports(created_at desc);

-- GIN index on bundle JSON for fast resource lookups
create index idx_fhir_exports_bundle on fhir_exports using gin(bundle);

-- RLS
alter table fhir_exports enable row level security;

create policy "clinicians can read fhir exports"
  on fhir_exports for select
  to authenticated
  using (true);

create policy "authenticated can insert fhir exports"
  on fhir_exports for insert
  to authenticated
  with check (true);

create policy "authenticated can update fhir exports"
  on fhir_exports for update
  to authenticated
  using (true);
