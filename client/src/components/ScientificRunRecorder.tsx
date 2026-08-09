import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Frame = { timestamp: number; pressure: number; temperature: number; yieldPercentage: number; waterRemoved: number; oilRecovered: number; energyConsumed: number; efficiency: number };

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, "0")).join("");
}

export function ScientificRunRecorder({ experimentId, frames, completed }: { experimentId: string; frames: Frame[]; completed: boolean }) {
  const [researchId, setResearchId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [objective, setObjective] = useState("Capture a traceable digital-twin process run.");
  const [hypothesis, setHypothesis] = useState("");
  const [sampleId, setSampleId] = useState(`SIM-SAMPLE-${experimentId.slice(0, 8)}`);
  const [savedFrames, setSavedFrames] = useState(0);
  const created = useRef(false);
  const started = useRef(false);
  const manifestCreated = useRef(false);

  const experiment = trpc.experiments.get.useQuery(experimentId);
  const createResearch = trpc.research.create.useMutation();
  const startResearch = trpc.research.start.useMutation();
  const recordSensor = trpc.research.recordSensor.useMutation();
  const recordNote = trpc.research.recordNote.useMutation();
  const createManifest = trpc.research.datasetManifest.useMutation();

  useEffect(() => {
    if (!experiment.data || created.current) return;
    const p = experiment.data.inputParameters as Record<string, unknown>;
    created.current = true;
    createResearch.mutateAsync({
      title: experiment.data.experimentName,
      objective,
      hypothesis: hypothesis || undefined,
      materialId: experiment.data.materialId,
      sampleId,
      massKg: Number(p.materialWeight),
      procedure: ["Digital experiment setup", "Physics simulation", "Machine-state evaluation", "Dataset capture"],
      inputParameters: p,
    }).then(result => setResearchId(result.researchId)).catch(() => {
      created.current = false;
      toast.error("Scientific record could not be initialized");
    });
  }, [experiment.data, objective, hypothesis, sampleId, createResearch]);

  useEffect(() => {
    if (!researchId || started.current) return;
    started.current = true;
    startResearch.mutate(researchId);
  }, [researchId, startResearch]);

  useEffect(() => {
    if (!researchId || !frames.length) return;
    const next = frames.slice(savedFrames);
    if (!next.length) return;
    const sampled = next.filter((_, index) => index % 10 === 0 || index === next.length - 1).slice(0, 25);
    sampled.forEach(frame => {
      void recordSensor.mutateAsync({ experimentId: researchId, observedAt: new Date(Date.now() + frame.timestamp * 1000), instrumentId: "DIGITAL-TWIN-SIM", parameter: "temperature", value: frame.temperature, unit: "C", qualityFlag: "RAW" });
      void recordSensor.mutateAsync({ experimentId: researchId, observedAt: new Date(Date.now() + frame.timestamp * 1000), instrumentId: "DIGITAL-TWIN-SIM", parameter: "pressure", value: frame.pressure, unit: "mbar", qualityFlag: "RAW" });
      void recordSensor.mutateAsync({ experimentId: researchId, observedAt: new Date(Date.now() + frame.timestamp * 1000), instrumentId: "DIGITAL-TWIN-SIM", parameter: "oilRecovered", value: frame.oilRecovered, unit: "kg", qualityFlag: "RAW" });
    });
    setSavedFrames(frames.length);
  }, [researchId, frames, savedFrames, recordSensor]);

  useEffect(() => {
    if (!researchId || !completed || !frames.length || manifestCreated.current) return;
    manifestCreated.current = true;
    const payload = JSON.stringify({ experimentId, frames });
    void sha256(payload).then(hash => createManifest.mutateAsync({
      id: `IUVFES-DS-${experimentId.slice(0, 12)}`,
      experimentId: researchId,
      version: "1.0.0",
      origin: "SIMULATION",
      qualityStatus: "RAW",
      sha256: hash,
      storageRef: `inline://simulation/${experimentId}/frames.json`,
      metadata: { frameCount: frames.length, capture: "simulation-control-room", generatedAt: new Date().toISOString() },
    })).then(() => toast.success("Simulation dataset manifest recorded")).catch(() => {
      manifestCreated.current = false;
      toast.error("Dataset manifest could not be recorded");
    });
  }, [researchId, completed, frames, experimentId, createManifest]);

  const saveNote = async () => {
    if (!researchId || !note.trim()) return;
    await recordNote.mutateAsync({ experimentId: researchId, observedAt: new Date(), note: note.trim() });
    setNote("");
    toast.success("Research observation recorded");
  };

  return <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div><p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400">SCIENTIFIC DATA CAPTURE</p><h3 className="text-lg font-semibold">Research Record</h3></div>
      <div className="font-mono text-xs text-slate-500">{researchId ?? "INITIALIZING..."}</div>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Experiment objective" className="bg-slate-900" />
      <Input value={sampleId} onChange={e => setSampleId(e.target.value)} placeholder="Sample ID" className="bg-slate-900" />
      <Textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} placeholder="Optional hypothesis" className="bg-slate-900 md:col-span-2" />
    </div>
    <div className="mt-3 flex gap-2"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Record an operator/research observation..." className="bg-slate-900" /><Button onClick={saveNote} disabled={!researchId || !note.trim()} variant="outline">Record note</Button></div>
    <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono text-slate-400"><div className="rounded bg-slate-900 p-2">Frames: {frames.length}</div><div className="rounded bg-slate-900 p-2">Captured: {savedFrames}</div><div className="rounded bg-slate-900 p-2">Dataset: {completed ? "MANIFESTED" : "LIVE"}</div></div>
  </section>;
}
