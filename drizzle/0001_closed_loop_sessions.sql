CREATE TABLE `closedLoopSessions` (
  `id` varchar(36) NOT NULL,
  `experimentId` varchar(36) NOT NULL,
  `status` enum('running','paused','completed','failed','stopped') NOT NULL DEFAULT 'paused',
  `snapshot` json NOT NULL,
  `frameCount` int NOT NULL DEFAULT 0,
  `lastStep` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `closedLoopSessions_id` PRIMARY KEY(`id`),
  CONSTRAINT `closedLoopSessions_experiment_unique` UNIQUE(`experimentId`),
  INDEX `closedLoopSessions_experiment_idx` (`experimentId`)
);
