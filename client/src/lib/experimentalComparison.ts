export type ComparisonFieldStatus = "NOT LOADED" | "UNKNOWN" | "NOT APPLICABLE";
export type ComparisonReadiness = "NOT READY" | "PARTIAL" | "READY FOR COMPARISON" | "COMPARISON AVAILABLE" | "VERIFICATION REQUIRED";
export type ComparisonScientificClassification = "SIMULATION" | "DERIVED" | "MEASURED" | "UNKNOWN";
export type ComparisonGateKey = "SAMPLE_ALIGNMENT" | "TIMESTAMP_ALIGNMENT" | "UNIT_COMPATIBILITY" | "INSTRUMENT_IDENTITY" | "CALIBRATION_STATUS" | "TRACEABILITY_STATUS" | "UNCERTAINTY_STATUS" | "PROVENANCE_STATUS" | "MEASUREMENT_STATUS";

export interface ComparisonContractField {
  status: ComparisonFieldStatus;
  value?: string;
  note: string;
}

export interface ComparisonValueContext {
  simulationValue?: string;
  measuredValue?: string;
  difference?: string;
  unit?: string;
  uncertaintyContext?: string;
  timestampContext?: string;
  provenance?: ComparisonScientificClassification;
  interpretationLimit: string;
}

export interface ComparisonRecord {
  comparisonId: ComparisonContractField;
  simulationReference: ComparisonContractField;
  measurementReference: ComparisonContractField;
  experimentId: ComparisonContractField;
  sampleId: ComparisonContractField;
  instrumentId: ComparisonContractField;
  measurementChannel: ComparisonContractField;
  simulationField: ComparisonContractField;
  measurementField: ComparisonContractField;
  unit: ComparisonContractField;
  timestampAlignment: ComparisonContractField;
  sampleAlignment: ComparisonContractField;
  instrumentAlignment: ComparisonContractField;
  calibrationStatus: ComparisonContractField;
  traceabilityStatus: ComparisonContractField;
  uncertaintyStatus: ComparisonContractField;
  provenanceStatus: ComparisonContractField;
  comparisonStatus: ComparisonReadiness;
  interpretationLimit: string;
  valueContext?: ComparisonValueContext;
}

export interface ComparisonFieldDefinition {
  key: keyof Omit<ComparisonRecord, "comparisonStatus" | "interpretationLimit" | "valueContext">;
  label: string;
  interpretationLimit: string;
}

export interface ComparisonReadinessGate {
  key: ComparisonGateKey;
  label: string;
  status: ComparisonFieldStatus;
  interpretationLimit: string;
}

export const COMPARISON_RECORD_FIELD_DEFINITIONS: readonly ComparisonFieldDefinition[] = [
  { key: "comparisonId", label: "Comparison ID", interpretationLimit: "No comparison identifier is created before an evidence-backed comparison record exists." },
  { key: "simulationReference", label: "Simulation Reference", interpretationLimit: "Simulation reference does not itself validate the model." },
  { key: "measurementReference", label: "Measurement Reference", interpretationLimit: "No measurement reference exists without loaded laboratory evidence." },
  { key: "experimentId", label: "Experiment ID", interpretationLimit: "The UI does not create an experiment or session association." },
  { key: "sampleId", label: "Sample ID", interpretationLimit: "No sample identity is generated or inferred." },
  { key: "instrumentId", label: "Instrument ID", interpretationLimit: "P17 registry channels are not proof of a physical instrument identity." },
  { key: "measurementChannel", label: "Measurement Channel", interpretationLimit: "No measured channel is inferred from a simulation field." },
  { key: "simulationField", label: "Simulation Field", interpretationLimit: "Simulation field provenance remains simulation, not measured data." },
  { key: "measurementField", label: "Measurement Field", interpretationLimit: "No measurement field is available without laboratory data." },
  { key: "unit", label: "Unit", interpretationLimit: "A display unit is not proof of cross-dataset unit compatibility." },
  { key: "timestampAlignment", label: "Timestamp Alignment", interpretationLimit: "Simulation time is not a laboratory measurement timestamp." },
  { key: "sampleAlignment", label: "Sample Alignment", interpretationLimit: "No sample alignment is possible without real sample evidence." },
  { key: "instrumentAlignment", label: "Instrument Alignment", interpretationLimit: "No instrument alignment is possible without physical instrument identity." },
  { key: "calibrationStatus", label: "Calibration Status", interpretationLimit: "No calibration status is inferred from P17 contract fields." },
  { key: "traceabilityStatus", label: "Traceability Status", interpretationLimit: "P18 chain remains evidence-bound and not verified." },
  { key: "uncertaintyStatus", label: "Uncertainty Status", interpretationLimit: "P19 budget remains not available and not loaded." },
  { key: "provenanceStatus", label: "Provenance Status", interpretationLimit: "Simulation provenance does not establish measurement provenance." },
] as const;

export const COMPARISON_READINESS_GATES: readonly ComparisonReadinessGate[] = [
  { key: "SAMPLE_ALIGNMENT", label: "Sample alignment", status: "NOT LOADED", interpretationLimit: "No sample evidence is loaded." },
  { key: "TIMESTAMP_ALIGNMENT", label: "Timestamp alignment", status: "NOT LOADED", interpretationLimit: "No laboratory measurement timestamp is loaded." },
  { key: "UNIT_COMPATIBILITY", label: "Unit compatibility", status: "NOT LOADED", interpretationLimit: "No measured unit is loaded for comparison." },
  { key: "INSTRUMENT_IDENTITY", label: "Instrument identity", status: "NOT LOADED", interpretationLimit: "No physical instrument identity is loaded." },
  { key: "CALIBRATION_STATUS", label: "Calibration status", status: "NOT LOADED", interpretationLimit: "No calibration record is loaded." },
  { key: "TRACEABILITY_STATUS", label: "Traceability status", status: "NOT LOADED", interpretationLimit: "No verified traceability evidence is loaded." },
  { key: "UNCERTAINTY_STATUS", label: "Uncertainty status", status: "NOT LOADED", interpretationLimit: "No quantified measurement uncertainty is loaded." },
  { key: "PROVENANCE_STATUS", label: "Provenance status", status: "NOT LOADED", interpretationLimit: "No measurement provenance is loaded." },
  { key: "MEASUREMENT_STATUS", label: "Measurement status", status: "NOT LOADED", interpretationLimit: "No laboratory measurement is loaded." },
] as const;

export const EXPERIMENTAL_COMPARISON_RECORDS: readonly ComparisonRecord[] = [];

export function getComparisonReadiness(records: readonly ComparisonRecord[]): ComparisonReadiness {
  if (records.length === 0) return "NOT READY";
  if (records.some(isComparisonAvailable)) return "COMPARISON AVAILABLE";
  return "PARTIAL";
}

export function isComparisonAvailable(record: ComparisonRecord) {
  const required: readonly ComparisonContractField[] = [
    record.simulationReference, record.measurementReference, record.sampleId, record.instrumentId,
    record.measurementChannel, record.simulationField, record.measurementField, record.unit,
    record.timestampAlignment, record.sampleAlignment, record.instrumentAlignment, record.calibrationStatus,
    record.traceabilityStatus, record.uncertaintyStatus, record.provenanceStatus,
  ];
  return record.comparisonStatus === "COMPARISON AVAILABLE" && required.every(field => field.status !== "NOT APPLICABLE" && typeof field.value === "string" && field.value.length > 0) && Boolean(record.valueContext?.simulationValue) && Boolean(record.valueContext?.measuredValue);
}

export function getComparisonBlockedReasons(records: readonly ComparisonRecord[]) {
  if (records.length === 0) return ["NO LABORATORY DATA LOADED", "COMPARISON NOT READY", "REQUIRED EVIDENCE MISSING"] as const;
  return COMPARISON_READINESS_GATES.filter(gate => gate.status !== "NOT APPLICABLE").map(gate => gate.label.toUpperCase());
}
