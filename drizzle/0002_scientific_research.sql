CREATE TABLE `researchExperiments` (
  `id` varchar(64) NOT NULL,
  `experimentId` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('draft','ready','running','paused','completed','failed','reviewed') NOT NULL DEFAULT 'draft',
  `researcherId` varchar(128) NOT NULL,
  `objective` text NOT NULL,
  `hypothesis` text,
  `materialId` int NOT NULL,
  `sampleId` varchar(128) NOT NULL,
  `batchId` varchar(128),
  `massKg` decimal(12,4) NOT NULL,
  `environment` json,
  `procedure` json NOT NULL,
  `inputParameters` json NOT NULL,
  `provenanceId` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `researchExperiments_experimentId_unique` (`experimentId`),
  KEY `researchExperiments_researcher_idx` (`researcherId`),
  CONSTRAINT `researchExperiments_material_fk` FOREIGN KEY (`materialId`) REFERENCES `materials` (`id`)
);

CREATE TABLE `instrumentCalibrations` (
  `id` varchar(128) NOT NULL,
  `instrumentId` varchar(128) NOT NULL,
  `calibrationVersion` varchar(64) NOT NULL,
  `calibratedAt` timestamp NOT NULL,
  `expiresAt` timestamp NULL,
  `certificateRef` varchar(512),
  `metadata` json,
  PRIMARY KEY (`id`)
);

CREATE TABLE `experimentInstruments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `experimentId` varchar(64) NOT NULL,
  `instrumentId` varchar(128) NOT NULL,
  `role` varchar(128) NOT NULL,
  `calibrationId` varchar(128),
  PRIMARY KEY (`id`),
  KEY `experimentInstruments_experiment_idx` (`experimentId`),
  CONSTRAINT `experimentInstruments_experiment_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments` (`id`),
  CONSTRAINT `experimentInstruments_calibration_fk` FOREIGN KEY (`calibrationId`) REFERENCES `instrumentCalibrations` (`id`)
);

CREATE TABLE `sensorObservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `experimentId` varchar(64) NOT NULL,
  `observedAt` timestamp NOT NULL,
  `instrumentId` varchar(128) NOT NULL,
  `parameter` varchar(128) NOT NULL,
  `value` decimal(18,8) NOT NULL,
  `unit` varchar(32),
  `qualityFlag` enum('RAW','VALIDATED','REJECTED','CORRECTED') NOT NULL DEFAULT 'RAW',
  `rawPayloadRef` varchar(512),
  `rawPayloadSha256` varchar(64),
  PRIMARY KEY (`id`),
  KEY `sensorObservations_experiment_time_idx` (`experimentId`,`observedAt`),
  CONSTRAINT `sensorObservations_experiment_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments` (`id`)
);

CREATE TABLE `operatorObservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `experimentId` varchar(64) NOT NULL,
  `observedAt` timestamp NOT NULL,
  `authorId` varchar(128) NOT NULL,
  `note` text NOT NULL,
  `eventId` varchar(128),
  PRIMARY KEY (`id`),
  KEY `operatorObservations_experiment_time_idx` (`experimentId`,`observedAt`),
  CONSTRAINT `operatorObservations_experiment_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments` (`id`)
);

CREATE TABLE `datasetManifests` (
  `id` varchar(128) NOT NULL,
  `experimentId` varchar(64),
  `version` varchar(32) NOT NULL,
  `origin` enum('EXPERIMENTAL','SIMULATION','DERIVED','AI_ANALYSIS') NOT NULL,
  `qualityStatus` enum('RAW','VALIDATED','REVIEWED','CALIBRATED','REPLICATED','PUBLISHED','RETRACTED','SUPERSEDED') NOT NULL,
  `sha256` varchar(64) NOT NULL,
  `storageRef` varchar(512) NOT NULL,
  `metadata` json NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `datasetManifests_experiment_idx` (`experimentId`),
  CONSTRAINT `datasetManifests_experiment_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments` (`id`)
);

CREATE TABLE `provenanceRecords` (
  `id` varchar(128) NOT NULL,
  `entityId` varchar(128) NOT NULL,
  `activityId` varchar(128) NOT NULL,
  `agentId` varchar(128) NOT NULL,
  `inputRefs` json NOT NULL,
  `outputRefs` json NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
