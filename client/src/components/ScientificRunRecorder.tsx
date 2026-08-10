import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

async function sha256(text: string) { const bytes = new TextEncoder().encode(text); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, "0")).join(""); }

export function ScientificRunRecorder({ experimentId, frames, completed }: { experimentId: string; frames: any[]; completed: boolean }) {
  const [objective, setObjective] = useState("Capture a traceable digital-twin process run.");
  const [hypothesis, setHypothesis] = useState("");
  const [sampleId, setSampleId] = useState(`SIM-SAMPLE-${experimentId.slice(0, 8)}`);
  const [note, setNote] = useState("");
  const [datasetHash, setDatasetHash] = useState<string | null>(null);
  const resultsQuery = trpc.simulation.getResults.useQuery(experimentId, { enabled: completed });
  const persistedFrames = (resultsQuery.data?.realTimeData as unknown as any[] | null | undefined) ?? frames;
  const frameCount = persistedFrames.length;
  const latest = persistedFrames.at(-1);
  const provenance = useMemo(() => ({ source: "ClosedLoopSimulationEngine", origin: "SIMULATION", qualityStatus: "RAW", experimentId, sampleId, modelStatus: latest?.ultrasonic?.modelStatus ?? "DATA_GAP" }), [experimentId, sampleId, latest]);

  useEffect(() => { if (!completed || !persistedFrames.length) return; void sha256(JSON.stringify(persistedFrames)).then(setDatasetHash); }, [completed, persistedFrames]);

  const manifest = useMemo(() => ({ datasetId: `IUVFES-DS-${experimentId.slice(0, 12)}`, version: "1.0.0", sha256: datasetHash, metadata: { ...provenance, frameCount, generatedAt: new Date().toISOString() } }), [datasetHash, experimentId, provenance, frameCount]);

  return <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400">SCIENTIFIC DATA CAPTURE</p><h3 className="text-lg font-semibold">Research Record</h3></div><div className="font-mono text-xs text-slate-500">{completed ? "DATASET READY" : "LIVE TRACE"}</div></div><div className="grid gap-3 md:grid-cols-2"><Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Experiment objective" className="bg-slate-900" /><Input value={sampleId} onChange={e => setSampleId(e.target.value)} placeholder="Sample ID" className="bg-slate-900" /><Textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder="Optional hypothesis" className="bg-slate-900 md:col-span-2" /></div><div className="mt-3 flex gap-2"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Operator/research observation (session-local)..." className="bg-slate-900" /><Button onClick={() => setNote("")} disabled={!note.trim()} variant="outline">Record note</Button></div><div className="mt-3 grid gap-2 text-xs font-mono text-slate-400 md:grid-cols-4"><div className="rounded bg-slate-900 p-2">Causal frames: {frameCount}</div><div className="rounded bg-slate-900 p-2">Persisted: {resultsQuery.isSuccess ? "YES" : completed ? "PENDING" : "LIVE"}</div><div className="rounded bg-slate-900 p-2">Provenance: {provenance.source}</div><div className="rounded bg-slate-900 p-2">Hash: {manifest.sha256 ? `${manifest.sha256.slice(0, 12)}…` : "PENDING"}</div></div><div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 font-mono text-[10px] text-slate-500">MODEL: {provenance.modelStatus} · ORIGIN: {provenance.origin} · QUALITY: {provenance.qualityStatus}</div></section>;
}
