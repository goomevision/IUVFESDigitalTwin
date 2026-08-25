export type InstrumentStatus = "SIMULATION" | "DERIVED" | "MEASURED" | "UNKNOWN" | "NOT LOADED";

export interface InstrumentContractField {
  status: InstrumentStatus;
  value?: string;
  unit?: string;
  note: string;
}

export interface InstrumentRegistryEntry {
  id: string;
  label: string;
  processRole: string;
  observedParameter: string;
  authoritativeSource: string;
  frameField: string;
  componentIds: readonly string[];
  provenance: InstrumentStatus;
  calibrationStatus: InstrumentStatus;
  calibrationCertificateReference: InstrumentContractField;
  measurementRange: InstrumentContractField;
  resolution: InstrumentContractField;
  traceability: InstrumentContractField;
  measurementUncertainty: InstrumentContractField;
  evidenceReference: InstrumentContractField;
}

const notLoaded = (note: string): InstrumentContractField => ({ status: "NOT LOADED", note });
const unknown = (note: string): InstrumentContractField => ({ status: "UNKNOWN", note });

export const INSTRUMENT_REGISTRY: readonly InstrumentRegistryEntry[] = [
  {
    id: "IUVFES-SIM-TEMP-01",
    label: "Reactor temperature channel",
    processRole: "Presents the modelled chamber temperature to the Control Room.",
    observedParameter: "Temperature",
    authoritativeSource: "Active CausalFrame",
    frameField: "sensorAfter.temperatureC",
    componentIds: ["REACTOR", "HEATER"],
    provenance: "SIMULATION",
    calibrationStatus: "NOT LOADED",
    calibrationCertificateReference: notLoaded("Certificate reference is reserved for a future real-instrument record."),
    measurementRange: unknown("Measurement range is not available in the current source contract."),
    resolution: unknown("Measurement resolution is not available in the current source contract."),
    traceability: notLoaded("Traceability chain has no loaded laboratory or metrology record."),
    measurementUncertainty: unknown("No uncertainty statement is available; no numerical uncertainty is implied."),
    evidenceReference: notLoaded("No measurement evidence reference is loaded for this channel."),
  },
  {
    id: "IUVFES-SIM-PRESS-01",
    label: "Chamber pressure channel",
    processRole: "Presents the modelled chamber pressure and vacuum context.",
    observedParameter: "Pressure",
    authoritativeSource: "Active CausalFrame",
    frameField: "sensorAfter.pressureMbar",
    componentIds: ["REACTOR", "VACUUM_PUMP", "VACUUM_PIPE"],
    provenance: "SIMULATION",
    calibrationStatus: "NOT LOADED",
    calibrationCertificateReference: notLoaded("Certificate reference is reserved for a future real-instrument record."),
    measurementRange: unknown("Measurement range is not available in the current source contract."),
    resolution: unknown("Measurement resolution is not available in the current source contract."),
    traceability: notLoaded("Traceability chain has no loaded laboratory or metrology record."),
    measurementUncertainty: unknown("No uncertainty statement is available; no numerical uncertainty is implied."),
    evidenceReference: notLoaded("No measurement evidence reference is loaded for this channel."),
  },
  {
    id: "IUVFES-SIM-ULTRA-01",
    label: "Ultrasonic effective-power channel",
    processRole: "Presents ultrasonic model diagnostics at the process interface.",
    observedParameter: "Effective ultrasonic power",
    authoritativeSource: "Active CausalFrame",
    frameField: "ultrasonic.effectivePowerW",
    componentIds: ["ULTRASONIC"],
    provenance: "SIMULATION",
    calibrationStatus: "NOT LOADED",
    calibrationCertificateReference: notLoaded("Certificate reference is reserved for a future real-instrument record."),
    measurementRange: unknown("Measurement range is not available in the current source contract."),
    resolution: unknown("Measurement resolution is not available in the current source contract."),
    traceability: notLoaded("Traceability chain has no loaded laboratory or metrology record."),
    measurementUncertainty: unknown("No uncertainty statement is available; no numerical uncertainty is implied."),
    evidenceReference: notLoaded("No measurement evidence reference is loaded for this channel."),
  },
  ...[1, 2, 3, 4].map(index => ({
    id: `IUVFES-SIM-TRAP-TEMP-0${index}`,
    label: `Cold-trap ${index} temperature channel`,
    processRole: `Presents cold-trap stage ${index} diagnostic temperature when the CausalFrame provides it.`,
    observedParameter: "Cold-trap temperature",
    authoritativeSource: "Active CausalFrame hardware diagnostics",
    frameField: `hardwareDiagnostics.coldTrapTemperaturesC[${index - 1}]`,
    componentIds: [`COLD_TRAP_${index}`, "CONDENSER"],
    provenance: "SIMULATION" as const,
    calibrationStatus: "NOT LOADED" as const,
    calibrationCertificateReference: notLoaded("Certificate reference is reserved for a future real-instrument record."),
    measurementRange: unknown("Measurement range is not available in the current source contract."),
    resolution: unknown("Measurement resolution is not available in the current source contract."),
    traceability: notLoaded("Traceability chain has no loaded laboratory or metrology record."),
    measurementUncertainty: unknown("No uncertainty statement is available; no numerical uncertainty is implied."),
    evidenceReference: notLoaded("No measurement evidence reference is loaded for this channel."),
  })),
];

export function getInstrumentRegistryEntry(id: string | null | undefined): InstrumentRegistryEntry | undefined {
  return INSTRUMENT_REGISTRY.find(entry => entry.id === id);
}

export function getInstrumentForMachineComponent(componentId: string | null | undefined): InstrumentRegistryEntry | undefined {
  if (!componentId) return undefined;
  return INSTRUMENT_REGISTRY.find(entry => entry.componentIds.includes(componentId));
}
