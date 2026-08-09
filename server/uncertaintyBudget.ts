export type UncertaintySource = {
  id: string;
  name: string;
  value: number;
  unit: string;
  method: string;
  scope: string;
  provenanceId: string;
  independent: boolean;
};

export type UncertaintyBudget = {
  outputMetric: string;
  unit: string;
  sources: UncertaintySource[];
  combinedUncertainty?: number;
  method: "RSS_INDEPENDENT_ONLY" | "COVARIANCE_REQUIRED" | "INCOMPLETE";
  blockers: string[];
};

export function buildUncertaintyBudget(
  outputMetric: string,
  unit: string,
  sources: UncertaintySource[],
): UncertaintyBudget {
  const blockers: string[] = [];
  if (sources.length === 0) blockers.push("No uncertainty sources supplied.");

  for (const source of sources) {
    if (!source.id || !source.name || !source.method || !source.scope || !source.provenanceId) {
      blockers.push(`Incomplete metadata for uncertainty source ${source.id || "unknown"}.`);
    }
    if (!Number.isFinite(source.value) || source.value < 0) {
      blockers.push(`Invalid uncertainty value for ${source.id || "unknown"}.`);
    }
    if (source.unit !== unit) {
      blockers.push(`Unit mismatch for ${source.id || "unknown"}: expected ${unit}, received ${source.unit}.`);
    }
  }

  const nonIndependent = sources.filter((source) => !source.independent);
  if (nonIndependent.length > 0) {
    return {
      outputMetric,
      unit,
      sources,
      method: "COVARIANCE_REQUIRED",
      blockers: [...blockers, "One or more sources are not declared independent; covariance-aware propagation is required."],
    };
  }

  if (blockers.length > 0) {
    return { outputMetric, unit, sources, method: "INCOMPLETE", blockers };
  }

  const combinedUncertainty = Math.sqrt(sources.reduce((sum, source) => sum + source.value ** 2, 0));
  return {
    outputMetric,
    unit,
    sources,
    combinedUncertainty,
    method: "RSS_INDEPENDENT_ONLY",
    blockers: [],
  };
}
