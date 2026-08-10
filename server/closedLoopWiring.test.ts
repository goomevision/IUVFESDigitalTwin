import { describe, expect, it } from "vitest";
import {
  CLOSED_LOOP_ENGINE_DRIVERS,
  CLOSED_LOOP_METADATA_ONLY,
  getClosedLoopWiringReport,
  mapExperimentInputsToEngine,
} from "./closedLoopWiring";

describe("closed-loop wiring contract", () => {
  it("maps every physics input to the engine config without changing values", () => {
    const config = mapExperimentInputsToEngine({
      materialWeight: 12.5,
      waterContent: 48,
      oilContent: 3.2,
      targetPressure: 85,
      targetTemperature: 62,
      coolingTemperature: 35,
      dtSeconds: 0.5,
      maxSteps: 7200,
    });

    expect(config).toEqual({
      materialWeightKg: 12.5,
      waterContentPercent: 48,
      oilContentPercent: 3.2,
      targetPressureMbar: 85,
      targetTemperatureC: 62,
      coolingTemperatureC: 35,
      dtSeconds: 0.5,
      maxSteps: 7200,
      ultrasonic: {
        frequencyKHz: undefined,
        requestedPowerW: undefined,
        dutyCyclePercent: undefined,
        maxElectricalPowerW: undefined,
      },
    });
  });

  it("maps ultrasonic experiment controls into the explicit experimental engine channel", () => {
    const config = mapExperimentInputsToEngine({
      materialWeight: 10,
      waterContent: 50,
      oilContent: 3,
      targetPressure: 100,
      targetTemperature: 60,
      ultrasonicFrequency: 40,
      ultrasonicPowerW: 1500,
      ultrasonicDutyCyclePercent: 70,
      ultrasonicMaxPowerW: 3000,
      materialWaterRatio: "1:1",
      processModel: "hybrid",
    });

    expect(config.ultrasonic).toEqual({
      frequencyKHz: 40,
      requestedPowerW: 1500,
      dutyCyclePercent: 70,
      maxElectricalPowerW: 3000,
    });
    expect(config).not.toHaveProperty("materialWaterRatio");
    expect(config).not.toHaveProperty("processModel");
  });

  it("publishes an auditable wiring report", () => {
    const report = getClosedLoopWiringReport();
    expect(report.engineDrivers).toEqual(CLOSED_LOOP_ENGINE_DRIVERS);
    expect(report.metadataOnly).toEqual(CLOSED_LOOP_METADATA_ONLY);
    expect(report.engineDrivers).toContain("ultrasonicFrequency");
    expect(report.engineDrivers).toContain("ultrasonicPowerW");
    expect(report.engineDrivers).toContain("ultrasonicDutyCyclePercent");
  });
});
