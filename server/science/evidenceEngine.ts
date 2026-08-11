import type { ExperimentRecord, MeasurementResult } from "../../shared/scientific";
import type {
  EvidenceConflict,
  EvidenceProfile,
  ExperimentMatchResult,
  ExperimentSignature,
  KnowledgeAggregation,
  NegativeEvidence,
} from "../../shared/scientific-v2";

const normalize = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim().toLowerCase();

const same = (a: unknown, b: unknown) => normalize(a) === normalize(b);

function resultValue(record: ExperimentRecord, name: string): number | undefined {
  const result = record.results.find((item) => normalize(item.name) === normalize(name));
  return result?.value;
}

function variableValue(record: ExperimentRecord, name: string): string | number | boolean | undefined {
  const item = record.variables.find((variable) => normalize(variable.name) === normalize(name));
  return item?.value;
}

/**
 * Compares experimental identity without treating the same species as the same sample.
 * Missing context reduces similarity rather than being silently treated as equal.
 */
export function compareExperimentSignature(
  candidate: ExperimentSignature,
  prior: ExperimentSignature,
): ExperimentMatchResult {
  const reasons: string[] = [];
  const critical: Array<[string, unknown, unknown]> = [
    ["materialId", candidate.materialId, prior.materialId],
    ["sampleId", candidate.sampleId, prior.sampleId],
    ["protocolId", candidate.protocolId, prior.protocolId],
    ["instrumentId", candidate.instrumentId, prior.instrumentId],
    ["laboratoryId", candidate.laboratoryId, prior.laboratoryId],
    ["frequency_kHz", candidate.frequency_kHz, prior.frequency_kHz],
    ["power_W", candidate.power_W, prior.power_W],
    ["amplitudePercent", candidate.amplitudePercent, prior.amplitudePercent],
    ["timeMin", candidate.timeMin, prior.timeMin],
    ["temperature_C", candidate.temperature_C, prior.temperature_C],
    ["pressure_mbar", candidate.pressure_mbar, prior.pressure_mbar],
    ["solventType", candidate.solventType, prior.solventType],
    ["solventRatio", candidate.solventRatio, prior.solventRatio],
    ["sampleState", candidate.sampleState, prior.sampleState],
  ];

  let known = 0;
  let equal = 0;
  for (const [name, left, right] of critical) {
    if (left === undefined || right === undefined) {
      reasons.push(`${name}: unknown or not recorded`);
      continue;
    }
    known += 1;
    if (same(left, right)) equal += 1;
    else reasons.push(`${name}: differs`);
  }

  const similarity = known === 0 ? 0 : equal / known;
  const sampleExact = same(candidate.sampleId, prior.sampleId);
  const materialExact = same(candidate.materialId, prior.materialId);

  let match: ExperimentMatchResult["match"] = "NOVEL";
  if (materialExact && sampleExact && similarity >= 0.95) match = "EXACT";
  else if (materialExact && similarity >= 0.6) match = "NEAR";

  return {
    match,
    similarity,
    reasons,
    priorExperimentIds: [],
  };
}

export function measurementQuality(results: MeasurementResult[]): number {
  if (!results.length) return 0;
  const score = results.reduce((sum, result) => {
    if (result.quality === "VALIDATED") return sum + 1;
    if (result.quality === "CORRECTED") return sum + 0.75;
    if (result.quality === "RAW") return sum + 0.5;
    return sum;
  }, 0);
  return score / results.length;
}

/** Evidence is a profile, not a single opaque confidence number. */
export function buildEvidenceProfile(input: {
  records: ExperimentRecord[];
  independentLabCount?: number;
  independentDatasetCount?: number;
  comparability?: number;
}): EvidenceProfile {
  const records = input.records;
  const quality = records.length
    ? records.reduce((sum, record) => sum + measurementQuality(record.results), 0) / records.length
    : 0;
  const replicated = records.filter((record) => record.knowledgeStatus.quality === "REPLICATED").length;
  const replicationStrength = records.length ? Math.min(1, replicated / Math.max(2, records.length)) : 0;
  const independence = Math.min(1, (input.independentLabCount ?? 0) / Math.max(1, records.length));
  const calibrationStatus = records.length
    ? records.filter((record) => record.purpose === "CALIBRATION").length / records.length
    : 0;

  return {
    measurementQuality: quality,
    replicationStrength,
    independence,
    calibrationStatus,
    sampleComparability: input.comparability ?? 0,
    literatureAgreement: records.length
      ? records.filter((record) => record.knowledgeStatus.evidenceLevel === "LITERATURE").length / records.length
      : 0,
    modelAgreement: records.length
      ? records.filter((record) => record.source === "SIMULATION").length / records.length
      : 0,
    uncertaintyQuality: records.some((record) => record.results.some((result) => result.uncertainty !== undefined)) ? 1 : 0,
    basis: [
      `${records.length} records evaluated`,
      `${input.independentLabCount ?? 0} independent laboratories`,
      `${input.independentDatasetCount ?? 0} independent datasets`,
    ],
  };
}

export function aggregateMeasurements(
  subjectKey: string,
  values: number[],
  independentLabCount: number,
  independentDatasetCount: number,
): KnowledgeAggregation {
  const clean = values.filter(Number.isFinite);
  const mean = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : undefined;
  const variance = mean === undefined || clean.length < 2
    ? undefined
    : clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (clean.length - 1);
  const standardDeviation = variance === undefined ? undefined : Math.sqrt(variance);
  const coefficientOfVariation = mean && standardDeviation !== undefined ? standardDeviation / Math.abs(mean) : undefined;
  const margin = standardDeviation !== undefined ? 1.96 * standardDeviation / Math.sqrt(clean.length) : undefined;

  return {
    subjectKey,
    evidenceCount: clean.length,
    independentLabCount,
    independentDatasetCount,
    replicatedCount: clean.length,
    contradictionCount: 0,
    comparability: "UNKNOWN",
    evidenceProfile: {
      measurementQuality: 0,
      replicationStrength: clean.length >= 2 ? 1 : 0,
      independence: independentLabCount > 1 ? 1 : 0,
      calibrationStatus: 0,
      sampleComparability: 0,
      literatureAgreement: 0,
      modelAgreement: 0,
      uncertaintyQuality: standardDeviation !== undefined ? 1 : 0,
      basis: ["aggregated from preserved individual observations"],
    },
    mean,
    standardDeviation,
    coefficientOfVariation,
    confidenceInterval95: mean !== undefined && margin !== undefined ? [mean - margin, mean + margin] : undefined,
    lastUpdated: new Date().toISOString(),
  };
}

export function detectConflict(
  subjectKey: string,
  records: ExperimentRecord[],
  resultName: string,
): EvidenceConflict | null {
  const values = records
    .map((record) => resultValue(record, resultName))
    .filter((value): value is number => value !== undefined && Number.isFinite(value));
  if (values.length < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const maxDeviation = Math.max(...values.map((value) => Math.abs(value - mean)));
  if (mean === 0 ? maxDeviation === 0 : maxDeviation / Math.abs(mean) < 0.2) return null;

  return {
    conflictId: `conflict-${Date.now()}`,
    subjectKey,
    experimentIds: records.map((record) => record.experimentId),
    conflictingParameters: [resultName],
    possibleExplanations: [
      "sample state or moisture",
      "geography, cultivar, growth stage or cultivation",
      "drying/storage/preparation",
      "solvent and extraction conditions",
      "frequency, power, temperature or pressure",
      "instrument calibration or hardware geometry",
      "measurement method",
    ],
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };
}

export function makeNegativeEvidence(
  experimentId: string,
  statement: string,
  conditions: Record<string, string | number | boolean>,
): NegativeEvidence {
  return {
    evidenceId: `negative-${Date.now()}`,
    experimentId,
    statement,
    conditions,
    createdAt: new Date().toISOString(),
  };
}

export function getVariable(record: ExperimentRecord, name: string) {
  return variableValue(record, name);
}
