import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  researchExperiments,
  experimentInstruments,
  sensorObservations,
  operatorObservations,
  datasetManifests,
  provenanceRecords,
  type InsertResearchExperiment,
  type InsertSensorObservation,
  type InsertOperatorObservation,
  type InsertDatasetManifest,
  type InsertProvenanceRecord,
} from "../drizzle/schema";

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database not available");
  return db;
}

export async function createResearchExperiment(data: InsertResearchExperiment) {
  const db = requireDb(await getDb());
  await db.insert(researchExperiments).values(data);
  return data.id;
}

export async function getResearchExperiment(id: string) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(researchExperiments).where(eq(researchExperiments.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateResearchExperimentStatus(id: string, status: InsertResearchExperiment["status"]) {
  const db = requireDb(await getDb());
  await db.update(researchExperiments).set({ status, updatedAt: new Date() }).where(eq(researchExperiments.id, id));
}

export async function appendSensorObservation(data: InsertSensorObservation) {
  const db = requireDb(await getDb());
  await db.insert(sensorObservations).values(data);
}

export async function appendOperatorObservation(data: InsertOperatorObservation) {
  const db = requireDb(await getDb());
  await db.insert(operatorObservations).values(data);
}

export async function listSensorObservations(experimentId: string, limit = 1000) {
  const db = requireDb(await getDb());
  return db.select().from(sensorObservations).where(eq(sensorObservations.experimentId, experimentId)).orderBy(desc(sensorObservations.observedAt)).limit(limit);
}

export async function createDatasetManifest(data: InsertDatasetManifest) {
  const db = requireDb(await getDb());
  await db.insert(datasetManifests).values(data);
  return data.id;
}

export async function createProvenanceRecord(data: InsertProvenanceRecord) {
  const db = requireDb(await getDb());
  await db.insert(provenanceRecords).values(data);
  return data.id;
}

export async function attachExperimentInstrument(data: {
  experimentId: string;
  instrumentId: string;
  role: string;
  calibrationId?: string;
}) {
  const db = requireDb(await getDb());
  await db.insert(experimentInstruments).values(data);
}
