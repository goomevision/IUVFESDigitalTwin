import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleGauge, Pause, Play, RotateCcw, Square, Thermometer, Wind, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ProcessMachine3D } from "@/components/ProcessMachine3D";
import { ProcessEventTimeline } from "@/components/ProcessEventTimeline";
import { ScientificRunRecorder } from "@/components/ScientificRunRecorder";
import type { CausalFrame } from "../../../server/closedLoopSimulation";

interface ProcessSimulatorProps { experimentId: string; onExit?: () => void; onComplete?: () => void; }
type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE" | "FAULT";
const STAGES: Array<{ id: Stage; label: string; description: string }> = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT", description: "Checking sensors, chamber seals and process interlocks" },
  { id: "CHARGE", label: "CHARGE", description: "Loading botanical material and verifying mass balance" },
  { id: "VACUUM", label: "VACUUM", description: "Evacuating the chamber toward the target pressure" },
  { id: "HEAT_UP", label: "HEAT-UP", description: "Ramping temperature only after the vacuum interlock passes" },
  { id: "EXTRACTION", label: "EXTRACTION", description: "Driving moisture and volatile compounds from the matrix" },
  { id: "CONDENSATION", label: "CONDENSATION", description: "Recovering vapor and separating condensate streams" },
  { id: "COOL_DOWN", label: "COOL-DOWN", description: "Returning the chamber to a safe handling state" },
  { id: "COMPLETE", label: "COMPLETE", description: "Final mass and energy balance calculated" },
];
function Gauge({ label, value, max, unit, icon: Icon }: { label: string; value: number; max: number; unit: string; icon: typeof Wind }) { const percent = Math.max(0, Math.min(100, value / Math.max(max, .001) * 100)); return <div className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4"><div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400"><Icon className="h-4 w-4 text-cyan-400" />{label}</div><div className="flex items-end justify-between"><div className="font-mono text-2xl font-bold text-cyan-300">{value.toFixed(1)}</div><div className="text-xs text-slate-500">{unit}</div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${percent}%` }} /></div></div>; }
function machineLabel(on: boolean, active = "ACTIVE", standby = "OFF") { return on ? active : standby; }

export function ProcessSimulator({ experimentId, onExit, onComplete }: ProcessSimulatorProps) {
  const experimentQuery = trpc.experiments.get.useQuery(experimentId);
  const startMutation = trpc.closedLoop.start.useMutation();
  const stepMutation = trpc.closedLoop.step.useMutation();
  const pauseMutation = trpc.closedLoop.pause.useMutation();
  const resumeMutation = trpc.closedLoop.resume.useMutation();
  const stopMutation = trpc.closedLoop.stop.useMutation();
  const statusQuery = trpc.closedLoop.status.useQuery({ experimentId }, { refetchOnWindowFocus: false, refetchInterval: 1000 });
  const [frames, setFrames] = useState<CausalFrame[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [alarm, setAlarm] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);

  // The server is the source of truth. On mount/reload, restore the persisted
  // causal frames instead of starting a second simulation from step zero.
  useEffect(() => {
    const data = statusQuery.data;
    if (!data?.exists) return;
    const persistedFrames = (data.frames ?? []) as CausalFrame[];
    if (!hydratedRef.current || persistedFrames.length > frames.length) {
      hydratedRef.current = true;
      setFrames(persistedFrames);
      setPaused(data.status === "paused");
      setRunning(data.status === "running");
      setCompleted(data.status === "completed");
      if (data.state?.alarm) setAlarm(data.state.alarm);
    }
  }, [statusQuery.data]);

  const current = frames.at(-1)?.sensorAfter ?? statusQuery.data?.sensors ?? { pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 };
  const machine = frames.at(-1)?.controller ?? statusQuery.data?.state;
  const ultrasonic = frames.at(-1)?.ultrasonic ?? null;
  const activeStage: Stage = machine?.stage ?? (statusQuery.data?.state?.stage as Stage) ?? "PRE_FLIGHT";
  const stageIndex = STAGES.findIndex(s => s.id === activeStage);
  const timeline = useMemo(() => frames.map(f => ({ ...f.controller, elapsedSeconds: f.timestampSeconds })), [frames]);
  const recentFrames = useMemo(() => frames.slice(Math.max(0, frames.length - 80)), [frames]);

  const stopTimer = () => { if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; } };

  const stepOnce = async () => {
    try {
      const result = await stepMutation.mutateAsync({ experimentId });
      if (result.frames) setFrames(result.frames as CausalFrame[]);
      else if (result.frame) setFrames(prev => [...prev, result.frame as CausalFrame]);
      if (result.status === "completed" || result.status === "failed") {
        stopTimer(); setRunning(false); setPaused(false); setCompleted(result.status === "completed");
        if (result.status === "failed") setAlarm(result.state?.alarm ?? "PROCESS FAULT");
        onComplete?.();
      }
    } catch (error) { console.error(error); stopTimer(); setRunning(false); setAlarm("CLOSED-LOOP STEP ERROR — PROCESS PAUSED"); toast.error("Process step failed"); }
  };

  const start = async () => {
    if (!experimentQuery.data || startMutation.isPending) return;
    const p = experimentQuery.data.inputParameters as Record<string, unknown>;
    try {
      const result = await startMutation.mutateAsync({ experimentId, materialWeight: Number(p.materialWeight), waterContent: Number(p.waterContent), oilContent: Number(p.oilContent), targetPressure: Number(p.targetPressure), targetTemperature: Number(p.targetTemperature), dtSeconds: 1, maxSteps: Math.min(100000, Math.max(100, Math.ceil(Number(p.duration || 1) * 3600))) });
      const existingFrames = (result.frames ?? []) as unknown as CausalFrame[];
      setFrames(existingFrames); setAlarm(null); setCompleted(false); setPaused(result.status === "paused"); setRunning(result.status === "running"); hydratedRef.current = true; toast.success(result.status === "running" ? "Closed-loop control session started" : "Existing closed-loop session restored");
    } catch (error) { console.error(error); setAlarm("CLOSED-LOOP START ERROR — PROCESS NOT STARTED"); toast.error("Could not start process"); }
  };

  const pause = async () => { try { const result = await pauseMutation.mutateAsync({ experimentId }); stopTimer(); setFrames((result as any).frames ?? frames); setPaused(true); setRunning(false); toast.success("Process paused — state persisted"); } catch (error) { console.error(error); toast.error("Pause failed"); } };
  const resume = async () => { try { const result = await resumeMutation.mutateAsync({ experimentId }); if ((result as any).frames) setFrames((result as any).frames as CausalFrame[]); setPaused(false); setRunning(true); toast.success("Process resumed from persisted state"); } catch (error) { console.error(error); toast.error("Resume failed"); } };
  const stop = async () => { try { const result = await stopMutation.mutateAsync({ experimentId }); if ((result as any).frames) setFrames((result as any).frames as CausalFrame[]); stopTimer(); setRunning(false); setPaused(false); toast.success("Process stopped and state retained"); } catch (error) { console.error(error); toast.error("Stop failed"); } };
  const reset = async () => { if (running || paused) await stop(); stopTimer(); setFrames([]); setRunning(false); setPaused(false); setCompleted(false); setAlarm(null); hydratedRef.current = false; };

  useEffect(() => { if (!running || paused || timerRef.current !== null) return; timerRef.current = window.setInterval(() => { void stepOnce(); }, 180); return stopTimer; }, [running, paused, experimentId]);
  useEffect(() => () => stopTimer(), []);

  const chartPoints = recentFrames.map((f, i) => `${recentFrames.length <= 1 ? 0 : i / (recentFrames.length - 1) * 100},${100 - Math.min(100, f.sensorAfter.temperatureC / 150 * 100)}`).join(" ");
  const stateAlarm = machine?.alarm ?? alarm;
  const stageProgress = machine?.progress ?? 0;
  const cavitationPercent = ultrasonic ? Math.round(ultrasonic.cavitationActivity * 100) : 0;

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-4 text-slate-100 md:p-6"><div className="mx-auto max-w-[1500px] space-y-4">
    <header className="flex flex-col gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 backdrop-blur md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${running ? "animate-pulse bg-emerald-400" : paused ? "bg-yellow-400" : "bg-slate-600"}`} /><span className="font-mono text-xs tracking-[0.35em] text-cyan-400">IUVFES // DIGITAL TWIN CONTROL SYSTEM</span></div><h1 className="mt-2 text-2xl font-bold tracking-wide md:text-3xl">PROCESS SIMULATION CONTROL ROOM</h1><p className="font-mono text-xs text-slate-500">EXPERIMENT {experimentId} • PERSISTENT CLOSED LOOP</p></div><div className="flex flex-wrap gap-2"><Button onClick={start} disabled={startMutation.isPending || running || paused} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Play className="mr-2 h-4 w-4" />START / RESTORE</Button>{!paused ? <Button onClick={pause} disabled={!running || pauseMutation.isPending} variant="outline" className="border-yellow-500/40 bg-transparent text-yellow-300"><Pause className="mr-2 h-4 w-4" />PAUSE</Button> : <Button onClick={resume} disabled={resumeMutation.isPending} variant="outline" className="border-emerald-500/40 bg-transparent text-emerald-300"><Play className="mr-2 h-4 w-4" />RESUME</Button>}<Button onClick={stop} disabled={!running && !paused} variant="outline" className="border-red-500/30 bg-transparent text-red-300"><Square className="mr-2 h-4 w-4" />STOP</Button><Button onClick={reset} variant="outline" className="border-slate-700 bg-transparent text-slate-300"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button><Button onClick={onExit} variant="outline" className="border-slate-700 bg-transparent text-slate-300"><Square className="mr-2 h-4 w-4" />EXIT</Button></div></header>
    {statusQuery.data?.exists && <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 font-mono text-xs text-cyan-200">SESSION LINKED • SERVER STEP {statusQuery.data.step} • {statusQuery.data.frameCount} CAUSAL FRAMES • STATUS {statusQuery.data.status.toUpperCase()} • UI RECOVERS FROM PERSISTED STATE</div>}
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-slate-500">Controller state</p><h2 className={`text-xl font-semibold ${activeStage === "FAULT" ? "text-red-300" : "text-cyan-300"}`}>{STAGES.find(s => s.id === activeStage)?.label ?? activeStage}</h2></div><div className="font-mono text-xs text-slate-500">{Math.round(stageProgress * 100)}% • STEP {statusQuery.data?.step ?? frames.length}</div></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{STAGES.map((item, index) => <div key={item.id} className={`rounded-lg border p-3 ${index === stageIndex ? "border-cyan-400/70 bg-cyan-400/10" : index < stageIndex ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800 bg-slate-900/40"}`}><div className="mb-2 flex items-center justify-between">{index < stageIndex ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : index === stageIndex ? <CircleGauge className="h-4 w-4 animate-pulse text-cyan-400" /> : <div className="h-4 w-4 rounded-full border border-slate-700" />}<span className="font-mono text-[10px] text-slate-600">0{index + 1}</span></div><div className="text-[11px] font-semibold tracking-wider">{item.label}</div></div>)}</div><p className="mt-3 text-sm text-slate-400">{machine?.transitionReason ?? STAGES[stageIndex]?.description}</p></section>
    {stateAlarm && <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"><AlertTriangle className="h-5 w-5" />{stateAlarm}</div>}
    <div className="grid gap-4 lg:grid-cols-4"><Gauge label="CHAMBER PRESSURE" value={current.pressureMbar} max={1013.25} unit="mbar" icon={Wind} /><Gauge label="PROCESS TEMPERATURE" value={current.temperatureC} max={150} unit="°C" icon={Thermometer} /><Gauge label="RECOVERY YIELD" value={current.yieldPercent} max={100} unit="%" icon={CircleGauge} /><Gauge label="ENERGY LOAD" value={current.energyKwh} max={10} unit="kWh" icon={Zap} /></div>
    <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/60 p-4"><div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400">ULTRASONIC PHYSICS CHANNEL</p><h3 className="text-lg font-semibold">In-Situ Cavitation Monitor</h3></div><span className={`rounded-full border px-3 py-1 font-mono text-[10px] ${ultrasonic ? "border-emerald-500/30 text-emerald-300" : "border-slate-700 text-slate-500"}`}>{ultrasonic?.cavitationStatus ?? "NOT CONFIGURED"}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><div className="rounded-lg bg-slate-900/70 p-3"><div className="text-[10px] text-slate-500">FREQUENCY</div><div className="font-mono text-lg text-cyan-300">{ultrasonic ? `${(ultrasonic.frequencyHz / 1000).toFixed(1)} kHz` : "—"}</div></div><div className="rounded-lg bg-slate-900/70 p-3"><div className="text-[10px] text-slate-500">ACOUSTIC POWER</div><div className="font-mono text-lg text-cyan-300">{ultrasonic ? `${ultrasonic.acousticPowerW.toFixed(1)} W` : "—"}</div></div><div className="rounded-lg bg-slate-900/70 p-3"><div className="text-[10px] text-slate-500">INTENSITY</div><div className="font-mono text-lg text-cyan-300">{ultrasonic ? `${(ultrasonic.acousticIntensityWm2 / 1000).toFixed(2)} kW/m²` : "—"}</div></div><div className="rounded-lg bg-slate-900/70 p-3"><div className="text-[10px] text-slate-500">CAVITATION DRIVE</div><div className="font-mono text-lg text-emerald-300">{ultrasonic ? `${cavitationPercent}%` : "—"}</div></div><div className="rounded-lg bg-slate-900/70 p-3"><div className="text-[10px] text-slate-500">MASS TRANSFER</div><div className="font-mono text-lg text-amber-300">{ultrasonic ? `${ultrasonic.massTransferMultiplier.toFixed(2)}×` : "—"}</div></div><div className="rounded-lg bg-slate-900/70 p-3"><div className="text-[10px] text-slate-500">MODEL STATUS</div><div className="font-mono text-xs text-slate-300">{ultrasonic?.modelStatus ?? "DATA GAP"}</div></div></div></section>
    <ProcessMachine3D machine={machine} />
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold tracking-wider text-cyan-300">LIVE PROCESS TREND</h3><span className="font-mono text-xs text-slate-500">T: {(frames.at(-1)?.timestampSeconds ?? 0).toFixed(0)}s</span></div><div className="relative h-64 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />{chartPoints && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chartPoints} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>}<div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">TEMPERATURE PROFILE</div></div></section>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><h3 className="mb-4 font-semibold tracking-wider text-cyan-300">MACHINE STATE</h3><div className="space-y-3 font-mono text-xs">{[["VACUUM PUMP", machineLabel(machine?.commands.vacuumPump ?? false)],["HEATER", machineLabel(machine?.commands.heater ?? false)],["EXTRACTOR", machineLabel(machine?.commands.extractor ?? false)],["CONDENSER", machineLabel(machine?.commands.condenser ?? false)],["COOLING", machineLabel(machine?.commands.cooling ?? false)],["VACUUM INTERLOCK", machine?.interlocks.vacuumAchieved ? "PASS" : "WAITING"],["THERMAL INTERLOCK", machine?.interlocks.overTemperature ? "TRIPPED" : "SAFE"],["MASS BALANCE", `${current.oilRecoveredKg.toFixed(3)} kg oil / ${current.waterRemovedKg.toFixed(3)} kg water`]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span className="text-slate-500">{label}</span><span className={value === "ACTIVE" || value === "PASS" || value === "SAFE" ? "text-emerald-300" : value === "TRIPPED" ? "text-red-300" : "text-cyan-300"}>{value}</span></div>)}</div></section></div>
    <ProcessEventTimeline timeline={timeline} />
    <ScientificRunRecorder experimentId={experimentId} frames={frames} completed={completed} />
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="grid gap-3 md:grid-cols-4"><div><span className="text-xs text-slate-500">OIL RECOVERED</span><div className="font-mono text-xl text-amber-300">{current.oilRecoveredKg.toFixed(3)} kg</div></div><div><span className="text-xs text-slate-500">WATER REMOVED</span><div className="font-mono text-xl text-blue-300">{current.waterRemovedKg.toFixed(3)} kg</div></div><div><span className="text-xs text-slate-500">PROCESS TIME</span><div className="font-mono text-xl text-emerald-300">{(frames.at(-1)?.timestampSeconds ?? 0).toFixed(0)} s</div></div><div><span className="text-xs text-slate-500">CAUSAL FRAMES</span><div className="font-mono text-xl text-cyan-300">{frames.length || "READY"}</div></div></div></section>
  </div></div>;
}