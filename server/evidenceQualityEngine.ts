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

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

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

  const valid = samples.filter((sample) => Number.isFinite(sample.value));
  if (valid.length >= 3) {
    const values = valid.map((sample) => sample.value);
    const center = median(values);
    const deviations = values.map((value) => Math.abs(value - center));
    const mad = median(deviations);
    if (mad > 0) {
      const scale = 1.4826 * mad;
      for (const sample of valid) {
        const z = Math.abs((sample.value - center) / scale);
        if (z > outlierZ) issues.push({ evidenceId: sample.evidenceId, code: "OUTLIER_CANDIDATE", message: `Observation is an outlier candidate (|z|=${z.toFixed(3)}).` });
      }
    }
  }

  return { status: issues.length === 0 ? "READY" : "REVIEW_REQUIRED", issues, sampleCount: samples.length };
}
