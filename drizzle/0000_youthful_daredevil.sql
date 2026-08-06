CREATE TABLE `controlLogs` (
	`id` varchar(36) NOT NULL,
	`experimentId` varchar(36) NOT NULL,
	`action` enum('start','pause','resume','stop','parameter_change','emergency_stop','error') NOT NULL,
	`parameterName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`operatorNotes` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `controlLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`materialId` int NOT NULL,
	`experimentName` varchar(255) NOT NULL,
	`inputParameters` json NOT NULL,
	`status` enum('draft','running','paused','completed','failed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`defaultWaterContent` decimal(5,2) NOT NULL,
	`defaultOilContent` decimal(5,2) NOT NULL,
	`oilComposition` json NOT NULL,
	`density` decimal(5,3),
	`thermalProperties` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` varchar(36) NOT NULL,
	`experimentId` varchar(36) NOT NULL,
	`reportType` enum('standard','technical','executive','comparative','production') NOT NULL DEFAULT 'standard',
	`title` varchar(255) NOT NULL,
	`description` text,
	`filePath` varchar(512),
	`fileSize` int,
	`contentJson` json,
	`status` enum('draft','completed','archived') NOT NULL DEFAULT 'draft',
	`isPublic` boolean NOT NULL DEFAULT false,
	`tags` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`generatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulationResults` (
	`id` varchar(36) NOT NULL,
	`experimentId` varchar(36) NOT NULL,
	`finalYield` decimal(5,2),
	`oilComposition` json,
	`energyConsumed` decimal(8,2),
	`efficiency` decimal(5,2),
	`wasteComposition` json,
	`realTimeData` json,
	`massBalance` json,
	`energyBalance` json,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulationResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
