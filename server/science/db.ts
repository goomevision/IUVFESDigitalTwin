import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  aiDecisionLedger,
  detectedPeaks,
  evidenceConflicts,
  experimentRecommendations,
  frequencySweepPoints,
  frequencySweeps,
  materialGaps,
  negativeEvidence,
  sampleLineage,
  scientificExperiments,
  scientificSamples,
} from "../../drizzle/schema";

export async function createScientificSample(data: {
  materialId: number;
  scientificName: string;
  commonName?: string;
  plantPart: string;
  subPart?: string;
  batchId?: string;
  sampleState?: "FRESH" | "WET" | "DRIED" | "FROZEN" | "FREEZE_DIED" | "THAWED" | "POWDER" | "OTHER" | "UNKNOWN";
  moisturePercent?: number;
  massKg?: number;
  geographicContext?: unknown;
  cultivationContext?: unknown;
  biologicalContext?: unknown;
  postHarvestContext?: unknown;
  preparationContext?: unknown;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(scientificSamples).values({ ...data, id } as any);
  return id;
}

export async function recordScientificExperiment(data: {
  sampleId: string;
  experimentId?: string;
  source: "LITERATURE" | "LABORATORY" | "SIMULATION" | "DERIVED" | "HYPOTHESIS";
  purpose: "EXPLORATION" | "REPLICATION" | "VALIDATION" | "FALSIFICATION" | "CALIBRATION" | "COMPARISON" | "PARAMETER_SWEEP" | "MODEL_TEST";
  objective: string;
  hypothesis?: string;
  protocol?: unknown;
  variables?: unknown;
  results?: unknown;
  provenance?: unknown;
  knowledgeStatus: unknown;
  signatureHash?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(scientificExperiments).values({ ...data, id } as any);
  return id;
}

export async function recordFrequencySweep(data: {
  scientificExperimentId: string;
  sampleId: string;
  metadata?: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(frequencySweeps).values({ id, ...data });
  return id;
}

export async function appendFrequencySweepPoint(data: {
  sweepId: string;
  frequencyKHz: number;
  responseValue?: number;
  responseUnit?: string;
  temperatureC?: number;
  pressureMbar?: number;
  powerW?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(frequencySweepPoints).values({ id, ...data } as any);
  return id;
}

export async function recordDetectedPeak(data: {
  sweepId: string;
  frequencyKHz: number;
  amplitude?: number;
  bandwidthKHz?: number;
  prominence?: number;
  confidence?: number;
  classification: "OBSERVED_PEAK" | "POSSIBLE_RESONANCE" | "UNRESOLVED";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(detectedPeaks).values({ id, ...data } as any);
  return id;
}

export async function recordKnowledgeGap(data: {
  materialId: number;
  sampleId?: string;
  parameter: string;
  reason: "NO_DATA" | "NOT_MEASURED" | "INSUFFICIENT_SWEEP" | "CONFLICTING_EVIDENCE" | "SOURCE_UNAVAILABLE" | "NOT_APPLICABLE" | "UNKNOWN";
  priority: number;
  affectsInference: boolean;
  recommendedMeasurement?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(materialGaps).values({ id, ...data });
  return id;
}

export async function recordEvidenceConflict(data: {
  subjectKey: string;
  experimentIds: string[];
  conflictingParameters: string[];
  possibleExplanations?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(evidenceConflicts).values({ id, ...data } as any);
  return id;
}

export async function recordNegativeEvidence(data: {
  scientificExperimentId: string;
  statement: string;
  conditions: Record<string, string | number | boolean>;
  effectSize?: number;
  detectionLimit?: number;
  significance?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(negativeEvidence).values({ id, ...data } as any);
  return id;
}

export async function recordSampleLineage(data: {
  materialId: number;
  sourceSampleId?: string;
  parentSampleId?: string;
  childSampleId?: string;
  transformation: string;
  transformationParameters?: unknown;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(sampleLineage).values({ id, ...data } as any);
  return id;
}

export async function createExperimentRecommendation(data: {
  materialId: number;
  sampleId?: string;
  purpose: "EXPLORATION" | "REPLICATION" | "VALIDATION" | "FALSIFICATION" | "CALIBRATION" | "COMPARISON" | "PARAMETER_SWEEP" | "MODEL_TEST";
  proposedParameters: Record<string, string | number>;
  reason: string;
  expectedInformationGain?: number;
  confirms?: string[];
  falsifies?: string[];
  knowledgeGaps: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(experimentRecommendations).values({ id, ...data } as any);
  return id;
}

export async function recordAIDecision(data: {
  recommendationId: string;
  modelVersion: string;
  evidenceIds: string[];
  reason: string;
  predictedOutcome?: string;
  actualOutcome?: string;
  predictionError?: number;
  informationGain?: number;
  modelUpdated?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(aiDecisionLedger).values({ id, ...data } as any);
  return id;
}

export async function listScientificExperiments(sampleId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scientificExperiments).where(eq(scientificExperiments.sampleId, sampleId)).orderBy(desc(scientificExperiments.createdAt));
}
