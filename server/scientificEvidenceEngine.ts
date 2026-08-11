/**
 * Laboratory evidence ingestion/comparison layer.
 *
 * HARD RULES:
 * - LABORATORY and SIMULATION are immutable, separate evidence paths.
 * - measured values are never overwritten by modelled values.
 * - comparison output is DERIVED and cannot be promoted automatically to VERIFIED.
 * - provenance is explicit; it is never inferred from an instrument name.
 */

export type EvidenceOrigin = "LABORATORY" | "SIMULATION" | "DERIVED";
export type EvidenceDisposition = "SUPPORTED" | "CONTRADICTED" | "INCONCLUSIVE";
export type ReplicationDisposition = "NOT_ASSESSED" | "REPLICATED" | "NOT_REPLICATED" | "CONFLICT";

export interface LabMeasurement {
  measurementId: string;
  experimentId: string;
  materialId: string;
  sampleId: string;
  origin: "LABORATORY";
  parameter: string;
  measuredValue: number;
  unit: string;
  uncertainty?: number;
  instrumentId?: string;
  calibrationId?: string;
  protocolId?: string;
  laboratoryId?: string;
  provenanceId: string;
  observedAt: string;
}

export interface SimulationMeasurement {
  measurementId: string;
  experimentId: string;
  materialId: string;
  sampleId: string;
  origin: "SIMULATION";
  parameter: string;
  modelledValue: number;
  unit: string;
  modelVersion: string;
  simulationRunId: string;
  observedAt: string;
}

export interface MeasurementComparison {
  comparisonId: string;
  experimentId: string;
  materialId: string;
  sampleId: string;
  parameter: string;
  origin: "DERIVED";
  measuredValue: number;
  modelledValue: number;
  absoluteError: number;
  relativeErrorPercent?: number;
  combinedUncertainty?: number;
  zScore?: number;
  disposition: EvidenceDisposition;
  reason: string;
  createdAt: string;
}

export interface ReplicationAssessment {
  subjectKey: string;
  comparableCount: number;
  independentLabCount: number;
  agreementRate: number;
  disposition: ReplicationDisposition;
  reasons: string[];
}

export interface EvidenceScore {
  measurementQuality: number;
  replicationStrength: number;
  independence: number;
  calibrationStatus: number;
  sampleComparability: number;
  uncertaintyQuality: number;
  overall: number;
  basis: string[];
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function compareMeasurements(
  measured: LabMeasurement,
  modelled: SimulationMeasurement,
  toleranceRelative = 0.05,
): MeasurementComparison {
  if (measured.origin !== "LABORATORY") throw new Error("Measured input must have origin LABORATORY");
  if (modelled.origin !== "SIMULATION") throw new Error("Model input must have origin SIMULATION");
  if (measured.materialId !== modelled.materialId || measured.sampleId !== modelled.sampleId) {
    throw new Error("Laboratory and simulation measurements must refer to the same material/sample");
  }
  if (measured.parameter !== modelled.parameter || measured.unit !== modelled.unit) {
    throw new Error("Measurement parameter/unit mismatch");
  }

  const absoluteError = Math.abs(measured.measuredValue - modelled.modelledValue);
  const scale = Math.max(Math.abs(measured.measuredValue), Math.abs(modelled.modelledValue), Number.EPSILON);
  const relativeErrorPercent = absoluteError / scale * 100;
  const combinedUncertainty = measured.uncertainty !== undefined
    ? Math.sqrt(measured.uncertainty ** 2 + (modelled.modelledValue * toleranceRelative) ** 2)
    : undefined;
  const zScore = combinedUncertainty && combinedUncertainty > 0 ? absoluteError / combinedUncertainty : undefined;

  const disposition: EvidenceDisposition = relativeErrorPercent <= toleranceRelative * 100
    ? "SUPPORTED"
    : zScore !== undefined && zScore <= 2
      ? "INCONCLUSIVE"
      : "CONTRADICTED";

  return {
    comparisonId: `cmp:${measured.measurementId}:${modelled.measurementId}`,
    experimentId: measured.experimentId,
    materialId: measured.materialId,
    sampleId: measured.sampleId,
    parameter: measured.parameter,
    origin: "DERIVED",
    measuredValue: measured.measuredValue,
    modelledValue: modelled.modelledValue,
    absoluteError,
    relativeErrorPercent,
    combinedUncertainty,
    zScore,
    disposition,
    reason: disposition === "SUPPORTED"
      ? "Measured value agrees with the simulation within the configured relative tolerance."
      : disposition === "CONTRADICTED"
        ? "Measured value differs from the simulation beyond the configured tolerance/uncertainty."
        : "Difference cannot be classified confidently without stronger uncertainty information.",
    createdAt: new Date().toISOString(),
  };
}

export function assessReplication(comparisons: MeasurementComparison[], independentLabIds: string[] = []): ReplicationAssessment {
  if (comparisons.length === 0) {
    return { subjectKey: "UNKNOWN", comparableCount: 0, independentLabCount: independentLabIds.length, agreementRate: 0, disposition: "NOT_ASSESSED", reasons: ["No comparable laboratory measurements available."] };
  }
  const supported = comparisons.filter(c => c.disposition === "SUPPORTED").length;
  const contradicted = comparisons.filter(c => c.disposition === "CONTRADICTED").length;
  const agreementRate = supported / comparisons.length;
  const disposition: ReplicationDisposition = contradicted > 0 && supported > 0
    ? "CONFLICT"
    : agreementRate >= 0.8 && independentLabIds.length >= 1
      ? "REPLICATED"
      : "NOT_REPLICATED";
  return {
    subjectKey: `${comparisons[0].materialId}:${comparisons[0].sampleId}:${comparisons[0].parameter}`,
    comparableCount: comparisons.length,
    independentLabCount: independentLabIds.length,
    agreementRate,
    disposition,
    reasons: [
      `${supported} supported, ${contradicted} contradicted, ${comparisons.length - supported - contradicted} inconclusive comparisons.`,
      independentLabIds.length > 0 ? `${independentLabIds.length} independent laboratory source(s) supplied.` : "Independent laboratory count is not established.",
    ],
  };
}

export function calculateEvidenceScore(args: {
  measurementQuality: number;
  replicationStrength: number;
  independence: number;
  calibrationStatus: number;
  sampleComparability: number;
  uncertaintyQuality: number;
  basis?: string[];
}): EvidenceScore {
  const values = [args.measurementQuality, args.replicationStrength, args.independence, args.calibrationStatus, args.sampleComparability, args.uncertaintyQuality].map(v => clamp(v));
  const overall = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    measurementQuality: values[0], replicationStrength: values[1], independence: values[2], calibrationStatus: values[3], sampleComparability: values[4], uncertaintyQuality: values[5], overall,
    basis: args.basis ?? [],
  };
}
