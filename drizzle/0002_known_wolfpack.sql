CREATE TABLE `scientificEventJournal` (
	`id` varchar(128) NOT NULL,
	`experimentId` varchar(64) NOT NULL,
	`sequence` int NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`stage` varchar(64),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`previousHash` varchar(64),
	`eventHash` varchar(64) NOT NULL,
	CONSTRAINT `scientificEventJournal_id` PRIMARY KEY(`id`),
	CONSTRAINT `scientificEventJournal_experiment_sequence_unique` UNIQUE(`experimentId`,`sequence`)
);
--> statement-breakpoint
CREATE INDEX `scientificEventJournal_experiment_time_idx` ON `scientificEventJournal` (`experimentId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `scientificEventJournal_experiment_hash_idx` ON `scientificEventJournal` (`experimentId`,`eventHash`);