import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, FileSearch, Gauge, Network, Ruler, ShieldQuestion, Waypoints } from "lucide-react";
import {
  getInstrumentRegistryEntry,
  getMetrologicalTraceabilityChain,
  hasVerifiedMetrologicalTraceability,
  INSTRUMENT_REGISTRY,
  type InstrumentContractField,
  type InstrumentRegistryEntry,
  type InstrumentStatus,
  type MetrologicalTraceabilityNode,
  type TraceabilityNodeStatus,
} from "@/lib/instrumentRegistry";
import { Link } from "wouter";

function statusClass(status: InstrumentStatus | TraceabilityNodeStatus) {
  if (status === "SIMULATION") return "border-violet-500/35 bg-violet-500/10 text-violet-200";
  if (status === "DERIVED") return "border-amber-500/35 bg-amber-500/10 text-amber-200";
  if (status === "MEASURED" || status === "VERIFIED") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
  return "border-slate-700 bg-slate-900/70 text-slate-400";
}

function StatusChip({ status }: { status: InstrumentStatus | TraceabilityNodeStatus }) {
  return <span className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[7px] tracking-[0.11em] ${statusClass(status)}`}>{status}</span>;
}

function ContractLine({ label, field }: { label: string; field: InstrumentContractField }) {
  return <div className="border-b border-slate-800/70 py-2 last:border-0"><div className="flex items-center justify-between gap-3"><span className="text-[8px] tracking-[0.13em] text-slate-500">{label}</span><StatusChip status={field.status} /></div><div className="mt-1 text-[9px] leading-relaxed text-slate-400">{field.value ?? field.note}</div>{field.unit ? <div className="mt-1 font-mono text-[8px] text-slate-600">UNIT: {field.unit}</div> : null}</div>;
}

function TraceabilityNodeCard({ node }: { node: MetrologicalTraceabilityNode }) {
  return <div className="min-w-[10rem] flex-1 rounded border border-slate-800 bg-slate-950/90 p-2.5"><div className="flex items-start justify-between gap-2"><span className="text-[8px] font-semibold tracking-[0.13em] text-slate-200">{node.label}</span><StatusChip status={node.status} /></div><div className="mt-2 font-mono text-[8px] text-cyan-200">REF: {node.identifierReference}</div><div className="mt-1 text-[8px] leading-relaxed text-slate-500">SOURCE: {node.source}</div><div className="mt-1 text-[8px] leading-relaxed text-violet-300">PROVENANCE: {node.provenance}</div><div className="mt-2 border-t border-slate-800 pt-2 text-[8px] leading-relaxed text-amber-100">LIMIT: {node.interpretationLimit}</div></div>;
}

function TraceabilityChain({ entry }: { entry: InstrumentRegistryEntry }) {
  const nodes = getMetrologicalTraceabilityChain(entry);
  const verified = hasVerifiedMetrologicalTraceability(nodes);
  return <section className="mt-3 border border-sky-500/20 bg-slate-950/80 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-sky-300"><Network className="h-3.5 w-3.5" />METROLOGICAL TRACEABILITY CHAIN</div><p className="mt-1 text-[9px] leading-relaxed text-slate-500">Readable chain contract for the selected P17 channel. Node status is evidence-bound and does not create a metrological claim.</p></div><span className={`rounded border px-2 py-1 font-mono text-[8px] tracking-[0.1em] ${verified ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>{verified ? "CHAIN VERIFIED" : "CHAIN NOT VERIFIED"}</span></div><div className="mt-3 flex items-stretch gap-1 overflow-x-auto pb-1">{nodes.map((node, index) => <div key={node.kind} className="flex items-stretch gap-1"><TraceabilityNodeCard node={node} />{index < nodes.length - 1 ? <div className="grid place-items-center px-0.5 text-sky-400"><ArrowRight className="h-4 w-4" /></div> : null}</div>)}</div><p className="mt-3 text-[8px] leading-relaxed text-amber-100"><ShieldQuestion className="mr-1 inline h-3 w-3 text-amber-300" />SIMULATION ≠ MEASURED. DERIVED ≠ MEASURED. This chain remains incomplete until evidence-backed physical instrument, certificate, standard, laboratory, measurement-result, and provenance records are legitimately loaded.</p></section>;
}

function RegistryInspector({ entry }: { entry: InstrumentRegistryEntry }) {
  return <section className="border border-cyan-500/20 bg-slate-950/85 p-4 shadow-[0_16px_46px_rgba(8,47,73,0.2)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-cyan-300"><Gauge className="h-3.5 w-3.5" />INSTRUMENT INSPECTOR</div><h3 className="mt-2 text-base font-semibold text-slate-100">{entry.label}</h3><p className="mt-1 text-[10px] leading-relaxed text-slate-500">{entry.processRole}</p></div><StatusChip status={entry.provenance} /></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="border border-slate-800 bg-slate-950/80 p-3"><div className="text-[8px] tracking-[0.16em] text-violet-300">SOURCE & PROVENANCE</div><div className="mt-2 space-y-2 font-mono text-[9px]"><div><span className="text-slate-600">PARAMETER:</span> <span className="text-slate-200">{entry.observedParameter}</span></div><div><span className="text-slate-600">SOURCE:</span> <span className="text-violet-200">{entry.authoritativeSource}</span></div><div><span className="text-slate-600">FRAME FIELD:</span> <span className="text-cyan-200">{entry.frameField}</span></div><div><span className="text-slate-600">3D CONTEXT:</span> <span className="text-slate-400">{entry.componentIds.join(" · ")}</span></div></div></div><div className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-amber-300"><BadgeCheck className="h-3.5 w-3.5" />CALIBRATION STATUS</div><div className="mt-2"><StatusChip status={entry.calibrationStatus} /></div><p className="mt-2 text-[9px] leading-relaxed text-slate-500">This registry reserves calibration metadata for future real instruments. It does not assert calibration, certificate validity, or ISO/IEC 17025 compliance.</p></div></div><div className="mt-3 grid gap-3 xl:grid-cols-2"><section className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-cyan-300"><Ruler className="h-3.5 w-3.5" />MEASUREMENT CONTRACT</div><div className="mt-2"><ContractLine label="CALIBRATION CERTIFICATE REFERENCE" field={entry.calibrationCertificateReference} /><ContractLine label="MEASUREMENT RANGE" field={entry.measurementRange} /><ContractLine label="RESOLUTION" field={entry.resolution} /><ContractLine label="MEASUREMENT UNCERTAINTY" field={entry.measurementUncertainty} /></div></section><section className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[8px] tracking-[0.16em] text-sky-300"><Network className="h-3.5 w-3.5" />TRACEABILITY & EVIDENCE</div><div className="mt-2"><ContractLine label="TRACEABILITY CHAIN" field={entry.traceability} /><ContractLine label="MEASUREMENT EVIDENCE REFERENCE" field={entry.evidenceReference} /></div><div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[8px] leading-relaxed text-amber-100"><ShieldQuestion className="mr-1 inline h-3 w-3 text-amber-300" />No real measurement, certificate, calibration date, range, resolution, traceability chain, or uncertainty value is loaded in this UI.</div></section></div><TraceabilityChain entry={entry} /></section>;
}

export function InstrumentRegistry({ selectedInstrumentId }: { selectedInstrumentId?: string }) {
  const [activeId, setActiveId] = useState(selectedInstrumentId ?? INSTRUMENT_REGISTRY[0]?.id ?? "");
  useEffect(() => {
    if (selectedInstrumentId && getInstrumentRegistryEntry(selectedInstrumentId)) setActiveId(selectedInstrumentId);
  }, [selectedInstrumentId]);
  const active = getInstrumentRegistryEntry(activeId) ?? INSTRUMENT_REGISTRY[0];
  if (!active) return null;
  return <section id="instrument-registry" className="scroll-mt-5 border border-cyan-500/25 bg-slate-950/70 p-4 shadow-[0_0_50px_rgba(14,116,144,0.1)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-[9px] tracking-[0.22em] text-cyan-300"><Waypoints className="h-3.5 w-3.5" />INSTRUMENT & CALIBRATION FOUNDATION</div><h2 className="mt-1 text-lg font-semibold text-slate-100">INSTRUMENT REGISTRY</h2><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-slate-500">A UI and data-contract foundation for future real-instrument metadata. Current Control Room values retain their declared CausalFrame provenance; laboratory metadata is explicitly unloaded.</p></div><Link href="/knowledge"><span className="inline-flex cursor-pointer items-center gap-1 border border-cyan-500/30 px-2 py-1.5 font-mono text-[8px] tracking-[0.12em] text-cyan-200 hover:bg-cyan-500/10"><FileSearch className="h-3 w-3" />KNOWLEDGE CENTER</span></Link></div><div className="mt-4 grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)]"><div className="border border-slate-800 bg-slate-950/80 p-2"><div className="px-2 py-1 text-[8px] tracking-[0.16em] text-slate-500">REGISTERED CONTRACT CHANNELS</div><div className="mt-1 space-y-1">{INSTRUMENT_REGISTRY.map(entry => <button key={entry.id} onClick={() => setActiveId(entry.id)} className={`w-full rounded border p-2 text-left transition ${activeId === entry.id ? "border-cyan-400/45 bg-cyan-500/10" : "border-transparent hover:border-slate-700 hover:bg-slate-900/70"}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-[8px] text-cyan-200">{entry.id}</span><StatusChip status={entry.provenance} /></div><div className="mt-1 text-[10px] text-slate-200">{entry.label}</div><div className="mt-1 text-[8px] text-slate-600">{entry.frameField}</div></button>)}</div></div><RegistryInspector entry={active} /></div></section>;
}
