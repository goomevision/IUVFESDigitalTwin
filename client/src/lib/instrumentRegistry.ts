export type InstrumentStatus = "SIMULATION" | "DERIVED" | "MEASURED" | "UNKNOWN" | "NOT LOADED";
export type TraceabilityNodeStatus = "VERIFIED" | "NOT LOADED" | "UNKNOWN" | "NOT APPLICABLE";
export type TraceabilityNodeKind = "INSTRUMENT" | "CALIBRATION_CERTIFICATE" | "REFERENCE_STANDARD" | "CALIBRATION_LABORATORY" | "MEASUREMENT_RESULT" | "EVIDENCE_PROVENANCE";
export type UncertaintyComponentStatus = "NOT LOADED" | "UNKNOWN" | "NOT APPLICABLE";
export type UncertaintyComponentKind = "INSTRUMENT" | "CALIBRATION" | "RESOLUTION" | "REPEATABILITY" | "REFERENCE_STANDARD" | "ENVIRONMENTAL" | "OTHER";
export type UncertaintyAvailability = "NOT AVAILABLE";

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

export interface MetrologicalTraceabilityNode {
  kind: TraceabilityNodeKind;
  label: string;
  status: TraceabilityNodeStatus;
  identifierReference: string;
  source: string;
  provenance: InstrumentStatus;
  interpretationLimit: string;
}

export interface MeasurementUncertaintyComponent {
  id: string;
  kind: UncertaintyComponentKind;
  label: string;
  sourceReference: string;
  distribution: string;
  evaluationMethod: string;
  standardUncertainty: string;
  sensitivityCoefficient: string;
  contribution: string;
  provenance: InstrumentStatus;
  status: UncertaintyComponentStatus;
  interpretationLimit: string;
}

export interface MeasurementUncertaintyBudget {
  availability: UncertaintyAvailability;
  status: "NOT LOADED";
  measurementResultStatus: "NOT APPLICABLE";
  components: readonly MeasurementUncertaintyComponent[];
  interpretationLimit: string;
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

export function getMetrologicalTraceabilityChain(entry: InstrumentRegistryEntry): readonly MetrologicalTraceabilityNode[] {
  return [
    {
      kind: "INSTRUMENT",
      label: "Instrument",
      status: "NOT APPLICABLE",
      identifierReference: entry.id,
      source: "P17 Instrument Registry",
      provenance: entry.provenance,
      interpretationLimit: "This identifier names a simulation channel contract, not a verified physical instrument.",
    },
    {
      kind: "CALIBRATION_CERTIFICATE",
      label: "Calibration Certificate",
      status: "NOT LOADED",
      identifierReference: "NOT LOADED",
      source: "No certificate source loaded",
      provenance: "NOT LOADED",
      interpretationLimit: "No certificate, date, scope, or validity can be inferred from this UI.",
    },
    {
      kind: "REFERENCE_STANDARD",
      label: "Reference Standard",
      status: "NOT LOADED",
      identifierReference: "NOT LOADED",
      source: "No reference-standard source loaded",
      provenance: "NOT LOADED",
      interpretationLimit: "No reference standard or comparison relationship is available.",
    },
    {
      kind: "CALIBRATION_LABORATORY",
      label: "Calibration Laboratory",
      status: "NOT LOADED",
      identifierReference: "NOT LOADED",
      source: "No laboratory source loaded",
      provenance: "NOT LOADED",
      interpretationLimit: "No laboratory identity, competence, scope, or accreditation claim is available.",
    },
    {
      kind: "MEASUREMENT_RESULT",
      label: "Measurement Result",
      status: "NOT APPLICABLE",
      identifierReference: entry.frameField,
      source: entry.authoritativeSource,
      provenance: entry.provenance,
      interpretationLimit: "This Control Room field is simulation-derived and is not a measured result.",
    },
    {
      kind: "EVIDENCE_PROVENANCE",
      label: "Evidence / Provenance",
      status: "NOT APPLICABLE",
      identifierReference: entry.frameField,
      source: "Active CausalFrame provenance",
      provenance: entry.provenance,
      interpretationLimit: "CausalFrame provenance supports simulation traceability only; it is not metrological evidence.",
    },
  ];
}

export function hasVerifiedMetrologicalTraceability(nodes: readonly MetrologicalTraceabilityNode[]) {
  return nodes.length > 0 && nodes.every(node => node.status === "VERIFIED");
}

export function getMeasurementUncertaintyBudget(entry: InstrumentRegistryEntry): MeasurementUncertaintyBudget {
  const notLoaded = (id: string, kind: UncertaintyComponentKind, label: string, limit: string): MeasurementUncertaintyComponent => ({
    id, kind, label, sourceReference: "NOT LOADED", distribution: "NOT LOADED", evaluationMethod: "NOT LOADED", standardUncertainty: "NOT LOADED", sensitivityCoefficient: "NOT LOADED", contribution: "NOT LOADED", provenance: "NOT LOADED", status: "NOT LOADED", interpretationLimit: limit,
  });
  const unknown = (id: string, kind: UncertaintyComponentKind, label: string, limit: string): MeasurementUncertaintyComponent => ({
    id, kind, label, sourceReference: "UNKNOWN", distribution: "UNKNOWN", evaluationMethod: "UNKNOWN", standardUncertainty: "UNKNOWN", sensitivityCoefficient: "UNKNOWN", contribution: "UNKNOWN", provenance: "UNKNOWN", status: "UNKNOWN", interpretationLimit: limit,
  });
  return {
    availability: "NOT AVAILABLE",
    status: "NOT LOADED",
    measurementResultStatus: "NOT APPLICABLE",
    components: [
      { id: `${entry.id}:INSTRUMENT`, kind: "INSTRUMENT", label: "Instrument contribution", sourceReference: `P17 Instrument Registry / ${entry.id}`, distribution: "NOT APPLICABLE", evaluationMethod: "NOT APPLICABLE", standardUncertainty: "NOT APPLICABLE", sensitivityCoefficient: "NOT APPLICABLE", contribution: "NOT APPLICABLE", provenance: entry.provenance, status: "NOT APPLICABLE", interpretationLimit: "The current channel is simulation provenance, not a physical instrument uncertainty contribution." },
      notLoaded(`${entry.id}:CALIBRATION`, "CALIBRATION", "Calibration contribution", "No calibration record or calibration uncertainty is loaded."),
      unknown(`${entry.id}:RESOLUTION`, "RESOLUTION", "Resolution contribution", "Resolution is unavailable in the current source contract; no value is inferred."),
      notLoaded(`${entry.id}:REPEATABILITY`, "REPEATABILITY", "Repeatability contribution", "No repeatability study or measurement series is loaded."),
      notLoaded(`${entry.id}:REFERENCE_STANDARD`, "REFERENCE_STANDARD", "Reference standard contribution", "No reference-standard record or uncertainty is loaded."),
      notLoaded(`${entry.id}:ENVIRONMENTAL`, "ENVIRONMENTAL", "Environmental contribution", "No environmental measurement context or uncertainty is loaded."),
      unknown(`${entry.id}:OTHER`, "OTHER", "Other contribution", "No other uncertainty source is defined or estimated."),
    ],
    interpretationLimit: "No uncertainty budget, combined uncertainty, expanded uncertainty, or measurement result is available from this simulation-only contract.",
  };
}

export function hasQuantifiedMeasurementUncertainty(budget: MeasurementUncertaintyBudget) {
  return budget.components.some(component => /^[-+]?\d/.test(component.standardUncertainty));
}
