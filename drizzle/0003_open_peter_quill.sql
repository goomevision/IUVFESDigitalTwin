CREATE TABLE `datasetManifests` (
	`id` varchar(128) NOT NULL,
	`experimentId` varchar(64),
	`version` varchar(32) NOT NULL,
	`origin` enum('EXPERIMENTAL','SIMULATION','DERIVED','AI_ANALYSIS') NOT NULL,
	`qualityStatus` enum('RAW','VALIDATED','REVIEWED','CALIBRATED','REPLICATED','PUBLISHED','RETRACTED','SUPERSEDED') NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`storageRef` varchar(512) NOT NULL,
	`metadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `datasetManifests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experimentInstruments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` varchar(64) NOT NULL,
	`instrumentId` varchar(128) NOT NULL,
	`role` varchar(128) NOT NULL,
	`calibrationId` varchar(128),
	CONSTRAINT `experimentInstruments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instrumentCalibrations` (
	`id` varchar(128) NOT NULL,
	`instrumentId` varchar(128) NOT NULL,
	`calibrationVersion` varchar(64) NOT NULL,
	`calibratedAt` timestamp NOT NULL,
	`expiresAt` timestamp,
	`certificateRef` varchar(512),
	`metadata` json,
	CONSTRAINT `instrumentCalibrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operatorObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` varchar(64) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`authorId` varchar(128) NOT NULL,
	`note` text NOT NULL,
	`eventId` varchar(128),
	CONSTRAINT `operatorObservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provenanceRecords` (
	`id` varchar(128) NOT NULL,
	`entityId` varchar(128) NOT NULL,
	`activityId` varchar(128) NOT NULL,
	`agentId` varchar(128) NOT NULL,
	`inputRefs` json NOT NULL,
	`outputRefs` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provenanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchExperiments_id` PRIMARY KEY(`id`),
	CONSTRAINT `researchExperiments_experimentId_unique` UNIQUE(`experimentId`)
);
--> statement-breakpoint
CREATE TABLE `sensorObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` varchar(64) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`instrumentId` varchar(128) NOT NULL,
	`parameter` varchar(128) NOT NULL,
	`value` decimal(18,8) NOT NULL,
	`unit` varchar(32),
	`qualityFlag` enum('RAW','VALIDATED','REJECTED','CORRECTED') NOT NULL DEFAULT 'RAW',
	`rawPayloadRef` varchar(512),
	`rawPayloadSha256` varchar(64),
	CONSTRAINT `sensorObservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `datasetManifests` ADD CONSTRAINT `datasetManifests_experimentId_researchExperiments_id_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experimentInstruments` ADD CONSTRAINT `experimentInstruments_experimentId_researchExperiments_id_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experimentInstruments` ADD CONSTRAINT `experimentInstruments_calibrationId_instrumentCalibrations_id_fk` FOREIGN KEY (`calibrationId`) REFERENCES `instrumentCalibrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operatorObservations` ADD CONSTRAINT `operatorObservations_experimentId_researchExperiments_id_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchExperiments` ADD CONSTRAINT `researchExperiments_materialId_materials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sensorObservations` ADD CONSTRAINT `sensorObservations_experimentId_researchExperiments_id_fk` FOREIGN KEY (`experimentId`) REFERENCES `researchExperiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `datasetManifests_experiment_idx` ON `datasetManifests` (`experimentId`);--> statement-breakpoint
CREATE INDEX `operatorObservations_experiment_time_idx` ON `operatorObservations` (`experimentId`,`observedAt`);--> statement-breakpoint
CREATE INDEX `researchExperiments_researcher_idx` ON `researchExperiments` (`researcherId`);--> statement-breakpoint
CREATE INDEX `sensorObservations_experiment_time_idx` ON `sensorObservations` (`experimentId`,`observedAt`);