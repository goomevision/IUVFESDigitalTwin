import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

// Materials table - stores botanical material types and their properties
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  defaultWaterContent: decimal("defaultWaterContent", { precision: 5, scale: 2 }).notNull(), // percentage
  defaultOilContent: decimal("defaultOilContent", { precision: 5, scale: 2 }).notNull(), // percentage
  oilComposition: json("oilComposition").notNull(), // {patchouliAlcohol: %, terpenes: %, other: %}
  density: decimal("density", { precision: 5, scale: 3 }), // kg/L
  thermalProperties: json("thermalProperties"), // {specificHeat: J/kg·K, thermalConductivity: W/m·K}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

// Experiments table - stores simulation experiment records
export const experiments = mysqlTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userId").notNull(),
  materialId: int("materialId").notNull(),
  experimentName: varchar("experimentName", { length: 255 }).notNull(),
  inputParameters: json("inputParameters").notNull(), // {materialWeight, waterVolume, targetPressure, targetTemperature, ultrasonicFrequency, duration, processModel, ratio}
  status: mysqlEnum("status", ["draft", "running", "paused", "completed", "failed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

// Simulation results table - stores the output of completed simulations
export const simulationResults = mysqlTable("simulationResults", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  experimentId: varchar("experimentId", { length: 36 }).notNull(),
  finalYield: decimal("finalYield", { precision: 5, scale: 2 }), // percentage
  oilComposition: json("oilComposition"), // {patchouliAlcohol: %, terpenes: %, other: %}
  energyConsumed: decimal("energyConsumed", { precision: 8, scale: 2 }), // kWh
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }), // percentage
  wasteComposition: json("wasteComposition"), // {water: L, waste: kg, other: ...}
  realTimeData: json("realTimeData"), // array of {timestamp, pressure, temperature, yield, energy, efficiency}
  massBalance: json("massBalance"), // {input: {material, water}, output: {oil, water, waste}}
  energyBalance: json("energyBalance"), // {input: {heating, pump, ultrasonic}, output: {oil, heatLoss}}
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SimulationResult = typeof simulationResults.$inferSelect;
export type InsertSimulationResult = typeof simulationResults.$inferInsert;

// Control logs table - tracks all actions during simulation
export const controlLogs = mysqlTable("controlLogs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
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

// Reports table - stores generated reports
export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  experimentId: varchar("experimentId", { length: 36 }).notNull(),
  reportType: mysqlEnum("reportType", ["standard", "technical", "executive", "comparative", "production"]).default("standard").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  filePath: varchar("filePath", { length: 512 }), // S3 path
  fileSize: int("fileSize"), // bytes
  contentJson: json("contentJson"), // metadata about report content
  status: mysqlEnum("status", ["draft", "completed", "archived"]).default("draft").notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  tags: json("tags"), // array of tags for search
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// Relations
export const materialsRelations = relations(materials, ({ many }) => ({
  experiments: many(experiments),
}));

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  material: one(materials, {
    fields: [experiments.materialId],
    references: [materials.id],
  }),
  simulationResults: many(simulationResults),
  controlLogs: many(controlLogs),
  reports: many(reports),
}));

export const simulationResultsRelations = relations(simulationResults, ({ one }) => ({
  experiment: one(experiments, {
    fields: [simulationResults.experimentId],
    references: [experiments.id],
  }),
}));

export const controlLogsRelations = relations(controlLogs, ({ one }) => ({
  experiment: one(experiments, {
    fields: [controlLogs.experimentId],
    references: [experiments.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  experiment: one(experiments, {
    fields: [reports.experimentId],
    references: [experiments.id],
  }),
}));