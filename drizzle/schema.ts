import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  defaultWaterContent: decimal("defaultWaterContent", { precision: 5, scale: 2 }).notNull(),
  defaultOilContent: decimal("defaultOilContent", { precision: 5, scale: 2 }).notNull(),
  oilComposition: json("oilComposition").notNull(),
  density: decimal("density", { precision: 5, scale: 3 }),
  thermalProperties: json("thermalProperties"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  materialId: int("materialId").notNull(),
  experimentName: varchar("experimentName", { length: 255 }).notNull(),
  inputParameters: json("inputParameters").notNull(),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed", "failed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

export const simulationResults = mysqlTable("simulationResults", {
  id: varchar("id", { length: 36 }).primaryKey(),
  experimentId: varchar("experimentId", { length: 36 }).notNull(),
  finalYield: decimal("finalYield", { precision: 5, scale: 2 }),
  oilComposition: json("oilComposition"),
  energyConsumed: decimal("energyConsumed", { precision: 8, scale: 2 }),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }),
  wasteComposition: json("wasteComposition"),
  realTimeData: json("realTimeData"),
  massBalance: json("massBalance"),
  energyBalance: json("energyBalance"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SimulationResult = typeof simulationResults.$inferSelect;
export type InsertSimulationResult = typeof simulationResults.$inferInsert;

export const controlLogs = mysqlTable("controlLogs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  experimentId: varchar("experimentId", { length: 36 }).notNull(),
  action: mysqlEnum("action", ["start", "pause", "resume", "stop", "parameter_change", "emergency_stop", "error"]).notNull(),
  parameterName: varchar("parameterName", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  operatorNotes: text("operatorNotes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
export type ControlLog = typeof controlLogs.$inferSelect;
export type InsertControlLog = typeof controlLogs.$inferInsert;

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  experimentId: varchar("experimentId", { length: 36 }).notNull(),
  reportType: mysqlEnum("reportType", ["standard", "technical", "executive", "comparative", "production"]).default("standard").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  filePath: varchar("filePath", { length: 512 }),
  fileSize: int("fileSize"),
  contentJson: json("contentJson"),
  status: mysqlEnum("status", ["draft", "completed", "archived"]).default("draft").notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  tags: json("tags"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/** Additive scientific layer: sample context, lineage, evidence, sweep and AI planning. */
export const scientificSamples = mysqlTable("scientificSamples", {
  id: varchar("id", { length: 64 }).primaryKey(),
  materialId: int("materialId").notNull(),
  scientificName: varchar("scientificName", { length: 255 }).notNull(),
  commonName: varchar("commonName", { length: 255 }),
  plantPart: varchar("plantPart", { length: 128 }).notNull(),
  subPart: varchar("subPart", { length: 128 }),
  batchId: varchar("batchId", { length: 128 }),
  sampleState: mysqlEnum("sampleState", ["FRESH", "WET", "DRIED", "FROZEN", "FREEZE_DIED", "THAWED", "POWDER", "OTHER", "UNKNOWN"]).default("UNKNOWN").notNull(),
  moisturePercent: decimal("moisturePercent", { precision: 8, scale: 3 }),
  massKg: decimal("massKg", { precision: 12, scale: 6 }),
  geographicContext: json("geographicContext"),
  cultivationContext: json("cultivationContext"),
  biologicalContext: json("biologicalContext"),
  postHarvestContext: json("postHarvestContext"),
  preparationContext: json("preparationContext"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ScientificSample = typeof scientificSamples.$inferSelect;
export type InsertScientificSample = typeof scientificSamples.$inferInsert;

export const sampleLineage = mysqlTable("sampleLineage", {
  id: varchar("id", { length: 64 }).primaryKey(),
  materialId: int("materialId").notNull(),
  sourceSampleId: varchar("sourceSampleId", { length: 64 }),
  parentSampleId: varchar("parentSampleId", { length: 64 }),
  childSampleId: varchar("childSampleId", { length: 64 }),
  transformation: varchar("transformation", { length: 255 }).notNull(),
  transformationParameters: json("transformationParameters"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const scientificExperiments = mysqlTable("scientificExperiments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  experimentId: varchar("experimentId", { length: 36 }),
  sampleId: varchar("sampleId", { length: 64 }).notNull(),
  source: mysqlEnum("source", ["LITERATURE", "LABORATORY", "SIMULATION", "DERIVED", "HYPOTHESIS"]).notNull(),
  purpose: mysqlEnum("purpose", ["EXPLORATION", "REPLICATION", "VALIDATION", "FALSIFICATION", "CALIBRATION", "COMPARISON", "PARAMETER_SWEEP", "MODEL_TEST"]).notNull(),
  objective: text("objective").notNull(),
  hypothesis: text("hypothesis"),
  protocol: json("protocol"),
  variables: json("variables"),
  results: json("results"),
  provenance: json("provenance"),
  knowledgeStatus: json("knowledgeStatus").notNull(),
  signatureHash: varchar("signatureHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const frequencySweeps = mysqlTable("frequencySweeps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  scientificExperimentId: varchar("scientificExperimentId", { length: 64 }).notNull(),
  sampleId: varchar("sampleId", { length: 64 }).notNull(),
  analysisStatus: mysqlEnum("analysisStatus", ["RAW", "ANALYZED", "REVIEWED"]).default("RAW").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const frequencySweepPoints = mysqlTable("frequencySweepPoints", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sweepId: varchar("sweepId", { length: 64 }).notNull(),
  frequencyKHz: decimal("frequencyKHz", { precision: 12, scale: 6 }).notNull(),
  responseValue: decimal("responseValue", { precision: 20, scale: 8 }),
  responseUnit: varchar("responseUnit", { length: 64 }),
  temperatureC: decimal("temperatureC", { precision: 8, scale: 3 }),
  pressureMbar: decimal("pressureMbar", { precision: 12, scale: 4 }),
  powerW: decimal("powerW", { precision: 12, scale: 4 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const detectedPeaks = mysqlTable("detectedPeaks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sweepId: varchar("sweepId", { length: 64 }).notNull(),
  frequencyKHz: decimal("frequencyKHz", { precision: 12, scale: 6 }).notNull(),
  amplitude: decimal("amplitude", { precision: 20, scale: 8 }),
  bandwidthKHz: decimal("bandwidthKHz", { precision: 12, scale: 6 }),
  prominence: decimal("prominence", { precision: 20, scale: 8 }),
  confidence: decimal("confidence", { precision: 8, scale: 6 }),
  classification: mysqlEnum("classification", ["OBSERVED_PEAK", "POSSIBLE_RESONANCE", "UNRESOLVED"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const materialGaps = mysqlTable("materialGaps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  materialId: int("materialId").notNull(),
  sampleId: varchar("sampleId", { length: 64 }),
  parameter: varchar("parameter", { length: 255 }).notNull(),
  reason: mysqlEnum("reason", ["NO_DATA", "NOT_MEASURED", "INSUFFICIENT_SWEEP", "CONFLICTING_EVIDENCE", "SOURCE_UNAVAILABLE", "NOT_APPLICABLE", "UNKNOWN"]).notNull(),
  priority: int("priority").notNull(),
  affectsInference: boolean("affectsInference").default(true).notNull(),
  recommendedMeasurement: text("recommendedMeasurement"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evidenceConflicts = mysqlTable("evidenceConflicts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  subjectKey: varchar("subjectKey", { length: 255 }).notNull(),
  experimentIds: json("experimentIds").notNull(),
  conflictingParameters: json("conflictingParameters").notNull(),
  possibleExplanations: json("possibleExplanations"),
  status: mysqlEnum("status", ["OPEN", "INVESTIGATING", "RESOLVED"]).default("OPEN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const negativeEvidence = mysqlTable("negativeEvidence", {
  id: varchar("id", { length: 64 }).primaryKey(),
  scientificExperimentId: varchar("scientificExperimentId", { length: 64 }).notNull(),
  statement: text("statement").notNull(),
  conditions: json("conditions").notNull(),
  effectSize: decimal("effectSize", { precision: 20, scale: 8 }),
  detectionLimit: decimal("detectionLimit", { precision: 20, scale: 8 }),
  significance: decimal("significance", { precision: 12, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aiDecisionLedger = mysqlTable("aiDecisionLedger", {
  id: varchar("id", { length: 64 }).primaryKey(),
  recommendationId: varchar("recommendationId", { length: 64 }).notNull(),
  modelVersion: varchar("modelVersion", { length: 128 }).notNull(),
  evidenceIds: json("evidenceIds").notNull(),
  reason: text("reason").notNull(),
  predictedOutcome: text("predictedOutcome"),
  actualOutcome: text("actualOutcome"),
  predictionError: decimal("predictionError", { precision: 20, scale: 8 }),
  informationGain: decimal("informationGain", { precision: 12, scale: 8 }),
  modelUpdated: boolean("modelUpdated").default(false).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const experimentRecommendations = mysqlTable("experimentRecommendations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  materialId: int("materialId").notNull(),
  sampleId: varchar("sampleId", { length: 64 }),
  purpose: mysqlEnum("purpose", ["EXPLORATION", "REPLICATION", "VALIDATION", "FALSIFICATION", "CALIBRATION", "COMPARISON", "PARAMETER_SWEEP", "MODEL_TEST"]).notNull(),
  proposedParameters: json("proposedParameters").notNull(),
  reason: text("reason").notNull(),
  expectedInformationGain: decimal("expectedInformationGain", { precision: 12, scale: 8 }),
  confirms: json("confirms"),
  falsifies: json("falsifies"),
  knowledgeGaps: json("knowledgeGaps").notNull(),
  status: mysqlEnum("status", ["PROPOSED", "ACCEPTED", "REJECTED", "EXECUTED", "SUPERSEDED"]).default("PROPOSED").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const materialsRelations = relations(materials, ({ many }) => ({ experiments: many(experiments) }));
export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  material: one(materials, { fields: [experiments.materialId], references: [materials.id] }),
  simulationResults: many(simulationResults),
  controlLogs: many(controlLogs),
  reports: many(reports),
}));
export const simulationResultsRelations = relations(simulationResults, ({ one }) => ({
  experiment: one(experiments, { fields: [simulationResults.experimentId], references: [experiments.id] }),
}));
export const controlLogsRelations = relations(controlLogs, ({ one }) => ({
  experiment: one(experiments, { fields: [controlLogs.experimentId], references: [experiments.id] }),
}));
export const reportsRelations = relations(reports, ({ one }) => ({
  experiment: one(experiments, { fields: [reports.experimentId], references: [experiments.id] }),
}));
