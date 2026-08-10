import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(), openId: varchar("openId", { length: 64 }).notNull().unique(), name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }), role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect; export type InsertUser = typeof users.$inferInsert;

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 100 }).notNull().unique(), description: text("description"), defaultWaterContent: decimal("defaultWaterContent", { precision: 5, scale: 2 }).notNull(), defaultOilContent: decimal("defaultOilContent", { precision: 5, scale: 2 }).notNull(), oilComposition: json("oilComposition").notNull(), density: decimal("density", { precision: 5, scale: 3 }), thermalProperties: json("thermalProperties"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Material = typeof materials.$inferSelect; export type InsertMaterial = typeof materials.$inferInsert;

export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey(), userId: int("userId").notNull(), materialId: int("materialId").notNull(), experimentName: varchar("experimentName", { length: 255 }).notNull(), inputParameters: json("inputParameters").notNull(), status: mysqlEnum("status", ["draft", "running", "paused", "completed", "failed"]).default("draft").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), startedAt: timestamp("startedAt"), completedAt: timestamp("completedAt"), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Experiment = typeof experiments.$inferSelect; export type InsertExperiment = typeof experiments.$inferInsert;

export const simulationResults = mysqlTable("simulationResults", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull(), finalYield: decimal("finalYield", { precision: 5, scale: 2 }), oilComposition: json("oilComposition"), energyConsumed: decimal("energyConsumed", { precision: 8, scale: 2 }), efficiency: decimal("efficiency", { precision: 5, scale: 2 }), wasteComposition: json("wasteComposition"), realTimeData: json("realTimeData"), massBalance: json("massBalance"), energyBalance: json("energyBalance"), completedAt: timestamp("completedAt").defaultNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SimulationResult = typeof simulationResults.$inferSelect; export type InsertSimulationResult = typeof simulationResults.$inferInsert;

export const controlLogs = mysqlTable("controlLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull(), action: mysqlEnum("action", ["start", "pause", "resume", "stop", "parameter_change", "emergency_stop", "error"]).notNull(), parameterName: varchar("parameterName", { length: 100 }), oldValue: text("oldValue"), newValue: text("newValue"), operatorNotes: text("operatorNotes"), timestamp: timestamp("timestamp").defaultNow().notNull(),
});
export type ControlLog = typeof controlLogs.$inferSelect; export type InsertControlLog = typeof controlLogs.$inferInsert;

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull(), reportType: mysqlEnum("reportType", ["standard", "technical", "executive", "comparative", "production"]).default("standard").notNull(), title: varchar("title", { length: 255 }).notNull(), description: text("description"), filePath: varchar("filePath", { length: 512 }), fileSize: int("fileSize"), contentJson: json("contentJson"), status: mysqlEnum("status", ["draft", "completed", "archived"]).default("draft").notNull(), isPublic: boolean("isPublic").default(false).notNull(), tags: json("tags"), generatedAt: timestamp("generatedAt").defaultNow().notNull(), generatedBy: int("generatedBy").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Report = typeof reports.$inferSelect; export type InsertReport = typeof reports.$inferInsert;

export const closedLoopSessions = mysqlTable("closedLoopSessions", {
  id: varchar("id", { length: 36 }).primaryKey(), experimentId: varchar("experimentId", { length: 36 }).notNull().unique(), status: mysqlEnum("status", ["running", "paused", "completed", "failed", "stopped"]).notNull(), snapshot: json("snapshot").notNull(), frameCount: int("frameCount").notNull().default(0), lastStep: int("lastStep").notNull().default(0), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClosedLoopSession = typeof closedLoopSessions.$inferSelect; export type InsertClosedLoopSession = typeof closedLoopSessions.$inferInsert;

export const materialsRelations = relations(materials, ({ many }) => ({ experiments: many(experiments) }));
export const experimentsRelations = relations(experiments, ({ one, many }) => ({ material: one(materials, { fields: [experiments.materialId], references: [materials.id] }), simulationResults: many(simulationResults), controlLogs: many(controlLogs), reports: many(reports) }));
export const simulationResultsRelations = relations(simulationResults, ({ one }) => ({ experiment: one(experiments, { fields: [simulationResults.experimentId], references: [experiments.id] }) }));
export const controlLogsRelations = relations(controlLogs, ({ one }) => ({ experiment: one(experiments, { fields: [controlLogs.experimentId], references: [experiments.id] }) }));
export const reportsRelations = relations(reports, ({ one }) => ({ experiment: one(experiments, { fields: [reports.experimentId], references: [experiments.id] }) }));
