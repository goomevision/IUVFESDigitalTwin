import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, materials, experiments, simulationResults, controlLogs, reports } from "../drizzle/schema";
import { ENV } from './_core/env';
import { randomUUID } from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materials).orderBy(materials.name);
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getMaterialByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(materials).where(eq(materials.name, name)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createMaterial(data: {
  name: string;
  description?: string;
  defaultWaterContent: number;
  defaultOilContent: number;
  oilComposition: Record<string, number>;
  density?: number;
  thermalProperties?: Record<string, number>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(materials).values({
      name: data.name,
      description: data.description,
      defaultWaterContent: data.defaultWaterContent,
      defaultOilContent: data.defaultOilContent,
      oilComposition: data.oilComposition,
      density: data.density,
      thermalProperties: data.thermalProperties,
    } as any);
    return { success: true, message: "Material created successfully" };
  } catch (error) {
    console.error("Error creating material:", error);
    throw error;
  }
}

export async function createExperiment(data: {
  userId: number;
  materialId: number;
  experimentName: string;
  inputParameters: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const experimentId = randomUUID();
  await db.insert(experiments).values({
    id: experimentId,
    userId: data.userId,
    materialId: data.materialId,
    experimentName: data.experimentName,
    inputParameters: data.inputParameters,
    status: "draft",
  });
  return experimentId;
}

export async function getExperiment(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(experiments).where(eq(experiments.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function listUserExperiments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(experiments).where(eq(experiments.userId, userId)).orderBy(desc(experiments.createdAt));
}

export async function updateExperimentStatus(experimentId: string, status: "draft" | "running" | "paused" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = { status };
  if (status === "running") updateData.startedAt = new Date();
  if (status === "completed" || status === "failed") updateData.completedAt = new Date();
  await db.update(experiments).set(updateData).where(eq(experiments.id, experimentId));
}

export async function createSimulationResult(data: {
  experimentId: string;
  finalYield: number;
  oilComposition: Record<string, number> | null;
  energyConsumed: number;
  efficiency: number | null;
  wasteComposition: Record<string, any> | null;
  realTimeData: any[];
  massBalance: Record<string, any>;
  energyBalance: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const resultId = randomUUID();
  try {
    await db.insert(simulationResults).values({
      id: resultId,
      experimentId: data.experimentId,
      finalYield: data.finalYield,
      oilComposition: data.oilComposition,
      energyConsumed: data.energyConsumed,
      efficiency: data.efficiency,
      wasteComposition: data.wasteComposition,
      realTimeData: data.realTimeData,
      massBalance: data.massBalance,
      energyBalance: data.energyBalance,
    } as any);
  } catch (error) {
    console.error("Error creating simulation result:", error);
    throw error;
  }
  return resultId;
}

export async function getSimulationResult(experimentId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(simulationResults).where(eq(simulationResults.experimentId, experimentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function logControlAction(data: {
  experimentId: string;
  action: "start" | "pause" | "resume" | "stop" | "parameter_change" | "emergency_stop" | "error";
  parameterName?: string;
  oldValue?: string;
  newValue?: string;
  operatorNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(controlLogs).values({
    id: randomUUID(),
    experimentId: data.experimentId,
    action: data.action,
    parameterName: data.parameterName,
    oldValue: data.oldValue,
    newValue: data.newValue,
    operatorNotes: data.operatorNotes,
  });
}
