import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean, index, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 100 }).notNull().unique(), description: text("description"),
  defaultWaterContent: decimal("defaultWaterContent", { precision: 5, scale: 2 }).notNull(), defaultOilContent: decimal("defaultOilContent", { precision: 5, scale: 2 }).notNull(),
  oilComposition: json("oilComposition").notNull(), density: decimal("density", { precision: 5, scale: 3 }), thermalProperties: json("thermalProperties"),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey(), userId: int("userId").notNull(), materialId: int("materialId").notNull(), experimentName: varchar("experimentName", { length: 255 }).notNull(), inputParameters: json("inputParameters").notNull(),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed", "failed"]).default("draft").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), startedAt: timestamp("startedAt"), completedAt: timestamp("completedAt"), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

export const simulationResults = mysqlTable("simulationResults", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull(), finalYield: decimal("finalYield", { precision: 5, scale: 2 }), oilComposition: json("oilComposition"), energyConsumed: decimal("energyConsumed", { precision: 8, scale: 2 }), efficiency: decimal("efficiency", { precision: 5, scale: 2 }), wasteComposition: json("wasteComposition"), realTimeData: json("realTimeData"), massBalance: json("massBalance"), energyBalance: json("energyBalance"), completedAt: timestamp("completedAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SimulationResult = typeof simulationResults.$inferSelect;
export type InsertSimulationResult = typeof simulationResults.$inferInsert;

export const controlLogs = mysqlTable("controlLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull(), action: mysqlEnum("action", ["start", "pause", "resume", "stop", "parameter_change", "emergency_stop", "error"]).notNull(), parameterName: varchar("parameterName", { length: 100 }), oldValue: text("oldValue"), newValue: text("newValue"), operatorNotes: text("operatorNotes"), timestamp: timestamp("timestamp").defaultNow().notNull(),
});
export type ControlLog = typeof controlLogs.$inferSelect;
export type InsertControlLog = typeof controlLogs.$inferInsert;

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull(), reportType: mysqlEnum("reportType", ["standard", "technical", "executive", "comparative", "production"]).default("standard").notNull(), title: varchar("title", { length: 255 }).notNull(), description: text("description"), filePath: varchar("filePath", { length: 512 }), fileSize: int("fileSize"), contentJson: json("contentJson"), status: mysqlEnum("status", ["draft", "completed", "archived"]).default("draft").notNull(), isPublic: boolean("isPublic").default(false).notNull(), tags: json("tags"), generatedAt: timestamp("generatedAt").defaultNow().notNull(), generatedBy: int("generatedBy").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export const researchExperiments = mysqlTable("researchExperiments", {
  id: varchar("id", { length: 64 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull().unique(), title: varchar("title", { length: 255 }).notNull(), status: mysqlEnum("status", ["draft", "ready", "running", "paused", "completed", "failed", "reviewed"]).default("draft").notNull(), researcherId: varchar("researcherId", { length: 128 }).notNull(), objective: text("objective").notNull(), hypothesis: text("hypothesis"), materialId: int("materialId").notNull().references(() => materials.id), sampleId: varchar("sampleId", { length: 128 }).notNull(), batchId: varchar("batchId", { length: 128 }), massKg: decimal("massKg", { precision: 12, scale: 4 }).notNull(), environment: json("environment"), procedure: json("procedure").notNull(), inputParameters: json("inputParameters").notNull(), provenanceId: varchar("provenanceId", { length: 128 }), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ researcherIdx: index("researchExperiments_researcher_idx").on(table.researcherId) }));
export type ResearchExperiment = typeof researchExperiments.$inferSelect;
export type InsertResearchExperiment = typeof researchExperiments.$inferInsert;

export const experimentInstruments = mysqlTable("experimentInstruments", { id: int("id").autoincrement().primaryKey(), experimentId: varchar("experimentId", { length: 64 }).notNull().references(() => researchExperiments.id), instrumentId: varchar("instrumentId", { length: 128 }).notNull(), role: varchar("role", { length: 128 }).notNull(), calibrationId: varchar("calibrationId", { length: 128 }).references(() => instrumentCalibrations.id) });
export type ExperimentInstrument = typeof experimentInstruments.$inferSelect;
export type InsertExperimentInstrument = typeof experimentInstruments.$inferInsert;

export const instrumentCalibrations = mysqlTable("instrumentCalibrations", { id: varchar("id", { length: 128 }).primaryKey(), instrumentId: varchar("instrumentId", { length: 128 }).notNull(), calibrationVersion: varchar("calibrationVersion", { length: 64 }).notNull(), calibratedAt: timestamp("calibratedAt").notNull(), expiresAt: timestamp("expiresAt"), certificateRef: varchar("certificateRef", { length: 512 }), metadata: json("metadata") });
export type InstrumentCalibration = typeof instrumentCalibrations.$inferSelect;
export type InsertInstrumentCalibration = typeof instrumentCalibrations.$inferInsert;

export const sensorObservations = mysqlTable("sensorObservations", { id: int("id").autoincrement().primaryKey(), experimentId: varchar("experimentId", { length: 64 }).notNull().references(() => researchExperiments.id), observedAt: timestamp("observedAt").notNull(), instrumentId: varchar("instrumentId", { length: 128 }).notNull(), parameter: varchar("parameter", { length: 128 }).notNull(), value: decimal("value", { precision: 18, scale: 8 }).notNull(), unit: varchar("unit", { length: 32 }), qualityFlag: mysqlEnum("qualityFlag", ["RAW", "VALIDATED", "REJECTED", "CORRECTED"]).default("RAW").notNull(), rawPayloadRef: varchar("rawPayloadRef", { length: 512 }), rawPayloadSha256: varchar("rawPayloadSha256", { length: 64 }) }, (table) => ({ experimentTimeIdx: index("sensorObservations_experiment_time_idx").on(table.experimentId, table.observedAt) }));
export type SensorObservation = typeof sensorObservations.$inferSelect;
export type InsertSensorObservation = typeof sensorObservations.$inferInsert;

export const operatorObservations = mysqlTable("operatorObservations", { id: int("id").autoincrement().primaryKey(), experimentId: varchar("experimentId", { length: 64 }).notNull().references(() => researchExperiments.id), observedAt: timestamp("observedAt").notNull(), authorId: varchar("authorId", { length: 128 }).notNull(), note: text("note").notNull(), eventId: varchar("eventId", { length: 128 }) }, (table) => ({ experimentTimeIdx: index("operatorObservations_experiment_time_idx").on(table.experimentId, table.observedAt) }));
export type OperatorObservation = typeof operatorObservations.$inferSelect;
export type InsertOperatorObservation = typeof operatorObservations.$inferInsert;

export const datasetManifests = mysqlTable("datasetManifests", { id: varchar("id", { length: 128 }).primaryKey(), experimentId: varchar("experimentId", { length: 64 }).references(() => researchExperiments.id), version: varchar("version", { length: 32 }).notNull(), origin: mysqlEnum("origin", ["EXPERIMENTAL", "SIMULATION", "DERIVED", "AI_ANALYSIS"]).notNull(), qualityStatus: mysqlEnum("qualityStatus", ["RAW", "VALIDATED", "REVIEWED", "CALIBRATED", "REPLICATED", "PUBLISHED", "RETRACTED", "SUPERSEDED"]).notNull(), sha256: varchar("sha256", { length: 64 }).notNull(), storageRef: varchar("storageRef", { length: 512 }).notNull(), metadata: json("metadata").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() }, (table) => ({ experimentIdx: index("datasetManifests_experiment_idx").on(table.experimentId) }));
export type DatasetManifest = typeof datasetManifests.$inferSelect;
export type InsertDatasetManifest = typeof datasetManifests.$inferInsert;

export const provenanceRecords = mysqlTable("provenanceRecords", { id: varchar("id", { length: 128 }).primaryKey(), entityId: varchar("entityId", { length: 128 }).notNull(), activityId: varchar("activityId", { length: 128 }).notNull(), agentId: varchar("agentId", { length: 128 }).notNull(), inputRefs: json("inputRefs").notNull(), outputRefs: json("outputRefs").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() });
export type ProvenanceRecord = typeof provenanceRecords.$inferSelect;
export type InsertProvenanceRecord = typeof provenanceRecords.$inferInsert;

// Canonical runtime persistence table. This is intentionally separate from the
// CausalFrame engine contract and stores the immutable event-hash journal only.
export const scientificEventJournal = mysqlTable("scientificEventJournal", {
  id: varchar("id", { length: 128 }).primaryKey(), experimentId: varchar("experimentId", { length: 64 }).notNull(), sequence: int("sequence").notNull(), eventType: varchar("eventType", { length: 128 }).notNull(), stage: varchar("stage", { length: 64 }), occurredAt: timestamp("occurredAt").defaultNow().notNull(), source: varchar("source", { length: 64 }).notNull(), payload: json("payload").notNull(), previousHash: varchar("previousHash", { length: 64 }), eventHash: varchar("eventHash", { length: 64 }).notNull(),
}, (table) => ({
  experimentSequenceUnique: unique("scientificEventJournal_experiment_sequence_unique").on(table.experimentId, table.sequence),
  experimentTimeIdx: index("scientificEventJournal_experiment_time_idx").on(table.experimentId, table.occurredAt),
  experimentHashIdx: index("scientificEventJournal_experiment_hash_idx").on(table.experimentId, table.eventHash),
}));

// Persistent closed-loop simulator session state. The JSON snapshot contains the causal engine state, PID state, dynamics state, sensors and frames needed for deterministic resume.
export const closedLoopSessions = mysqlTable("closedLoopSessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  experimentId: varchar("experimentId", { length: 36 }).notNull().unique(),
  status: mysqlEnum("status", ["running", "paused", "completed", "failed", "stopped"]).default("paused").notNull(),
  snapshot: json("snapshot").notNull(),
  frameCount: int("frameCount").default(0).notNull(),
  lastStep: int("lastStep").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ experimentIdx: index("closedLoopSessions_experiment_idx").on(table.experimentId) }));
export type ClosedLoopSession = typeof closedLoopSessions.$inferSelect;
export type InsertClosedLoopSession = typeof closedLoopSessions.$inferInsert;

export const materialsRelations = relations(materials, ({ many }) => ({ experiments: many(experiments), researchExperiments: many(researchExperiments) }));
export const experimentsRelations = relations(experiments, ({ one, many }) => ({ material: one(materials, { fields: [experiments.materialId], references: [materials.id] }), simulationResults: many(simulationResults), controlLogs: many(controlLogs), reports: many(reports) }));
export const simulationResultsRelations = relations(simulationResults, ({ one }) => ({ experiment: one(experiments, { fields: [simulationResults.experimentId], references: [experiments.id] }) }));
export const controlLogsRelations = relations(controlLogs, ({ one }) => ({ experiment: one(experiments, { fields: [controlLogs.experimentId], references: [experiments.id] }) }));
export const reportsRelations = relations(reports, ({ one }) => ({ experiment: one(experiments, { fields: [reports.experimentId], references: [experiments.id] }) }));
export const researchExperimentsRelations = relations(researchExperiments, ({ one, many }) => ({ material: one(materials, { fields: [researchExperiments.materialId], references: [materials.id] }), instruments: many(experimentInstruments), observations: many(sensorObservations), operatorObservations: many(operatorObservations), datasets: many(datasetManifests) }));
export const experimentInstrumentsRelations = relations(experimentInstruments, ({ one }) => ({ experiment: one(researchExperiments, { fields: [experimentInstruments.experimentId], references: [researchExperiments.id] }) }));
export const sensorObservationsRelations = relations(sensorObservations, ({ one }) => ({ experiment: one(researchExperiments, { fields: [sensorObservations.experimentId], references: [researchExperiments.id] }) }));
export const operatorObservationsRelations = relations(operatorObservations, ({ one }) => ({ experiment: one(researchExperiments, { fields: [operatorObservations.experimentId], references: [researchExperiments.id] }) }));
export const datasetManifestsRelations = relations(datasetManifests, ({ one }) => ({ experiment: one(researchExperiments, { fields: [datasetManifests.experimentId], references: [researchExperiments.id] }) }));
export const closedLoopSessionsRelations = relations(closedLoopSessions, ({ one }) => ({ experiment: one(experiments, { fields: [closedLoopSessions.experimentId], references: [experiments.id] }) }));
