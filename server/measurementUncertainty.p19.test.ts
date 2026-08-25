import { describe, expect, it } from "vitest";
import {
  getInstrumentRegistryEntry,
  getMeasurementUncertaintyBudget,
  getMetrologicalTraceabilityChain,
  hasQuantifiedMeasurementUncertainty,
  hasVerifiedMetrologicalTraceability,
} from "../client/src/lib/instrumentRegistry";

describe("P19 measurement uncertainty foundation", () => {
  it("creates the required uncertainty components without synthetic numerical uncertainty", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-TEMP-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    const budget = getMeasurementUncertaintyBudget(entry);
    expect(budget.availability).toBe("NOT AVAILABLE");
    expect(budget.status).toBe("NOT LOADED");
    expect(budget.components.map(component => component.kind)).toEqual([
      "INSTRUMENT",
      "CALIBRATION",
      "RESOLUTION",
      "REPEATABILITY",
      "REFERENCE_STANDARD",
      "ENVIRONMENTAL",
      "OTHER",
    ]);
    expect(hasQuantifiedMeasurementUncertainty(budget)).toBe(false);
    budget.components.forEach(component => expect(component.standardUncertainty).not.toMatch(/^[-+]?\d/));
  });

  it("does not convert the simulation channel into a measured result or uncertainty claim", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-PRESS-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    const budget = getMeasurementUncertaintyBudget(entry);
    const instrument = budget.components.find(component => component.kind === "INSTRUMENT");
    expect(instrument?.provenance).toBe("SIMULATION");
    expect(instrument?.status).toBe("NOT APPLICABLE");
    expect(budget.measurementResultStatus).toBe("NOT APPLICABLE");
    expect(budget.interpretationLimit).toContain("No uncertainty budget");
  });

  it("retains unknown fields and evidence-bound traceability without a verified chain", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-TRAP-TEMP-04");
    expect(entry).toBeDefined();
    if (!entry) return;

    const budget = getMeasurementUncertaintyBudget(entry);
    expect(budget.components.find(component => component.kind === "RESOLUTION")?.status).toBe("UNKNOWN");
    expect(budget.components.find(component => component.kind === "OTHER")?.status).toBe("UNKNOWN");
    expect(hasVerifiedMetrologicalTraceability(getMetrologicalTraceabilityChain(entry))).toBe(false);
  });
});
