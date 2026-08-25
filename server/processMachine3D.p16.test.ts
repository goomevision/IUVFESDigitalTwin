import { describe, expect, it } from "vitest";
import {
  getProcessMachineComponentExplanation,
  PROCESS_FLOW_PRESENTATION,
  SCIENTIFIC_STATUS_LEGEND,
} from "../client/src/components/ProcessMachine3D";

describe("P16 ProcessMachine3D scientific presentation", () => {
  it("keeps the scientific status vocabulary explicit without presenting unloaded measurements", () => {
    expect(SCIENTIFIC_STATUS_LEGEND.map(item => item.label)).toEqual([
      "SIMULATION",
      "DERIVED",
      "MEASURED",
      "UNKNOWN",
    ]);
    expect(SCIENTIFIC_STATUS_LEGEND.find(item => item.label === "MEASURED")?.description)
      .toContain("No measurement dataset is loaded");
    expect(SCIENTIFIC_STATUS_LEGEND.find(item => item.label === "UNKNOWN")?.description)
      .toContain("does not estimate");
  });

  it("labels the presentation flow with authoritative source categories instead of synthetic process values", () => {
    expect(PROCESS_FLOW_PRESENTATION.map(step => step.id)).toEqual([
      "CHAMBER",
      "VAPOR",
      "TRAPS",
      "VACUUM",
      "COOLING",
    ]);
    expect(PROCESS_FLOW_PRESENTATION.find(step => step.id === "VAPOR")?.source)
      .toBe("effectiveCommands + actuatorLevels");
    expect(PROCESS_FLOW_PRESENTATION.find(step => step.id === "VACUUM")?.source)
      .toBe("sensorAfter.pressureMbar");
  });

  it("explains components using authoritative inputs while retaining provenance and interpretation limits", () => {
    const heater = getProcessMachineComponentExplanation("HEATER");
    const vaporPath = getProcessMachineComponentExplanation("VAPOR_PIPE");
    const coldTrap = getProcessMachineComponentExplanation("COLD_TRAP_1");

    expect(heater.classification).toBe("SIMULATION");
    expect(heater.authoritativeInput).toContain("effectiveCommands.heater");
    expect(vaporPath.classification).toBe("DERIVED");
    expect(vaporPath.interpretationLimit).toContain("not report measured vapor");
    expect(coldTrap.authoritativeInput).toContain("coldTrapTemperaturesC[0]");
    expect(coldTrap.interpretationLimit).toContain("UNKNOWN");
  });
});
