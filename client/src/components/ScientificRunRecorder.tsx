import { useEffect, useRef, useState } from "react";
import { Database, FileCheck2, FlaskConical, Radio, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { CausalFrame } from "../../../server/closedLoopSimulation";

async function sha256(text: string) { const bytes = new TextEncoder().encode(text); const digest = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, "0")).join(""); }

export function ScientificRunRecorder({ experimentId, frames, completed }: { experimentId: string; frames: CausalFrame[]; completed: boolean }) {
  const [researchId, setResearchId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [objective, setObjective] = useState("Capture a traceable digital-twin process run.");
  const [hypothesis, setHypothesis] = useState("");
  const [sampleId, setSampleId] = useState(`SIM-SAMPLE-${experimentId.slice(0, 8)}`);
  const [savedFrames, setSavedFrames] = useState(0);
  const created = useRef(false);
  const started = useRef(false);
  const completedRecorded = useRef(false);
  const manifestCreated = useRef(false);
  const experiment = trpc.experiments.get.useQuery(experimentId);
  const createResearch = trpc.research.create.useMutation();
  const startResearch = trpc.research.start.useMutation();
  const completeResearch = trpc.research.complete.useMutation();
  const recordSensor = trpc.research.recordSensor.useMutation();
  const recordNote = trpc.research.recordNote.useMutation();
  const createManifest = trpc.research.datasetManifest.useMutation();

  useEffect(() => { if (!experiment.data || created.current) return; const p = experiment.data.inputParameters as Record<string, unknown>; created.current = true; createResearch.mutateAsync({ title: experiment.data.experimentName, objective, hypothesis: hypothesis || undefined, materialId: experiment.data.materialId, sampleId, massKg: Number(p.materialWeight), procedure: ["Digital experiment setup", "Closed-loop physics step", "Machine-state evaluation", "Causal frame capture"], inputParameters: p }).then(result => setResearchId(result.researchId)).catch(() => { created.current = false; toast.error("Scientific record could not be initialized"); }); }, [experiment.data, objective, hypothesis, sampleId, createResearch]);
  useEffect(() => { if (!researchId || started.current) return; started.current = true; void startResearch.mutate(researchId); }, [researchId, startResearch]);
  useEffect(() => { if (!researchId || !frames.length) return; const next = frames.slice(savedFrames); if (!next.length) return; const sampled = next.filter((_, index) => index % 10 === 0 || index === next.length - 1).slice(0, 25); sampled.forEach(frame => { const observedAt = new Date(Date.now() + frame.timestampSeconds * 1000); void recordSensor.mutateAsync({ experimentId: researchId, observedAt, instrumentId: "IUVFES-CLOSED-LOOP", parameter: "temperature", value: frame.sensorAfter.temperatureC, unit: "C", qualityFlag: "RAW" }); void recordSensor.mutateAsync({ experimentId: researchId, observedAt, instrumentId: "IUVFES-CLOSED-LOOP", parameter: "pressure", value: frame.sensorAfter.pressureMbar, unit: "mbar", qualityFlag: "RAW" }); void recordSensor.mutateAsync({ experimentId: researchId, observedAt, instrumentId: "IUVFES-CLOSED-LOOP", parameter: "oilRecovered", value: frame.materialInventory.oilRecoveredKg, unit: "kg", qualityFlag: "RAW" }); void recordSensor.mutateAsync({ experimentId: researchId, observedAt, instrumentId: "IUVFES-CLOSED-LOOP", parameter: "waterRemoved", value: frame.materialInventory.waterRemovedKg, unit: "kg", qualityFlag: "RAW" }); }); setSavedFrames(frames.length); }, [researchId, frames, savedFrames, recordSensor]);
  useEffect(() => { if (!researchId || !completed || !frames.length || completedRecorded.current) return; completedRecorded.current = true; void completeResearch.mutateAsync({ experimentId: researchId, outcome: "completed", conclusion: "Closed-loop digital-twin process run completed; causal frame dataset captured for scientific traceability." }).catch(() => { completedRecorded.current = false; toast.error("Scientific closeout could not be recorded"); }); }, [researchId, completed, frames.length, completeResearch]);
  useEffect(() => { if (!researchId || !completed || !frames.length || manifestCreated.current) return; manifestCreated.current = true; const payload = JSON.stringify({ experimentId, frames }); void sha256(payload).then(hash => createManifest.mutateAsync({ id: `IUVFES-DS-${experimentId.slice(0, 12)}`, experimentId: researchId, version: "1.0.0", origin: "SIMULATION", qualityStatus: "RAW", sha256: hash, storageRef: `inline://simulation/${experimentId}/causal-frames.json`, metadata: { frameCount: frames.length, capture: "simulation-control-room", source: "ClosedLoopSimulationEngine", generatedAt: new Date().toISOString() } })).then(() => toast.success("Causal-frame dataset manifest recorded")).catch(() => { manifestCreated.current = false; toast.error("Dataset manifest could not be recorded"); }); }, [researchId, completed, frames, experimentId, createManifest]);
  const saveNote = async () => { if (!researchId || !note.trim()) return; await recordNote.mutateAsync({ experimentId: researchId, observedAt: new Date(), note: note.trim() }); setNote(""); toast.success("Research observation recorded"); };

  const captureProgress = frames.length ? Math.min(100, savedFrames / frames.length * 100) : 0;
  const datasetStatus = completed ? "MANIFESTED" : frames.length ? "LIVE CAPTURE" : "READY";
  const statusClass = completed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : frames.length ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-slate-700 bg-slate-900 text-slate-500";

  return <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-950/70 shadow-xl shadow-emerald-950/10">
    <div className="border-b border-slate-800/80 p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3"><FlaskConical className="h-5 w-5 text-emerald-300" /></div><div><p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-emerald-400">SCIENTIFIC DATA CAPTURE</p><h3 className="mt-1 text-lg font-semibold text-slate-100">Research Record</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Trace the simulation run, operator observations and dataset provenance without leaving the control room.</p></div></div>
        <div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-1 font-mono text-[9px] font-semibold tracking-[0.16em] ${statusClass}`}>{datasetStatus}</span><span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-[9px] text-slate-500">{researchId ?? "INITIALIZING"}</span></div>
      </div>
    </div>

    <div className="p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Experiment objective</span><Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Experiment objective" className="border-slate-800 bg-slate-900/70" /></label>
        <label className="space-y-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Sample ID</span><Input value={sampleId} onChange={e => setSampleId(e.target.value)} placeholder="Sample ID" className="border-slate-800 bg-slate-900/70" /></label>
        <label className="space-y-2 md:col-span-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Working hypothesis</span><Textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder="Optional hypothesis" className="min-h-20 border-slate-800 bg-slate-900/70" /></label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[["CAUSAL FRAMES", `${frames.length}`, Database], ["CAPTURED", `${savedFrames}`, Radio], ["DATASET", datasetStatus, FileCheck2]].map(([label, value, Icon]) => <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-3"><Icon className="h-4 w-4 text-emerald-400" /><div><div className="font-mono text-[9px] tracking-[0.15em] text-slate-600">{label}</div><div className="mt-1 font-mono text-sm text-slate-300">{value as string}</div></div></div>)}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/35 p-4"><div className="mb-2 flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Capture progress</span><span className="font-mono text-[10px] text-emerald-300">{Math.round(captureProgress)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${captureProgress}%` }} /></div></div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/35 p-3"><div className="flex flex-col gap-2 md:flex-row"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Record an operator / research observation..." className="border-slate-800 bg-slate-950/70" /><Button onClick={saveNote} disabled={!researchId || !note.trim()} variant="outline" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"><Save className="mr-2 h-4 w-4" />Record observation</Button></div></div>
    </div>
  </section>;
}
