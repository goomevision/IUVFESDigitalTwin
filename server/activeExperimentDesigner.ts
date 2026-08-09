export type UncertaintyDriver = {
  id: string;
  parameter: string;
  normalizedUncertainty: number;
  sensitivity: number;
  evidenceGap: number;
  safetyWeight?: number;
};

export type ExperimentCandidate = {
  id: string;
  objective: string;
  parameters: string[];
  expectedInformationGain: number;
  feasibility: number;
  safety: number;
  priorityScore: number;
  rationale: string[];
};

/**
 * Ranks candidate experiments using explicit model sensitivity, uncertainty,
 * evidence gap, feasibility and safety inputs. It does not fabricate expected
 * information gain; callers must provide a defensible estimate or measurement.
 */
export function rankExperimentCandidates(
  drivers: UncertaintyDriver[],
  candidates: Array<Omit<ExperimentCandidate, "priorityScore" | "rationale">>,
): ExperimentCandidate[] {
  const driverByParameter = new Map(drivers.map((driver) => [driver.parameter, driver]));

  return candidates
    .map((candidate) => {
      const linked = candidate.parameters.map((parameter) => driverByParameter.get(parameter)).filter(Boolean) as UncertaintyDriver[];
      const evidenceNeed = linked.length === 0 ? 0 : linked.reduce((sum, d) => sum + d.normalizedUncertainty * d.evidenceGap * Math.abs(d.sensitivity), 0) / linked.length;
      const safetyWeight = linked.length === 0 ? 0 : linked.reduce((sum, d) => sum + (d.safetyWeight ?? 0), 0) / linked.length;
      const priorityScore = Math.max(0, candidate.expectedInformationGain) * Math.max(0, candidate.feasibility) * Math.max(0, candidate.safety) * (1 + evidenceNeed) * (1 + safetyWeight);
      const rationale = linked.map((d) => `${d.parameter}: sensitivity=${d.sensitivity}, uncertainty=${d.normalizedUncertainty}, evidenceGap=${d.evidenceGap}`);
      return { ...candidate, priorityScore, rationale };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
