-- IUVFES Scientific Evidence Layer
-- Additive migration. Measured, modelled and derived records are intentionally separate.

CREATE TABLE IF NOT EXISTS scientific_provenance (
  id varchar(64) PRIMARY KEY,
  sourceType enum('LITERATURE','LAB_INSTRUMENT','SIMULATION_ENGINE','DERIVED_CALCULATION') NOT NULL,
  citation text,
  instrumentId varchar(128),
  operatorId varchar(128),
  datasetId varchar(128),
  originalFileHash varchar(128),
  importMethod enum('MANUAL','API','BULK_CSV','REAL_TIME') NOT NULL,
  softwareVersion varchar(128),
  recordedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laboratory_measurements (
  id varchar(64) PRIMARY KEY,
  experimentId varchar(64) NOT NULL,
  materialId varchar(64) NOT NULL,
  sampleId varchar(64) NOT NULL,
  provenanceId varchar(64) NOT NULL,
  parameter varchar(255) NOT NULL,
  measuredValue decimal(24,10) NOT NULL,
  unit varchar(64) NOT NULL,
  uncertainty decimal(24,10),
  instrumentId varchar(128),
  calibrationId varchar(128),
  protocolId varchar(128),
  laboratoryId varchar(128),
  observedAt timestamp NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lab_measurement (experimentId, sampleId, parameter, observedAt)
);

CREATE TABLE IF NOT EXISTS simulation_measurements (
  id varchar(64) PRIMARY KEY,
  experimentId varchar(64) NOT NULL,
  materialId varchar(64) NOT NULL,
  sampleId varchar(64) NOT NULL,
  parameter varchar(255) NOT NULL,
  modelledValue decimal(24,10) NOT NULL,
  unit varchar(64) NOT NULL,
  modelVersion varchar(128) NOT NULL,
  simulationRunId varchar(128) NOT NULL,
  observedAt timestamp NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sim_measurement (simulationRunId, sampleId, parameter)
);

CREATE TABLE IF NOT EXISTS measurement_comparisons (
  id varchar(128) PRIMARY KEY,
  experimentId varchar(64) NOT NULL,
  materialId varchar(64) NOT NULL,
  sampleId varchar(64) NOT NULL,
  parameter varchar(255) NOT NULL,
  measuredValue decimal(24,10) NOT NULL,
  modelledValue decimal(24,10) NOT NULL,
  absoluteError decimal(24,10) NOT NULL,
  relativeErrorPercent decimal(24,10),
  combinedUncertainty decimal(24,10),
  zScore decimal(24,10),
  disposition enum('SUPPORTED','CONTRADICTED','INCONCLUSIVE') NOT NULL,
  reason text NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_sample_parameter ON laboratory_measurements(sampleId, parameter);
CREATE INDEX idx_sim_sample_parameter ON simulation_measurements(sampleId, parameter);
CREATE INDEX idx_comparison_subject ON measurement_comparisons(materialId, sampleId, parameter);
