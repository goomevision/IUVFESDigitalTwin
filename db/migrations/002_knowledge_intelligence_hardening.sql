-- IUVFES Knowledge Intelligence Hardening
-- Append-only migration. Adds structures needed to reason about identity,
-- evidence conflicts, and source confidence without overwriting observations.

alter table provenance
  add column if not exists source_confidence double precision
  check (source_confidence is null or source_confidence between 0 and 1);

alter table extraction_protocol
  add column if not exists pulse_cycle_s double precision,
  add column if not exists enzyme_system text,
  add column if not exists notes text;

create table if not exists material_alias (
  material_id uuid not null references material(id) on delete cascade,
  alias text not null,
  alias_type text not null check (alias_type in ('COMMON_NAME','SCIENTIFIC_NAME','SYNONYM','LOCAL_NAME','SOURCE_LABEL')),
  normalized text not null,
  primary key (material_id, normalized, alias_type)
);

create index if not exists idx_material_alias_normalized on material_alias(normalized);

create table if not exists evidence_conflict (
  id uuid primary key,
  material_id uuid not null references material(id),
  field text not null,
  record_ids jsonb not null,
  conflict_type text not null check (conflict_type in ('VALUE_DIFFERENCE','UNIT_DIFFERENCE','PROTOCOL_DIFFERENCE','SOURCE_AMBIGUITY')),
  resolution_status text not null check (resolution_status in ('OPEN','REVIEWED','RESOLVED')),
  explanation text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_evidence_conflict_material on evidence_conflict(material_id, resolution_status);

-- A literature operating frequency and a fitted resonance parameter are
-- intentionally stored in different entities. No automatic mapping is added.
-- Duplicate detection must remain reviewable rather than destructive.
