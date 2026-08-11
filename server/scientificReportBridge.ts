/**
 * Scientific report bridge for the causal closed-loop simulator.
 *
 * The bridge deliberately keeps simulation output in the ESTIMATED/MODEL layer.
 * It never promotes simulation output to laboratory evidence.
 */
import type { ClosedLoopResult } from "./closedLoopSimulation";
import type { MaterialGap, ExperimentRecommendation } from "../shared/scientific";
import type { ScientificReportV2 } from "../shared/scientific-v2";

export interface ScientificReportBridgeContext {
  experimentId: string;
  materialId: string;
  sampleId: string;
  unknowns?: MaterialGap[];
  priorRecommendations?: ExperimentRecommendation[];
}

export function buildScientificReportFromSimulation(
  result: ClosedLoopResult,
  context: ScientificReportBridgeContext,
): ScientificReportV2 {
  const final = result.finalSensors;
  const estimated = [
    {
      statement: `Simulation ended in stage ${result.status}.`,
      basis: "ClosedLoopSimulationEngine deterministic process model.",
    },
    {
      statement: `Estimated yieldPercent = ${final.yieldPercent}.`,
      basis: "Simulation sensor state; not a laboratory measurement.",
    },
    {
      statement: `Estimated oilRecoveredKg = ${final.oilRecoveredKg}.`,
      basis: "Simulation sensor state; requires laboratory mass measurement for validation.",
    },
    {
      statement: `Estimated waterRemovedKg = ${final.waterRemovedKg}.`,
      basis: "Simulation sensor state; requires laboratory mass balance for validation.",
    },
    {
      statement: `Estimated energyKwh = ${final.energyKwh}.`,
      basis: "Simulation sensor state; requires calibrated hardware measurement for validation.",
    },
  ];

  const aiAnalysis = [
    {
      statement: "The simulation can generate testable predictions but cannot establish experimental truth.",
      reasoning: "The closed-loop engine is deterministic and explicitly requires laboratory calibration before scientific or engineering claims.",
    },
    {
      statement: result.status === "FAULT"
        ? "The simulated process reached FAULT and should be investigated before using its output for experimental planning."
        : "The simulated process completed without a simulated FAULT; laboratory validation remains required.",
      reasoning: "Process-state outcome from the simulation run.",
    },
  ];

  const nextExperiments: ExperimentRecommendation[] = [
    {
      recommendationId: `${context.experimentId}:lab-validation`,
      materialId: context.materialId,
      sampleId: context.sampleId,
      purpose: "VALIDATION",
      proposedParameters: {
        targetPressureMbar: result.finalSensors.pressureMbar,
        targetTemperatureC: result.finalSensors.temperatureC,
      },
      reason: "Measure the corresponding physical process outputs under a documented sample/protocol context and compare them with the simulation prediction.",
      confirms: ["simulation mass/temperature/pressure behavior under the tested protocol"],
      falsifies: ["the assumption that the current reduced-order model predicts the observed endpoint within the laboratory uncertainty"],
      knowledgeGaps: ["simulation-to-laboratory calibration"],
    },
  ];

  return {
    experimentId: context.experimentId,
    verified: [],
    estimated,
    aiAnalysis,
    unknowns: context.unknowns ?? [],
    nextExperiments: context.priorRecommendations?.length
      ? [...context.priorRecommendations, ...nextExperiments]
      : nextExperiments,
    conflicts: [],
    negativeEvidence: [],
    lineage: [],
    frequencySweeps: [],
    aggregations: [],
  };
}
