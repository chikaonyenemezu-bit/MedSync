-- ============================================================
-- 001_intakes.sql
-- Core intakes table — stores patient narrative + AI extraction
-- ============================================================

-- Enums
create type intake_status as enum (
  'pending',     -- AI extraction complete, awaiting clinician
  'in_review',   -- Clinician opened the record
  'approved',    -- Clinician approved, FHIR bundle generation triggered
  'rejected',    -- Clinician rejected, reason required
  'exported'     -- FHIR bundle exported to external system
);

create type urgency_level as enum (
  'routine',
  'moderate',
  'urgent',
  'emergency'
);

-- Main intakes table
create table intakes (
  id                uuid primary key default gen_random_uuid(),

  -- Patient identity (anonymous in demo — no real PII stored)
  patient_ref       text not null,                          -- e.g. "P-1042", display reference only

  -- Raw input
  narrative         text not null,                          -- Free-text patient entry

  -- AI extracted fields (populated after Claude API call)
  chief_complaint   text,
  duration          text,                                   -- e.g. "2 days"
  onset             text,                                   -- e.g. "Gradual"
  severity          text,                                   -- e.g. "Moderate"
  associated_symptoms  text[],                              -- Array of symptom strings
  aggravating_factors  text[],
  alleviating_factors  text[],
  trigger           text,

  -- Clinical coding suggestions (AI-generated, not validated)
  icd10_suggestion        text,                             -- e.g. "R07.9"
  icd10_display           text,                             -- e.g. "Chest pain, unspecified"
  snomed_suggestion       text,                             -- e.g. "29857009"
  snomed_display          text,                             -- e.g. "Chest pain"

  -- Clinical impression (AI-generated)
  clinical_impression     text,                             -- e.g. "Possible cardiac symptom presentation"
  urgency                 urgency_level default 'routine',

  -- Clinician review
  status                  intake_status default 'pending',
  reviewed_by             uuid references auth.users(id),
  reviewed_at             timestamptz,
  rejection_reason        text,
  clinician_notes         text,

  -- ICD-10 / SNOMED overrides (clinician can edit AI suggestions)
  icd10_confirmed         text,
  snomed_confirmed        text,

  -- Metadata
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger intakes_updated_at
  before update on intakes
  for each row execute function update_updated_at();

-- Indexes
create index idx_intakes_status     on intakes(status);
create index idx_intakes_urgency    on intakes(urgency);
create index idx_intakes_created_at on intakes(created_at desc);
create index idx_intakes_reviewed_by on intakes(reviewed_by);

-- RLS
alter table intakes enable row level security;

-- Allow authenticated users (clinicians) to read all intakes
create policy "clinicians can read intakes"
  on intakes for select
  to authenticated
  using (true);

-- Allow authenticated users to insert new intakes
create policy "authenticated can insert intakes"
  on intakes for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update intakes
create policy "authenticated can update intakes"
  on intakes for update
  to authenticated
  using (true);
