-- Scientific research persistence foundation.
-- NON-CANONICAL DEVELOPMENT SCAFFOLD.
-- Intended to be incorporated into the Drizzle schema/migration pipeline after review.
-- Do not execute this file: the canonical MySQL/Drizzle migration chain is numbered.

CREATE TABLE IF NOT EXISTS research_experiments (
  id varchar(64) PRIMARY KEY,
  title varchar(255) NOT NULL,
  status varchar(32) NOT NULL,
  researcher_id varchar(128) NOT NULL,
  objective text NOT NULL,
  hypothesis text,
  material_id varchar(128) NOT NULL,
  sample_id varchar(128) NOT NULL,
  batch_id varchar(128),
  mass_kg real NOT NULL,
  environment_json text,
  procedure_json text NOT NULL,
  input_parameters_json text NOT NULL,
  provenance_id varchar(128),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiment_instruments (
  id integer PRIMARY KEY AUTOINCREMENT,
  experiment_id varchar(64) NOT NULL,
  instrument_id varchar(128) NOT NULL,
  role varchar(128) NOT NULL,
  calibration_id varchar(128),
  FOREIGN KEY (experiment_id) REFERENCES research_experiments(id)
);

CREATE TABLE IF NOT EXISTS instrument_calibrations (
  id varchar(128) PRIMARY KEY,
  instrument_id varchar(128) NOT NULL,
  calibration_version varchar(64) NOT NULL,
  calibrated_at timestamp NOT NULL,
  expires_at timestamp,
  certificate_ref varchar(512),
  metadata_json text
);

CREATE TABLE IF NOT EXISTS sensor_observations (
  id integer PRIMARY KEY AUTOINCREMENT,
  experiment_id varchar(64) NOT NULL,
  observed_at timestamp NOT NULL,
  instrument_id varchar(128) NOT NULL,
  parameter varchar(128) NOT NULL,
  value real NOT NULL,
  unit varchar(32),
  quality_flag varchar(32) NOT NULL DEFAULT 'RAW',
  raw_payload_ref varchar(512),
  raw_payload_sha256 varchar(64),
  FOREIGN KEY (experiment_id) REFERENCES research_experiments(id)
);

CREATE TABLE IF NOT EXISTS operator_observations (
  id integer PRIMARY KEY AUTOINCREMENT,
  experiment_id varchar(64) NOT NULL,
  observed_at timestamp NOT NULL,
  author_id varchar(128) NOT NULL,
  note text NOT NULL,
  event_id varchar(128),
  FOREIGN KEY (experiment_id) REFERENCES research_experiments(id)
);

CREATE TABLE IF NOT EXISTS dataset_manifests (
  id varchar(128) PRIMARY KEY,
  experiment_id varchar(64),
  version varchar(32) NOT NULL,
  origin varchar(32) NOT NULL,
  quality_status varchar(32) NOT NULL,
  sha256 varchar(64) NOT NULL,
  storage_ref varchar(512) NOT NULL,
  metadata_json text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES research_experiments(id)
);

CREATE TABLE IF NOT EXISTS provenance_records (
  id varchar(128) PRIMARY KEY,
  entity_id varchar(128) NOT NULL,
  activity_id varchar(128) NOT NULL,
  agent_id varchar(128) NOT NULL,
  input_refs_json text NOT NULL,
  output_refs_json text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_observations_experiment_time ON sensor_observations(experiment_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_operator_observations_experiment_time ON operator_observations(experiment_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_dataset_manifests_experiment ON dataset_manifests(experiment_id);
