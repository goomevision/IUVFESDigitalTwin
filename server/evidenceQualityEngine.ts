export type EvidenceSample = {
  evidenceId: string;
  parameter: string;
  value: number;
  unit: string;
  uncertainty?: number;
  timestampS?: number;
};

export type QualityIssue = {
  evidenceId: string;
  code: "MISSING_UNCERTAINTY" | "NON_FINITE" | "NEGATIVE_UNCERTAINTY" | "OUTLIER_CANDIDATE";
  message: string;
};

export type EvidenceQualityReport = {
  status: "READY" | "REVIEW_REQUIRED";
  issues: QualityIssue[];
  sampleCount: number;
};

/**
 * Conservative screening only. Outliers are flagged as candidates and never
 * deleted or corrected automatically. Units must already be normalized by the
 * caller; this layer does not silently convert unknown units.
 */
export function assessEvidenceQuality(samples: EvidenceSample[], outlierZ = 3): EvidenceQualityReport {
  const issues: QualityIssue[] = [];
  if (samples.length === 0) return { status: "REVIEW_REQUIRED", issues: [], sampleCount: 0 };

  for (const sample of samples) {
    if (!Number.isFinite(sample.value)) issues.push({ evidenceId: sample.evidenceId, code: "NON_FINITE", message: "Observation value is not finite." });
    if (sample.uncertainty === undefined) issues.push({ evidenceId: sample.evidenceId, code: "MISSING_UNCERTAINTY", message: "Measurement uncertainty is not recorded." });
    else if (!Number.isFinite(sample.uncertainty) || sample.uncertainty < 0) issues.push({ evidenceId: sample.evidenceId, code: "NEGATIVE_UNCERTAINTY", message: "Measurement uncertainty is invalid." });
  }

  const valid = samples.filter((sample) => Number.isFinite(sample.value)).map((sample) => sample.value);
  if (valid.length >= 3) {
    const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
    const variance = valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (valid.length - 1);
    const sd = Math.sqrt(variance);
    if (sd > 0) {
      for (const sample of samples) {
        const z = Math.abs((sample.value - mean) / sd);
        if (z > outlierZ) issues.push({ evidenceId: sample.evidenceId, code: "OUTLIER_CANDIDATE", message: `Observation is an outlier candidate (|z|=${z.toFixed(3)}).` });
      }
    }
  }

  return { status: issues.length === 0 ? "READY" : "REVIEW_REQUIRED", issues, sampleCount: samples.length };
}
