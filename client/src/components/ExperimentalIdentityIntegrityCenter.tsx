import { ArrowRight, BadgeCheck, FileKey2, Fingerprint, GitBranch, Link2, Network, ShieldQuestion } from "lucide-react";
import { Link } from "wouter";
import {
  CANONICAL_HASH_MECHANISM,
  EMPTY_EVIDENCE_INTEGRITY,
  EMPTY_EXPERIMENTAL_IDENTITY,
  getEvidenceIntegrityReadiness,
  getExperimentalIdentityReadiness,
  getP20IdentityIntegrationStatus,
  getP21IdentityIntegrationBlocker,
  type EvidenceIntegrityStatus,
  type IdentityContractField,
  type IdentityLinkStatus,
  type IdentityReadiness,
} from "@/lib/experimentalIdentityIntegrity";

type DisplayStatus = IdentityLinkStatus | EvidenceIntegrityStatus | IdentityReadiness;

function statusClass(status: DisplayStatus) {
  if (status === "LINKED" || status === "VERIFIED") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
  if (status === "UNVERIFIED" || status === "PARTIAL" || status === "READY FOR VERIFICATION") return "border-amber-500/35 bg-amber-500/10 text-amber-200";
  return "border-slate-700 bg-slate-900/70 text-slate-400";
}

function StatusChip({ status }: { status: DisplayStatus }) {
  return <span className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[7px] tracking-[0.11em] ${statusClass(status)}`}>{status}</span>;
}

function IdentityFieldCard({ label, field }: { label: string; field: IdentityContractField }) {
  return <article className="border border-slate-800 bg-slate-950/90 p-2"><div className="flex items-start justify-between gap-2"><span className="text-[8px] font-semibold tracking-[0.1em] text-slate-200">{label}</span><StatusChip status={field.status} /></div><p className="mt-1 font-mono text-[8px] text-cyan-200">ID: {field.value ?? "NOT LOADED"}</p><p className="mt-1 text-[8px] leading-relaxed text-slate-500">SOURCE: {field.source}</p><p className="mt-1 text-[8px] leading-relaxed text-violet-300">PROVENANCE: {field.provenance}</p><p className="mt-2 border-t border-slate-800 pt-2 text-[8px] leading-relaxed text-amber-100">LIMIT: {field.interpretationLimit}</p></article>;
}

const identityGraph = [
  ["EXPERIMENT", "SAMPLE", "SIMULATION RUN"],
  ["MEASUREMENT", "INSTRUMENT", "CALIBRATION", "TRACEABILITY"],
  ["DATASET", "EVIDENCE", "HASH", "PROVENANCE", "INTEGRITY"],
] as const;

export function ExperimentalIdentityIntegrityCenter() {
  const identity = EMPTY_EXPERIMENTAL_IDENTITY;
  const integrity = EMPTY_EVIDENCE_INTEGRITY;
  const identityReadiness = getExperimentalIdentityReadiness(identity);
  const integrityReadiness = getEvidenceIntegrityReadiness(integrity);
  const p20Status = getP20IdentityIntegrationStatus();
  const p21Blocker = getP21IdentityIntegrationBlocker();
  const identityFields = [["EXPERIMENT", identity.experimentId], ["SAMPLE", identity.sampleId], ["SIMULATION RUN", identity.simulationRunId], ["MEASUREMENT", identity.measurementId], ["INSTRUMENT", identity.instrumentId], ["CALIBRATION", identity.calibrationId], ["DATASET", identity.datasetId], ["EVIDENCE", identity.evidenceId], ["PROVENANCE", identity.provenanceId], ["TIMESTAMP", identity.timestamp], ["SOURCE TYPE", identity.sourceType]] as const;
  const integrityFields = [["EVIDENCE ID", integrity.evidenceId], ["DATASET ID", integrity.datasetId], ["EXPERIMENT ID", integrity.experimentId], ["SOURCE REFERENCE", integrity.sourceReference], ["CONTENT HASH", integrity.contentHash], ["HASH ALGORITHM", integrity.hashAlgorithm], ["CREATED AT", integrity.createdAt], ["SOURCE TYPE", integrity.sourceType], ["PROVENANCE", integrity.provenance]] as const;
  return <section id="experimental-identity-integrity" className="border border-indigo-500/25 bg-slate-950/70 p-4 shadow-[0_0_50px_rgba(99,102,241,0.08)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-[9px] tracking-[0.22em] text-indigo-300"><Fingerprint className="h-3.5 w-3.5" />EXPERIMENTAL IDENTITY & EVIDENCE INTEGRITY FOUNDATION</div><h2 className="mt-1 text-lg font-semibold text-slate-100">IDENTITY & INTEGRITY CENTER</h2><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-slate-500">A source-safe contract for future auditability. It reuses the repository vocabulary for experiment, sample, instrument, calibration, dataset, provenance, and SHA-256 references without creating any record, identifier, evidence, hash, or verification result.</p></div><div className="flex gap-1.5"><StatusChip status={identityReadiness} /><StatusChip status={integrityReadiness} /></div></div><div className="mt-3 flex flex-wrap gap-1.5 text-[8px]"><a href="#instrument-registry" className="border border-cyan-500/30 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10">P17 INSTRUMENT REGISTRY</a><a href="#metrological-traceability" className="border border-sky-500/30 px-2 py-1 text-sky-200 hover:bg-sky-500/10">P18 TRACEABILITY</a><a href="#uncertainty-budget" className="border border-violet-500/30 px-2 py-1 text-violet-200 hover:bg-violet-500/10">P19 UNCERTAINTY</a><a href="#laboratory-evidence-center" className="border border-emerald-500/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10">P20 EVIDENCE</a><a href="#experimental-comparison-center" className="border border-fuchsia-500/30 px-2 py-1 text-fuchsia-200 hover:bg-fuchsia-500/10">P21 COMPARISON</a><Link href="/knowledge"><span className="inline-flex cursor-pointer border border-indigo-500/30 px-2 py-1 text-indigo-200 hover:bg-indigo-500/10">KNOWLEDGE CENTER</span></Link></div><section className="mt-4 border border-indigo-500/20 bg-slate-950/85 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-indigo-300"><Network className="h-3.5 w-3.5" />IDENTITY LINK GRAPH</div><p className="mt-1 text-[9px] text-slate-500">Each relationship remains NOT LOADED until a canonical record is legitimately available.</p></div><StatusChip status="NOT LOADED" /></div><div className="mt-3 grid gap-2 lg:grid-cols-3">{identityGraph.map((branch, branchIndex) => <div key={branchIndex} className="border border-slate-800 bg-slate-950/90 p-2">{branch.map((node, index) => <div key={node} className="flex items-center gap-2"><span className="rounded border border-slate-700 bg-slate-900/70 px-2 py-1 font-mono text-[8px] text-slate-300">{node} / NOT LOADED</span>{index < branch.length - 1 ? <ArrowRight className="h-3 w-3 text-indigo-400" /> : null}</div>)}</div>)}</div></section><div className="mt-3 grid gap-3 xl:grid-cols-[1fr_.9fr]"><section className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-cyan-300"><GitBranch className="h-3.5 w-3.5" />EXPERIMENTAL IDENTITY INSPECTOR</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{identityFields.map(([label, field]) => <IdentityFieldCard key={label} label={label} field={field} />)}</div><div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[8px] leading-relaxed text-amber-100"><ShieldQuestion className="mr-1 inline h-3 w-3 text-amber-300" />IDENTITY READINESS: {identityReadiness}. An empty identity is not linked, not verified, and not a reason to create a new experiment/session.</div></section><section className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-indigo-300"><FileKey2 className="h-3.5 w-3.5" />EVIDENCE INTEGRITY INSPECTOR</div><div className="mt-3 grid gap-2">{integrityFields.map(([label, field]) => <IdentityFieldCard key={label} label={label} field={field} />)}</div><div className="mt-3 rounded border border-slate-800 bg-slate-950/90 p-3"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-slate-200">NO EVIDENCE LOADED</span><StatusChip status="NOT LOADED" /></div><p className="mt-2 text-[8px] leading-relaxed text-slate-500">INTEGRITY: NOT AVAILABLE. Existing SHA-256 mechanisms are referenced only for future authorized server-side reuse; P22 does not calculate, display, or verify a hash for absent content.</p><p className="mt-2 text-[8px] leading-relaxed text-amber-100">HASH CONTRACT: {CANONICAL_HASH_MECHANISM.algorithm} / {CANONICAL_HASH_MECHANISM.status}. {CANONICAL_HASH_MECHANISM.interpretationLimit}</p></div></section></div><section className="mt-3 grid gap-3 lg:grid-cols-2"><article className="border border-emerald-500/20 bg-emerald-500/[0.035] p-3"><div className="flex items-center justify-between gap-2"><span className="text-[8px] tracking-[0.16em] text-emerald-300">P20 EVIDENCE INTEGRATION</span><StatusChip status={p20Status} /></div><p className="mt-2 text-[9px] leading-relaxed text-slate-400">Evidence identity, dataset identity, experiment identity, integrity status, and provenance remain NOT LOADED because P20 has zero evidence records. No evidence record is added.</p></article><article className="border border-fuchsia-500/20 bg-fuchsia-500/[0.035] p-3"><div className="flex items-center justify-between gap-2"><span className="text-[8px] tracking-[0.16em] text-fuchsia-300">P21 COMPARISON INTEGRATION</span><StatusChip status="NOT LOADED" /></div><p className="mt-2 text-[9px] leading-relaxed text-slate-400">COMPARISON BLOCKED: {p21Blocker}. P22 supplies no difference, accuracy, confidence, or validation output.</p></article></section><div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[8px] leading-relaxed text-amber-100"><ShieldQuestion className="mr-1 inline h-3 w-3 text-amber-300" />SIMULATION ≠ MEASURED. DERIVED ≠ MEASURED. UNKNOWN remains UNKNOWN. NOT LOADED is not zero. READY FOR VERIFICATION ≠ VERIFIED. COMPARISON ≠ VALIDATION.</div></section>;
}
