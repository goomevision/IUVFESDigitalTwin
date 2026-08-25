export type AuditReferenceStatus = "NOT LOADED" | "UNKNOWN" | "NOT APPLICABLE";
export type AuditIntegrityStatus = "NOT LOADED" | "UNKNOWN" | "UNVERIFIED" | "VERIFIED" | "INTEGRITY FAILED";
export type ReproducibilityReadiness = "NOT READY" | "PARTIAL" | "READY FOR REPLAY" | "REPRODUCIBLE";
export type ReproducibilityMatrixStatus = "AVAILABLE" | "PARTIAL" | "NOT LOADED" | "UNKNOWN" | "VERIFIED";
export type ScientificAuditEventType = "EXPERIMENT_OPEN" | "CONFIGURATION_REFERENCE" | "SIMULATION_START" | "SIMULATION_PAUSE" | "SIMULATION_RESUME" | "SIMULATION_STOP" | "OPERATOR_ACTION" | "FRAME_REFERENCE" | "INSTRUMENT_REFERENCE" | "EVIDENCE_REFERENCE" | "DATASET_REFERENCE" | "COMPARISON_REFERENCE" | "INTEGRITY_CHECK" | "REPLAY_OPEN";

export interface AuditContractField {
  status: AuditReferenceStatus;
  value?: string;
  source: string;
  provenance: "SIMULATION" | "DERIVED" | "MEASURED" | "UNKNOWN" | "NOT LOADED";
  interpretationLimit: string;
}

export interface ScientificAuditEvent {
  auditEventId: AuditContractField;
  experimentId: AuditContractField;
  sessionId: AuditContractField;
  eventType: ScientificAuditEventType;
  timestampSeconds: AuditContractField;
  sourceType: AuditContractField;
  sourceReference: AuditContractField;
  actorReference: AuditContractField;
  objectReference: AuditContractField;
  previousEventHash: AuditContractField;
  eventHash: AuditContractField;
  provenance: AuditContractField;
  integrityStatus: AuditIntegrityStatus;
  interpretationLimit: string;
}

export interface ScientificReplayReference {
  experimentId: AuditContractField;
  sessionId: AuditContractField;
  simulationReference: AuditContractField;
  frameReference: AuditContractField;
  eventReference: AuditContractField;
  datasetReference: AuditContractField;
  evidenceReference: AuditContractField;
  provenanceReference: AuditContractField;
  integrityStatus: AuditIntegrityStatus;
  replayReadiness: ReproducibilityReadiness;
}

export interface ReproducibilityMatrixItem {
  key: "IDENTITY" | "CONFIGURATION" | "MATERIAL" | "INSTRUMENT" | "CALIBRATION" | "TRACEABILITY" | "UNCERTAINTY" | "SIMULATION" | "FRAME_HISTORY" | "OPERATOR_ACTION" | "LABORATORY_DATA" | "DATASET" | "PROVENANCE" | "COMPARISON" | "INTEGRITY";
  label: string;
  status: ReproducibilityMatrixStatus;
  source: string;
  provenance: "SIMULATION" | "DERIVED" | "MEASURED" | "UNKNOWN" | "NOT LOADED";
  reference: string;
  interpretationLimit: string;
}

export interface AuditTrailReuseReference {
  source: string;
  role: string;
  interpretationLimit: string;
}

export const AUDIT_TRAIL_REUSE_REFERENCES: readonly AuditTrailReuseReference[] = [
  { source: "server/scientificEventJournal.ts", role: "Canonical server-side event hash chain and CausalFrame-derived journal persistence.", interpretationLimit: "P23 does not append an event or invoke persistence." },
  { source: "client/src/lib/controlRoomObservability.ts", role: "Client-side operator, lifecycle, component, frame, and replay observability vocabulary.", interpretationLimit: "Browser observability is local and is not a scientific evidence chain by itself." },
  { source: "server/closedLoopRuntimeStore.ts", role: "Canonical session identity, persisted recovery, snapshot, and frame-history accessors.", interpretationLimit: "P23 does not create, hydrate, change, or replay a session." },
  { source: "client/src/components/ProcessRunReplay.tsx", role: "Existing visual replay reader over supplied CausalFrame history.", interpretationLimit: "Visual replay is not scientific reproducibility or a new timeline." },
  { source: "client/src/lib/experimentalIdentityIntegrity.ts", role: "P22 canonical identity, provenance, and SHA-256 reference abstraction.", interpretationLimit: "P23 does not calculate a hash or verify absent evidence." },
] as const;

const notLoaded = (source: string, limit: string): AuditContractField => ({ status: "NOT LOADED", source, provenance: "NOT LOADED", interpretationLimit: limit });

export const EMPTY_SCIENTIFIC_AUDIT_EVENTS: readonly ScientificAuditEvent[] = [];

export const EMPTY_SCIENTIFIC_REPLAY_REFERENCE: ScientificReplayReference = {
  experimentId: notLoaded("Canonical experiment identity source not loaded", "No experiment is selected or created by this UI."),
  sessionId: notLoaded("Canonical closed-loop session source not loaded", "No session is selected, created, or hydrated by this UI."),
  simulationReference: notLoaded("Closed-loop runtime/replay source not loaded", "No simulation run is created or selected."),
  frameReference: notLoaded("CausalFrame history source not loaded", "No frame is created, modified, or inferred."),
  eventReference: notLoaded("Scientific event journal source not loaded", "No audit event is appended or synthesized."),
  datasetReference: notLoaded("Dataset manifest source not loaded", "No dataset is created or loaded."),
  evidenceReference: notLoaded("P20 Laboratory Evidence Center", "NO EVIDENCE LOADED."),
  provenanceReference: notLoaded("Provenance record source not loaded", "No provenance record is created."),
  integrityStatus: "NOT LOADED",
  replayReadiness: "NOT READY",
};

export const REPRODUCIBILITY_MATRIX: readonly ReproducibilityMatrixItem[] = [
  { key: "IDENTITY", label: "Identity", status: "NOT LOADED", source: "P22 Experimental Identity", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No selected canonical experiment/sample/session identity." },
  { key: "CONFIGURATION", label: "Configuration", status: "NOT LOADED", source: "Closed-loop session configuration", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No selected session configuration is loaded." },
  { key: "MATERIAL", label: "Material", status: "NOT LOADED", source: "Experiment material context", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No material/sample record is loaded." },
  { key: "INSTRUMENT", label: "Instrument", status: "PARTIAL", source: "P17 Instrument Registry", provenance: "SIMULATION", reference: "Simulation channel contracts", interpretationLimit: "Registry channel contracts are not physical instrument identity." },
  { key: "CALIBRATION", label: "Calibration", status: "NOT LOADED", source: "P18 Traceability", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No calibration record is loaded." },
  { key: "TRACEABILITY", label: "Traceability", status: "NOT LOADED", source: "P18 Traceability", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No verified traceability chain is loaded." },
  { key: "UNCERTAINTY", label: "Uncertainty", status: "NOT LOADED", source: "P19 Uncertainty Budget", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No quantified uncertainty is loaded." },
  { key: "SIMULATION", label: "Simulation", status: "PARTIAL", source: "ClosedLoopSimulationEngine / CausalFrame", provenance: "SIMULATION", reference: "Canonical engine contract", interpretationLimit: "A simulation source exists, but no selected run is loaded into P23." },
  { key: "FRAME_HISTORY", label: "Frame History", status: "NOT LOADED", source: "Closed-loop runtime/replay", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No frame history is loaded or synthesized." },
  { key: "OPERATOR_ACTION", label: "Operator Action", status: "NOT LOADED", source: "Control Room observability", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No browser event is promoted to scientific evidence." },
  { key: "LABORATORY_DATA", label: "Laboratory Data", status: "NOT LOADED", source: "P20 Laboratory Evidence", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "NO EVIDENCE LOADED." },
  { key: "DATASET", label: "Dataset", status: "NOT LOADED", source: "Dataset Manifest", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No dataset manifest is loaded." },
  { key: "PROVENANCE", label: "Provenance", status: "NOT LOADED", source: "Provenance Records", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No provenance record is loaded." },
  { key: "COMPARISON", label: "Comparison", status: "NOT LOADED", source: "P21 Comparison Center", provenance: "NOT LOADED", reference: "COMPARISON BLOCKED", interpretationLimit: "No evidence-backed comparison record is loaded." },
  { key: "INTEGRITY", label: "Integrity", status: "NOT LOADED", source: "P22 Evidence Integrity", provenance: "NOT LOADED", reference: "NOT LOADED", interpretationLimit: "No evidence hash or verification result is loaded." },
] as const;

export function getReproducibilityReadiness(reference: ScientificReplayReference = EMPTY_SCIENTIFIC_REPLAY_REFERENCE, matrix: readonly ReproducibilityMatrixItem[] = REPRODUCIBILITY_MATRIX): ReproducibilityReadiness {
  if (reference.replayReadiness === "REPRODUCIBLE") return "REPRODUCIBLE";
  const available = matrix.filter(item => item.status === "AVAILABLE" || item.status === "PARTIAL" || item.status === "VERIFIED").length;
  if (available === 0) return "NOT READY";
  return "PARTIAL";
}

export function getReconstructionBlockedReasons(reference: ScientificReplayReference = EMPTY_SCIENTIFIC_REPLAY_REFERENCE) {
  if (reference.replayReadiness === "REPRODUCIBLE") return [] as const;
  return ["LABORATORY DATA NOT LOADED", "EVIDENCE NOT VERIFIED", "DATASET REFERENCE MISSING", "FRAME HISTORY INCOMPLETE", "PROVENANCE INCOMPLETE", "INTEGRITY NOT VERIFIED"] as const;
}

export function isAuditTrailReconstructable(reference: ScientificReplayReference = EMPTY_SCIENTIFIC_REPLAY_REFERENCE) {
  return getReproducibilityReadiness(reference) === "REPRODUCIBLE";
}
