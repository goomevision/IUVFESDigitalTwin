import { EXPERIMENTAL_COMPARISON_RECORDS } from "@/lib/experimentalComparison";
import { LABORATORY_EVIDENCE_RECORDS } from "@/lib/laboratoryEvidence";

export type IdentityLinkStatus = "LINKED" | "NOT LINKED" | "NOT LOADED" | "UNKNOWN";
export type EvidenceIntegrityStatus = "NOT LOADED" | "UNKNOWN" | "UNVERIFIED" | "VERIFIED" | "INTEGRITY FAILED";
export type IdentityReadiness = "NOT READY" | "PARTIAL" | "READY FOR VERIFICATION" | "VERIFIED";

export interface IdentityContractField {
  status: IdentityLinkStatus;
  value?: string;
  source: string;
  provenance: "SIMULATION" | "DERIVED" | "MEASURED" | "UNKNOWN" | "NOT LOADED";
  interpretationLimit: string;
}

export interface ExperimentalIdentity {
  experimentId: IdentityContractField;
  sampleId: IdentityContractField;
  simulationRunId: IdentityContractField;
  measurementId: IdentityContractField;
  instrumentId: IdentityContractField;
  calibrationId: IdentityContractField;
  datasetId: IdentityContractField;
  evidenceId: IdentityContractField;
  provenanceId: IdentityContractField;
  timestamp: IdentityContractField;
  sourceType: IdentityContractField;
  integrityStatus: EvidenceIntegrityStatus;
  interpretationLimit: string;
}

export interface EvidenceIntegrityRecord {
  evidenceId: IdentityContractField;
  datasetId: IdentityContractField;
  experimentId: IdentityContractField;
  sourceReference: IdentityContractField;
  contentHash: IdentityContractField;
  hashAlgorithm: IdentityContractField;
  createdAt: IdentityContractField;
  sourceType: IdentityContractField;
  provenance: IdentityContractField;
  integrityStatus: EvidenceIntegrityStatus;
  verificationStatus: EvidenceIntegrityStatus;
  interpretationLimit: string;
}

export interface EvidenceHashProvider {
  readonly algorithm: "SHA-256";
  calculateHash(content: string): Promise<string>;
  verifyHash(content: string, expectedHash: string): Promise<boolean>;
}

export interface HashMechanismReference {
  status: "AVAILABLE FOR FUTURE SERVER-SIDE REUSE";
  algorithm: "SHA-256";
  references: readonly string[];
  interpretationLimit: string;
}

export const CANONICAL_HASH_MECHANISM: HashMechanismReference = {
  status: "AVAILABLE FOR FUTURE SERVER-SIDE REUSE",
  algorithm: "SHA-256",
  references: ["server/scientificDataset.ts#sha256Utf8", "server/scientificEventJournal.ts#hashEvent", "server/scientificDatasetPersistence.ts#persistSimulationDataset"],
  interpretationLimit: "This contract references existing server-side SHA-256 mechanisms. P22 does not calculate or verify a hash because no laboratory evidence content is loaded.",
};

const notLoaded = (source: string, limit: string): IdentityContractField => ({ status: "NOT LOADED", source, provenance: "NOT LOADED", interpretationLimit: limit });

export const EMPTY_EXPERIMENTAL_IDENTITY: ExperimentalIdentity = {
  experimentId: notLoaded("Canonical experiment identity source not loaded", "No experiment is created or selected by this UI."),
  sampleId: notLoaded("P20 Laboratory Evidence Center", "No sample identifier is fabricated or inferred."),
  simulationRunId: notLoaded("Closed-loop session / persisted dataset source not loaded", "No simulation run is created or selected by this UI."),
  measurementId: notLoaded("P20 Laboratory Evidence Center", "No laboratory measurement identifier is available."),
  instrumentId: notLoaded("P17 Instrument Registry", "A simulation channel identifier is not a physical instrument identity."),
  calibrationId: notLoaded("P18 Traceability Chain", "No calibration identifier or certificate record is loaded."),
  datasetId: notLoaded("Dataset manifest source not loaded", "No dataset identifier is created by this UI."),
  evidenceId: notLoaded("P20 Laboratory Evidence Center", "No evidence identifier is available without a real evidence record."),
  provenanceId: notLoaded("Provenance record source not loaded", "No provenance identifier is generated for an empty state."),
  timestamp: notLoaded("Measurement and dataset timestamp source not loaded", "CausalFrame timestampSeconds is simulation time, not a laboratory evidence timestamp."),
  sourceType: notLoaded("Source classification not loaded", "No source type is inferred from missing evidence."),
  integrityStatus: "NOT LOADED",
  interpretationLimit: "This is an identity contract only. It does not create experiment, sample, simulation run, measurement, dataset, evidence, provenance, or integrity records.",
};

export const EMPTY_EVIDENCE_INTEGRITY: EvidenceIntegrityRecord = {
  evidenceId: notLoaded("P20 Laboratory Evidence Center", "No evidence record is loaded."),
  datasetId: notLoaded("Dataset manifest source not loaded", "No dataset is loaded."),
  experimentId: notLoaded("Canonical experiment identity source not loaded", "No experiment is selected or created."),
  sourceReference: notLoaded("Evidence source not loaded", "No external source reference is inferred."),
  contentHash: notLoaded("Canonical SHA-256 mechanism is not invoked", "No hash is fabricated for absent content."),
  hashAlgorithm: notLoaded("Canonical SHA-256 mechanism reference", "The algorithm is not recorded for an absent evidence payload."),
  createdAt: notLoaded("Evidence receipt timestamp source not loaded", "No timestamp is generated for absent evidence."),
  sourceType: notLoaded("Evidence source type not loaded", "No source type is inferred."),
  provenance: notLoaded("Provenance record source not loaded", "No provenance record is created."),
  integrityStatus: "NOT LOADED",
  verificationStatus: "NOT LOADED",
  interpretationLimit: "NO EVIDENCE LOADED. Integrity is not available and verification cannot occur without real evidence content and an authorized server-side verification workflow.",
};

const identityFields = (identity: ExperimentalIdentity) => [identity.experimentId, identity.sampleId, identity.simulationRunId, identity.measurementId, identity.instrumentId, identity.calibrationId, identity.datasetId, identity.evidenceId, identity.provenanceId, identity.timestamp, identity.sourceType];
const integrityFields = (record: EvidenceIntegrityRecord) => [record.evidenceId, record.datasetId, record.experimentId, record.sourceReference, record.contentHash, record.hashAlgorithm, record.createdAt, record.sourceType, record.provenance];
const isLinked = (field: IdentityContractField) => field.status === "LINKED" && typeof field.value === "string" && field.value.length > 0;

export function getExperimentalIdentityReadiness(identity: ExperimentalIdentity = EMPTY_EXPERIMENTAL_IDENTITY): IdentityReadiness {
  if (!identityFields(identity).some(field => field.status === "LINKED" || field.status === "NOT LINKED")) return "NOT READY";
  if (!identityFields(identity).every(isLinked)) return "PARTIAL";
  return identity.integrityStatus === "VERIFIED" ? "VERIFIED" : "READY FOR VERIFICATION";
}

export function getEvidenceIntegrityReadiness(record: EvidenceIntegrityRecord = EMPTY_EVIDENCE_INTEGRITY): IdentityReadiness {
  if (!integrityFields(record).some(field => field.status === "LINKED" || field.status === "NOT LINKED")) return "NOT READY";
  if (!integrityFields(record).every(isLinked)) return "PARTIAL";
  return record.integrityStatus === "VERIFIED" && record.verificationStatus === "VERIFIED" ? "VERIFIED" : "READY FOR VERIFICATION";
}

export function isEvidenceIntegrityVerified(record: EvidenceIntegrityRecord = EMPTY_EVIDENCE_INTEGRITY) {
  return getEvidenceIntegrityReadiness(record) === "VERIFIED";
}

export function getP20IdentityIntegrationStatus() {
  return LABORATORY_EVIDENCE_RECORDS.length === 0 ? "NOT LOADED" as const : "LINKED" as const;
}

export function getP21IdentityIntegrationBlocker() {
  if (EXPERIMENTAL_COMPARISON_RECORDS.length === 0) return "IDENTITY INCOMPLETE" as const;
  return isEvidenceIntegrityVerified() ? "NONE" as const : "EVIDENCE INTEGRITY NOT VERIFIED" as const;
}
