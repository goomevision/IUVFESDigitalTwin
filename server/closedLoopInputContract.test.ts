import { describe, expect, it } from "vitest";
import { CLOSED_LOOP_ENGINE_DATA_SOURCE, CLOSED_LOOP_ENGINE_INPUT_KEYS, describeClosedLoopEngineContract } from "./closedLoopInputContract";

describe("closed-loop engine input contract", () => {
  it("lists only parameters supported by the current physics engine", () => {
    expect(CLOSED_LOOP_ENGINE_INPUT_KEYS).toEqual([
      "targetPressureMbar",
      "targetTemperatureC",
      "materialWeightKg",
      "waterContentPercent",
      "oilContentPercent",
      "dtSeconds",
      "maxSteps",
    ]);
  });

  it("identifies the real engine as the source of physics data", () => {
    const contract = describeClosedLoopEngineContract();
    expect(contract.source).toBe(CLOSED_LOOP_ENGINE_DATA_SOURCE);
    expect(contract.guarantee).toContain("Only listed inputs are physics drivers");
  });
});
