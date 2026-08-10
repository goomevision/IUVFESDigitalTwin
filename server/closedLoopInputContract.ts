import type { ClosedLoopSimulationConfig } from "./closedLoopSimulation";

/**
 * Single source of truth for parameters that currently drive the closed-loop
 * physics engine. Parameters stored on an experiment but not listed here are
 * metadata until a corresponding physics model is implemented.
 */
export const CLOSED_LOOP_ENGINE_INPUT_KEYS = [
  "targetPressureMbar",
  "targetTemperatureC",
  "materialWeightKg",
  "waterContentPercent",
  "oilContentPercent",
  "dtSeconds",
  "maxSteps",
] as const satisfies readonly (keyof ClosedLoopSimulationConfig)[];

export type ClosedLoopEngineInputKey = typeof CLOSED_LOOP_ENGINE_INPUT_KEYS[number];

export const CLOSED_LOOP_ENGINE_DATA_SOURCE = "ClosedLoopSimulationEngine" as const;

export function describeClosedLoopEngineContract() {
  return {
    source: CLOSED_LOOP_ENGINE_DATA_SOURCE,
    inputs: [...CLOSED_LOOP_ENGINE_INPUT_KEYS],
    guarantee: "Only listed inputs are physics drivers; other experiment fields remain metadata until explicitly modeled.",
  } as const;
}
