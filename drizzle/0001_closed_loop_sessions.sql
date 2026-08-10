CREATE TABLE `closedLoopSessions` (
	`id` varchar(36) NOT NULL,
	`experimentId` varchar(36) NOT NULL,
	`status` enum('running','paused','completed','failed','stopped') NOT NULL,
	`snapshot` json NOT NULL,
	`frameCount` int NOT NULL DEFAULT 0,
	`lastStep` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `closedLoopSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `closedLoopSessions_experimentId_unique` UNIQUE(`experimentId`)
);
--> statement-breakpoint
