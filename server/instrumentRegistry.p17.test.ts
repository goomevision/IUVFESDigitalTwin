import { describe, expect, it } from "vitest";
import {
  getInstrumentForMachineComponent,
  getInstrumentRegistryEntry,
  INSTRUMENT_REGISTRY,
} from "../client/src/lib/instrumentRegistry";

describe("P17 instrument and calibration foundation", () => {
  it("keeps every registry entry as a declared source contract without invented calibration or uncertainty values", () => {
    expect(INSTRUMENT_REGISTRY.length).toBeGreaterThanOrEqual(7);

    INSTRUMENT_REGISTRY.forEach(entry => {
      expect(entry.provenance).toBe("SIMULATION");
      expect(entry.calibrationStatus).toBe("NOT LOADED");
      expect(entry.calibrationCertificateReference.value).toBeUndefined();
      expect(entry.measurementRange.value).toBeUndefined();
      expect(entry.resolution.value).toBeUndefined();
      expect(entry.measurementUncertainty.value).toBeUndefined();
      expect(entry.traceability.status).toBe("NOT LOADED");
      expect(entry.evidenceReference.status).toBe("NOT LOADED");
    });
  });

  it("maps renderer sensor contexts to the registry without changing CausalFrame field authority", () => {
    const temperature = getInstrumentForMachineComponent("HEATER");
    const pressure = getInstrumentForMachineComponent("VACUUM_PIPE");
    const coldTrap = getInstrumentForMachineComponent("COLD_TRAP_3");

    expect(temperature?.frameField).toBe("sensorAfter.temperatureC");
    expect(pressure?.frameField).toBe("sensorAfter.pressureMbar");
    expect(coldTrap?.frameField).toBe("hardwareDiagnostics.coldTrapTemperaturesC[2]");
    expect(getInstrumentForMachineComponent("VAPOR_PIPE")).toBeUndefined();
  });

  it("resolves known instrument identifiers while preserving absent records as unavailable", () => {
    expect(getInstrumentRegistryEntry("IUVFES-SIM-TEMP-01")?.label).toBe("Reactor temperature channel");
    expect(getInstrumentRegistryEntry("IUVFES-LAB-NOT-LOADED")).toBeUndefined();
  });
});
