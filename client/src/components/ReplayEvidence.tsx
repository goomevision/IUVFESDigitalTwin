import { useMemo, useState } from "react";
import { Check, Clipboard, Download, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScientificReport } from "@/components/ScientificReport";

export type ReplayEvidenceFrame = {
  step: number;
  timestampSeconds: number;
  sensorBefore?: Record<string, unknown>;
  controller?: Record<string, unknown>;
  controlOutput?: Record<string, unknown>;
  intendedCommands?: Record<string, unknown>;
  effectiveCommands?: Record<string, unknown>;
  physicalSensorAfter?: Record<string, unknown>;
  sensorAfter?: Record<string, unknown>;
  materialInventory?: unknown;
  safety?: Record<string, unknown>;
  paused?: boolean;
  ultrasonic?: Record<string, unknown>;
  hardwareDiagnostics?: Record<string, unknown>;
};

type EvidencePackage = {
  schemaVersion: "IUVFES-REPLAY-EVIDENCE-1";
  evidenceType: "SIMULATION_REPLAY";
  generatedAt: string;
  source: { experimentId: string; sessionId: string | null; frameStart: number; frameEnd: number; frameCount: number; timestampStartSeconds: number; timestampEndSeconds: number; };
  provenance: { origin: "DIGITAL_TWIN_SIMULATION"; laboratoryObservation: false; validationStatus: "NOT_LAB_VALIDATED"; integrityAlgorithm: "SHA-256"; };
  frames: ReplayEvidenceFrame[];
  integrity: { canonicalPayloadSha256: string; };
  scientificBoundary: string;
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  return value;
}
async function sha256(text: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, "0")).join(""); }
function canonicalPayload(pkg: Omit<EvidencePackage, "integrity">) { return JSON.stringify(stable(pkg)); }

export function ReplayEvidence({ experimentId, sessionId, frames, selectedIndex, onSelectIndex }: { experimentId: string; sessionId: string | null; frames: ReadonlyArray<ReplayEvidenceFrame>; selectedIndex: number; onSelectIndex?: (index: number) => void; }) {
  const [start, setStart] = useState(Math.max(0, selectedIndex));
  const [end, setEnd] = useState(Math.max(0, selectedIndex));
  const [evidence, setEvidence] = useState<EvidencePackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const safeSelected = frames.length ? Math.min(Math.max(0, selectedIndex), frames.length - 1) : 0;
  const range = useMemo(() => { if (!frames.length) return []; const lo = Math.min(start, end, frames.length - 1); const hi = Math.max(start, end, 0); return frames.slice(lo, Math.min(hi, frames.length - 1) + 1); }, [frames, start, end]);

  const capture = async (selectedOnly: boolean) => {
    if (!frames.length) return;
    setBusy(true);
    try {
      const selected = selectedOnly ? [frames[safeSelected]] : range;
      const first = selected[0], last = selected[selected.length - 1];
      const source = { experimentId, sessionId, frameStart: first.step, frameEnd: last.step, frameCount: selected.length, timestampStartSeconds: first.timestampSeconds, timestampEndSeconds: last.timestampSeconds };
      const base = {
        schemaVersion: "IUVFES-REPLAY-EVIDENCE-1" as const,
        evidenceType: "SIMULATION_REPLAY" as const,
        generatedAt: new Date().toISOString(), source,
        provenance: { origin: "DIGITAL_TWIN_SIMULATION" as const, laboratoryObservation: false as const, validationStatus: "NOT_LAB_VALIDATED" as const, integrityAlgorithm: "SHA-256" as const },
        frames: selected.map(frame => JSON.parse(JSON.stringify(frame)) as ReplayEvidenceFrame),
        scientificBoundary: "This package contains simulation-derived evidence from the IUVFES Digital Twin. It is not laboratory observation or validated experimental truth. Calibration and validation against measured laboratory data are required before scientific or engineering claims.",
      };
      const checksum = await sha256(canonicalPayload(base));
      setEvidence({ ...base, integrity: { canonicalPayloadSha256: checksum } });
    } finally { setBusy(false); }
  };
  const json = evidence ? JSON.stringify(evidence, null, 2) : "";
  const download = () => { if (!json) return; const blob = new Blob([json], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `iuvfes-replay-evidence-${evidence?.source.frameStart}-${evidence?.source.frameEnd}.json`; anchor.click(); URL.revokeObjectURL(url); };
  const copy = async () => { if (!json) return; await navigator.clipboard.writeText(json); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };

  return <div className="space-y-4">
    <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/75 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="text-[9px] tracking-[0.25em] text-slate-500">REPLAY → EVIDENCE</div><h3 className="font-semibold tracking-wider text-emerald-300">SCIENTIFIC EVIDENCE CAPTURE</h3></div><div className="font-mono text-[9px] text-slate-600">SCHEMA IUVFES-REPLAY-EVIDENCE-1</div></div>
      {!frames.length ? <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center font-mono text-xs text-slate-600">WAITING FOR REPLAY FRAMES</div> : <>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[8px] tracking-[0.2em] text-slate-600">SELECTED FRAME</div><div className="mt-1 font-mono text-sm text-cyan-300">#{frames[safeSelected].step}</div><Button className="mt-2 w-full" size="sm" variant="outline" disabled={busy} onClick={() => void capture(true)}><FileCheck2 className="mr-1 h-3.5 w-3.5"/>CAPTURE FRAME</Button></div>
          <label className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[8px] tracking-[0.2em] text-slate-600">RANGE START</div><input type="number" min={0} max={frames.length - 1} value={start} onChange={e => setStart(Number(e.target.value))} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs"/><div className="mt-1 text-[8px] text-slate-600">array index · frame #{frames[start]?.step ?? "—"}</div></label>
          <label className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[8px] tracking-[0.2em] text-slate-600">RANGE END</div><input type="number" min={0} max={frames.length - 1} value={end} onChange={e => setEnd(Number(e.target.value))} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs"/><Button className="mt-2 w-full" size="sm" variant="outline" disabled={busy} onClick={() => void capture(false)}><FileCheck2 className="mr-1 h-3.5 w-3.5"/>CAPTURE RANGE ({range.length})</Button></label>
        </div>
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px]"><span className="text-slate-500">REPLAY CURSOR</span><span className="text-cyan-300">FRAME #{frames[safeSelected].step} · T+{frames[safeSelected].timestampSeconds.toFixed(1)} s</span></div><input className="w-full accent-cyan-400" type="range" min={0} max={Math.max(0, frames.length - 1)} value={safeSelected} onChange={e => { const next = Number(e.target.value); onSelectIndex?.(next); setStart(next); setEnd(next); }}/></div>
      </>}
      {evidence && <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[8px] tracking-[0.2em] text-slate-600">EVIDENCE PACKAGE READY</div><div className="font-mono text-[10px] text-emerald-300">FRAMES {evidence.source.frameStart}–{evidence.source.frameEnd} · {evidence.source.frameCount} FRAME(S)</div></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={download}><Download className="mr-1 h-3.5 w-3.5"/>JSON</Button><Button size="sm" variant="outline" onClick={() => void copy()}>{copied ? <Check className="mr-1 h-3.5 w-3.5"/> : <Clipboard className="mr-1 h-3.5 w-3.5"/>}{copied ? "COPIED" : "COPY"}</Button></div></div><div className="mt-3 break-all rounded bg-slate-950/70 p-2 font-mono text-[8px] text-slate-500">SHA-256 · {evidence.integrity.canonicalPayloadSha256}</div><div className="mt-2 text-[8px] leading-relaxed text-slate-600">SIMULATION-DERIVED · NOT LAB VALIDATED · source experiment {evidence.source.experimentId} · session {evidence.source.sessionId ?? "none"}</div></div>}
    </section>
    <ScientificReport experimentId={experimentId} sessionId={sessionId} frames={evidence?.frames ?? frames} />
  </div>;
}
