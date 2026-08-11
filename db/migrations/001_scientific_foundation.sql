-- IUVFES Scientific Data Foundation
-- Contract only: nullable scientific parameters remain UNKNOWN until evidence exists.
-- PostgreSQL target.

create table if not exists material (
  id uuid primary key,
  scientific_name text not null,
  common_name text,
  plant_part text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists provenance (
  id uuid primary key,
  source_type text not null check (source_type in ('LITERATURE','LAB_INSTRUMENT','SIMULATION_ENGINE','DERIVED_CALCULATION')),
  citation text,
  instrument_id text,
  operator_id text,
  dataset_id text,
  original_file_hash text,
  import_method text not null check (import_method in ('MANUAL','API','BULK_CSV','REAL_TIME')),
  software_version text,
  recorded_at timestamptz not null default now()
);

create table if not exists extraction_protocol (
  id uuid primary key,
  method text not null,
  solvent_type text,
  solvent_ratio text,
  frequency_khz double precision,
  power_w double precision,
  amplitude_percent double precision,
  intensity_w_cm2 double precision,
  duty_cycle_percent double precision,
  time_min double precision,
  temperature_c double precision,
  pressure_mbar double precision,
  material_mass_kg double precision,
  particle_size_mm double precision,
  moisture_percent double precision,
  created_at timestamptz not null default now()
);

create table if not exists experiment_record (
  id uuid primary key,
  material_id uuid not null references material(id),
  source text not null check (source in ('LITERATURE','LABORATORY','SIMULATION','DERIVED','HYPOTHESIS')),
  batch_id text,
  recorded_at timestamptz not null,
  protocol_id uuid references extraction_protocol(id),
  provenance_id uuid not null references provenance(id),
  classification text not null check (classification in ('OBSERVED','DERIVED','HYPOTHESIS','MODEL_FIT','VALIDATED')),
  confidence_score double precision check (confidence_score is null or confidence_score between 0 and 1),
  confidence_method text,
  evidence_level text not null check (evidence_level in ('LITERATURE','LABORATORY','SIMULATION','MULTI_SOURCE')),
  validation_status text not null check (validation_status in ('UNKNOWN','UNTESTED','SUPPORTED','CONTRADICTED')),
  oil_yield_percent double precision,
  oil_mass_kg double precision,
  tpc_mggae_g double precision,
  flavonoid_ppm double precision,
  target_compound_concentration jsonb,
  water_removed_kg double precision,
  energy_consumed_kwh double precision,
  raw_measurements jsonb,
  measurement_uncertainty double precision,
  uncertainty_unit text,
  instrument_used text,
  analytical_method text,
  operator text,
  notes text
);

create table if not exists material_gap (
  id uuid primary key,
  material_id uuid not null references material(id),
  parameter text not null,
  reason text not null,
  priority integer not null check (priority between 1 and 10),
  status text not null check (status in ('OPEN','IN_PROGRESS','RESOLVED')),
  evidence_needed text
);

create table if not exists frequency_sweep (
  id uuid primary key,
  material_id uuid not null references material(id),
  experiment_id uuid not null references experiment_record(id),
  start_frequency_khz double precision not null,
  end_frequency_khz double precision not null,
  step_khz double precision not null,
  provenance_id uuid not null references provenance(id),
  created_at timestamptz not null default now()
);

create table if not exists sweep_point (
  id uuid primary key,
  sweep_id uuid not null references frequency_sweep(id) on delete cascade,
  frequency_khz double precision not null,
  yield_percent double precision,
  mass_rate_kg_s double precision,
  power_w double precision,
  intensity_w_cm2 double precision,
  temperature_c double precision,
  pressure_mbar double precision,
  response_value double precision,
  uncertainty double precision
);

create table if not exists detected_peak (
  id uuid primary key,
  sweep_id uuid not null references frequency_sweep(id) on delete cascade,
  f0_khz double precision not null,
  bandwidth_khz double precision,
  amplitude double precision,
  prominence double precision,
  snr double precision,
  confidence double precision check (confidence is null or confidence between 0 and 1),
  fitting_method text,
  classification text not null check (classification in ('OBSERVED','DERIVED','HYPOTHESIS','MODEL_FIT','VALIDATED')),
  evidence_level text not null check (evidence_level in ('LITERATURE','LABORATORY','SIMULATION','MULTI_SOURCE')),
  validation_status text not null check (validation_status in ('UNKNOWN','UNTESTED','SUPPORTED','CONTRADICTED'))
);

create table if not exists material_profile (
  id uuid primary key,
  material_id uuid not null references material(id),
  version integer not null,
  status text not null check (status in ('DRAFT','ACTIVE','DEPRECATED')),
  superseded_by uuid references material_profile(id),
  created_at timestamptz not null default now(),
  created_from_experiment_id uuid references experiment_record(id),
  provenance_id uuid not null references provenance(id),
  unique(material_id, version)
);

create table if not exists fraction_profile (
  id uuid primary key,
  material_profile_id uuid not null references material_profile(id) on delete cascade,
  label text not null,
  f0_khz double precision,
  bandwidth_khz double precision,
  amplitude double precision,
  activation_energy_model double precision,
  value_status text not null check (value_status in ('KNOWN','UNKNOWN','NOT_APPLICABLE')),
  classification text not null check (classification in ('OBSERVED','DERIVED','HYPOTHESIS','MODEL_FIT','VALIDATED')),
  evidence_level text not null check (evidence_level in ('LITERATURE','LABORATORY','SIMULATION','MULTI_SOURCE')),
  validation_status text not null check (validation_status in ('UNKNOWN','UNTESTED','SUPPORTED','CONTRADICTED')),
  confidence_score double precision check (confidence_score is null or confidence_score between 0 and 1)
);

create table if not exists experiment_recommendation (
  id uuid primary key,
  material_id uuid not null references material(id),
  target_frequency_khz double precision,
  frequency_range_min_khz double precision,
  frequency_range_max_khz double precision,
  expected_information_gain double precision,
  uncertainty_score double precision,
  priority integer not null check (priority between 1 and 10),
  reason text not null,
  model_version text,
  status text not null check (status in ('PROPOSED','ACCEPTED','EXECUTED','REJECTED')),
  created_at timestamptz not null default now()
);

create index if not exists idx_experiment_material on experiment_record(material_id);
create index if not exists idx_sweep_material on frequency_sweep(material_id);
create index if not exists idx_sweep_point_frequency on sweep_point(sweep_id, frequency_khz);
create index if not exists idx_peak_sweep on detected_peak(sweep_id);
create index if not exists idx_gap_material_status on material_gap(material_id, status);
