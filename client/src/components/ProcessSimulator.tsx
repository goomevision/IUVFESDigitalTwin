import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleGauge, Pause, Play, RotateCcw, Square, Thermometer, Wind, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ProcessMachine3D } from "@/components/ProcessMachine3D";
import { ProcessEventTimeline } from "@/components/ProcessEventTimeline";
import { ScientificRunRecorder } from "@/components/ScientificRunRecorder";

interface ProcessSimulatorProps { experimentId: string; onExit?: () => void; onComplete?: () => void; }
type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE" | "FAULT";
interface Sensors { chamberSealed: boolean; pressureMbar: number; temperatureC: number; yieldPercent: number; waterRemovedKg: number; oilRecoveredKg: number; energyKwh: number; }
interface Commands { vacuumPump: boolean; heater: boolean; extractor: boolean; condenser: boolean; cooling: boolean; }
interface Interlocks { chamberSealed: boolean; pressureSafeForHeating: boolean; temperatureSafeForCooling: boolean; overTemperature: boolean; vacuumAchieved: boolean; allSystemsSafe: boolean; }
interface MaterialInventory { initialMassKg: number; remainingMassKg: number; waterInitialKg: number; waterRemovedKg: number; waterRemainingKg: number; oilPotentialKg: number; oilRecoveredKg: number; oilRemainingPotentialKg: number; recoveryPercent: number; }
interface SafetyFrame { stage: Stage; allSystemsSafe: boolean; chamberSealed: boolean; pressureSafeForHeating: boolean; temperatureSafeForCooling: boolean; vacuumAchieved: boolean; overTemperature: boolean; alarm: string | null; transitionReason: string; }
interface CausalFrame { step: number; timestampSeconds: number; sensorBefore: Sensors; controller: { stage: Stage; progress: number; elapsedSeconds: number; sensors: Sensors; commands: Commands; interlocks: Interlocks; alarm: string | null; transitionReason: string }; intendedCommands: Commands; effectiveCommands: Commands; physicalSensorAfter: Sensors; sensorAfter: Sensors; materialInventory: MaterialInventory; safety: SafetyFrame; paused: boolean; }

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

const INITIAL: Sensors = { chamberSealed: true, pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 };

function Gauge({ label, value, max, unit, icon: Icon }: { label: string; value: number; max: number; unit: string; icon: typeof Wind }) {
  const percent = Math.max(0, Math.min(100, value / Math.max(max, 0.001) * 100));
  return <div className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4"><div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400"><Icon className="h-4 w-4 text-cyan-400" />{label}</div><div className="flex items-end justify-between"><div className="font-mono text-2xl font-bold text-cyan-300">{value.toFixed(2)}</div><div className="text-xs text-slate-500">{unit}</div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${percent}%` }} /></div></div>;
}

function machineLabel(on: boolean) { return on ? "ACTIVE" : "OFF"; }

export function ProcessSimulator({ experimentId, onExit, onComplete }: ProcessSimulatorProps) {
  const experimentQuery = trpc.experiments.get.useQuery(experimentId);
  const createSession = trpc.closedLoop.create.useMutation();
  const startSession = trpc.closedLoop.start.useMutation();
  const stepSession = trpc.closedLoop.step.useMutation();
  const pauseSession = trpc.closedLoop.pause.useMutation();
  const resumeSession = trpc.closedLoop.resume.useMutation();
  const stopSession = trpc.closedLoop.stop.useMutation();
  const resetSession = trpc.closedLoop.reset.useMutation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frames, setFrames] = useState<CausalFrame[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [alarm, setAlarm] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const latestFrame = frames.length ? frames[frames.length - 1] : null;
  const current = latestFrame?.sensorAfter ?? INITIAL;
  const machine = latestFrame?.controller;
  const safety = latestFrame?.safety;
  const material = latestFrame?.materialInventory;
  const activeStage: Stage = safety?.stage ?? machine?.stage ?? "PRE_FLIGHT";
  const stageIndex = STAGES.findIndex(s => s.id === activeStage);
  const recentFrames = useMemo(() => frames.slice(Math.max(0, frames.length - 80)), [frames]);
  const timeline = useMemo(() => frames.map(frame => ({ ...frame.controller, elapsedSeconds: frame.timestampSeconds })), [frames]);

  // The 3D twin is deliberately fed by EFFECTIVE commands: the commands that survived the
  // controller/interlock/actuation path and were actually applied to the simulated machine.
  const machineVisual = latestFrame ? {
    stage: latestFrame.safety.stage,
    commands: latestFrame.effectiveCommands,
    sensors: latestFrame.sensorAfter,
    interlocks: {
      vacuumAchieved: latestFrame.safety.vacuumAchieved,
      overTemperature: latestFrame.safety.overTemperature,
    },
  } : undefined;

  const clearTimer = () => { if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; } };
  useEffect(() => () => clearTimer(), []);

  const appendFrame = (frame: CausalFrame) => {
    setFrames(previous => [...previous, frame]);
    setAlarm(frame.safety.alarm);
  };

  const stepOnce = async (id: string) => {
    const result = await stepSession.mutateAsync(id);
    if (!result.frame) return;
    const frame = result.frame as CausalFrame;
    appendFrame(frame);
    if (result.session.status === "completed" || frame.safety.stage === "COMPLETE" || frame.safety.stage === "FAULT") {
      clearTimer();
      setRunning(false);
      setPaused(false);
      setCompleted(frame.safety.stage === "COMPLETE");
      if (frame.safety.stage === "COMPLETE") onComplete?.();
    }
  };

  const startSimulation = async () => {
    if (!experimentQuery.data || createSession.isPending) return;
    const p = experimentQuery.data.inputParameters as Record<string, unknown>;
    try {
      setAlarm(null); setCompleted(false); setFrames([]); setRunning(false); setPaused(false);
      const durationHours = Number(p.duration);
      const dtSeconds = 1;
      const durationSeconds = Number.isFinite(durationHours) && durationHours > 0 ? durationHours * 3600 : 300;
      const maxSteps = Math.max(1, Math.min(100000, Math.ceil(durationSeconds / dtSeconds)));
      const created = await createSession.mutateAsync({
        experimentId,
        materialWeight: Number(p.materialWeight),
        waterContent: Number(p.waterContent),
        oilContent: Number(p.oilContent),
        targetPressure: Number(p.targetPressure),
        targetTemperature: Number(p.targetTemperature),
        dtSeconds,
        maxSteps,
      });
      await startSession.mutateAsync(created.sessionId);
      setSessionId(created.sessionId);
      setRunning(true);
      await stepOnce(created.sessionId);
      toast.success(`Live closed-loop physics session started — ${durationHours} h / ${maxSteps} steps`);
    } catch (error) {
      console.error(error); clearTimer(); setRunning(false); setAlarm("SIMULATION ENGINE ERROR — PROCESS NOT STARTED"); toast.error("Closed-loop simulation failed");
    }
  };

  useEffect(() => {
    clearTimer();
    if (!running || paused || !sessionId) return;
    timerRef.current = window.setInterval(() => {
      void stepOnce(sessionId).catch(error => { console.error(error); clearTimer(); setRunning(false); setAlarm("LIVE STEP ERROR — PROCESS PAUSED"); });
    }, 1000);
    return clearTimer;
  }, [running, paused, sessionId]);

  const pause = async () => { if (!sessionId) return; try { await pauseSession.mutateAsync(sessionId); clearTimer(); setPaused(true); setRunning(false); } catch { toast.error("Pause failed"); } };
  const resume = async () => { if (!sessionId) return; try { await resumeSession.mutateAsync(sessionId); setPaused(false); setRunning(true); } catch { toast.error("Resume failed"); } };
  const stop = async () => { if (!sessionId) return; try { await stopSession.mutateAsync(sessionId); clearTimer(); setRunning(false); setPaused(false); } catch { toast.error("Stop failed"); } };
  const reset = async () => { clearTimer(); if (sessionId) { try { await resetSession.mutateAsync(sessionId); } catch (error) { console.error(error); } } setSessionId(null); setFrames([]); setRunning(false); setPaused(false); setCompleted(false); setAlarm(null); };

  const chartPoints = recentFrames.map((frame, index) => {
    const x = recentFrames.length <= 1 ? 0 : index / (recentFrames.length - 1) * 100;
    const y = 100 - Math.min(100, frame.sensorAfter.temperatureC / 150 * 100);
    return `${x},${y}`;
  }).join(" ");
  const stateAlarm = machine?.alarm ?? alarm;

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-4 text-slate-100 md:p-6"><div className="mx-auto max-w-[1500px] space-y-4">
    <header className="flex flex-col gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 backdrop-blur md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${running && !paused ? "animate-pulse bg-emerald-400" : safety?.stage === "FAULT" ? "bg-red-400" : "bg-slate-600"}`} /><span className="font-mono text-xs tracking-[0.35em] text-cyan-400">IUVFES // DIGITAL TWIN CONTROL SYSTEM</span></div><h1 className="mt-2 text-2xl font-bold tracking-wide md:text-3xl">PROCESS SIMULATION CONTROL ROOM</h1><p className="font-mono text-xs text-slate-500">EXPERIMENT {experimentId}{sessionId ? ` // SESSION ${sessionId.slice(0, 8)}` : ""}</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => void startSimulation()} disabled={createSession.isPending || startSession.isPending || running || paused} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Play className="mr-2 h-4 w-4" />START</Button><Button onClick={() => void (paused ? resume() : pause())} disabled={!running && !paused} variant="outline" className="border-yellow-500/40 bg-transparent text-yellow-300">{paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}{paused ? "RESUME" : "PAUSE"}</Button><Button onClick={() => void reset()} variant="outline" className="border-red-500/30 bg-transparent text-red-300"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button><Button onClick={() => void stop()} disabled={!sessionId} variant="outline" className="border-slate-700 bg-transparent text-slate-300"><Square className="mr-2 h-4 w-4" />STOP</Button><Button onClick={onExit} variant="outline" className="border-slate-700 bg-transparent text-slate-300">EXIT</Button></div></header>

    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-slate-500">Controller state</p><h2 className={`text-xl font-semibold ${activeStage === "FAULT" ? "text-red-300" : "text-cyan-300"}`}>{STAGES.find(s => s.id === activeStage)?.label ?? activeStage}</h2></div><div className="text-right font-mono text-xs text-slate-500">{Math.round((machine?.progress ?? 0) * 100)}% • STEP {latestFrame?.step ?? 0} • T+{(latestFrame?.timestampSeconds ?? 0).toFixed(1)}s</div></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{STAGES.map((item, index) => <div key={item.id} className={`rounded-lg border p-3 transition-all ${index === stageIndex ? "border-cyan-400/70 bg-cyan-400/10" : index < stageIndex ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800 bg-slate-900/40"}`}><div className="mb-2 flex items-center justify-between">{index < stageIndex ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : index === stageIndex ? <CircleGauge className="h-4 w-4 animate-pulse text-cyan-400" /> : <div className="h-4 w-4 rounded-full border border-slate-700" />}<span className="font-mono text-[10px] text-slate-600">0{index + 1}</span></div><div className="text-[11px] font-semibold tracking-wider">{item.label}</div></div>)}</div><p className="mt-3 text-sm text-slate-400">{machine?.transitionReason ?? STAGES[stageIndex]?.description}</p></section>

    {stateAlarm && <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"><AlertTriangle className="h-5 w-5" />{stateAlarm}</div>}

    <div className="grid gap-4 lg:grid-cols-4"><Gauge label="CHAMBER PRESSURE" value={current.pressureMbar} max={1013.25} unit="mbar" icon={Wind} /><Gauge label="PROCESS TEMPERATURE" value={current.temperatureC} max={150} unit="°C" icon={Thermometer} /><Gauge label="RECOVERY YIELD" value={current.yieldPercent} max={100} unit="%" icon={CircleGauge} /><Gauge label="ENERGY LOAD" value={current.energyKwh} max={10} unit="kWh" icon={Zap} /></div>

    <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/60 p-3"><div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]"><span className="tracking-[0.2em] text-emerald-400">DATA SOURCE: CLOSED-LOOP CAUSAL FRAME</span><span className="text-slate-500">{latestFrame ? `FRAME ${latestFrame.step} • ENGINE OUTPUT • T+${latestFrame.timestampSeconds.toFixed(2)}s` : "WAITING FOR ENGINE FRAME"}</span></div></section>

    <ProcessMachine3D machine={machineVisual} />

    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold tracking-wider text-cyan-300">LIVE PROCESS TREND</h3><span className="font-mono text-xs text-slate-500">T: {(latestFrame?.timestampSeconds ?? 0).toFixed(1)}s • {frames.length} FRAMES</span></div><div className="relative h-64 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />{chartPoints && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chartPoints} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>}<div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">TEMPERATURE / SIMULATION TIME</div></div></section>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold tracking-wider text-cyan-300">MACHINE STATE</h3><span className="font-mono text-[9px] text-slate-600">EFFECTIVE / ACTUAL</span></div><div className="space-y-3 font-mono text-xs">{[["VACUUM PUMP", machineLabel(latestFrame?.effectiveCommands.vacuumPump ?? false)],["HEATER", machineLabel(latestFrame?.effectiveCommands.heater ?? false)],["EXTRACTOR", machineLabel(latestFrame?.effectiveCommands.extractor ?? false)],["CONDENSER", machineLabel(latestFrame?.effectiveCommands.condenser ?? false)],["COOLING", machineLabel(latestFrame?.effectiveCommands.cooling ?? false)],["VACUUM INTERLOCK", safety?.vacuumAchieved ? "PASS" : "WAITING"],["THERMAL INTERLOCK", safety?.overTemperature ? "TRIPPED" : "SAFE"],["MASS BALANCE", material ? `${material.oilRecoveredKg.toFixed(3)} kg oil / ${material.waterRemovedKg.toFixed(3)} kg water` : "—"]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span className="text-slate-500">{label}</span><span className={value === "ACTIVE" || value === "PASS" || value === "SAFE" ? "text-emerald-300" : value === "TRIPPED" ? "text-red-300" : "text-cyan-300"}>{value}</span></div>)}</div></section></div>

    <ProcessEventTimeline timeline={timeline} />
    <ScientificRunRecorder experimentId={experimentId} frames={frames} completed={completed} />

    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="grid gap-3 md:grid-cols-5"><div><span className="text-xs text-slate-500">OIL RECOVERED</span><div className="font-mono text-xl text-amber-300">{material?.oilRecoveredKg.toFixed(3) ?? "0.000"} kg</div></div><div><span className="text-xs text-slate-500">WATER REMOVED</span><div className="font-mono text-xl text-blue-300">{material?.waterRemovedKg.toFixed(3) ?? "0.000"} kg</div></div><div><span className="text-xs text-slate-500">ENERGY</span><div className="font-mono text-xl text-cyan-300">{current.energyKwh.toFixed(3)} kWh</div></div><div><span className="text-xs text-slate-500">OIL RECOVERY</span><div className="font-mono text-xl text-emerald-300">{material?.recoveryPercent.toFixed(2) ?? "0.00"}%</div></div><div><span className="text-xs text-slate-500">CAUSAL FRAME</span><div className="font-mono text-xl text-cyan-300">{latestFrame?.step ?? 0}</div></div></div></section>
  </div></div>;
}
