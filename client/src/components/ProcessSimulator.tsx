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
interface Frame { timestamp: number; pressure: number; temperature: number; yieldPercentage: number; waterRemoved: number; oilRecovered: number; energyConsumed: number; efficiency: number; }
interface MachineState { stage: Stage; progress: number; elapsedSeconds: number; sensors: { pressureMbar: number; temperatureC: number }; commands: { vacuumPump: boolean; heater: boolean; extractor: boolean; condenser: boolean; cooling: boolean }; interlocks: { pressureSafeForHeating: boolean; temperatureSafeForCooling: boolean; overTemperature: boolean; vacuumAchieved: boolean; allSystemsSafe: boolean }; alarm: string | null; transitionReason: string; }
const STAGES: Array<{ id: Stage; label: string; description: string }> = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT", description: "Checking sensors, chamber seals and process interlocks" }, { id: "CHARGE", label: "CHARGE", description: "Loading botanical material and verifying mass balance" }, { id: "VACUUM", label: "VACUUM", description: "Evacuating the chamber toward the target pressure" }, { id: "HEAT_UP", label: "HEAT-UP", description: "Ramping temperature only after the vacuum interlock passes" }, { id: "EXTRACTION", label: "EXTRACTION", description: "Driving moisture and volatile compounds from the matrix" }, { id: "CONDENSATION", label: "CONDENSATION", description: "Recovering vapor and separating condensate streams" }, { id: "COOL_DOWN", label: "COOL-DOWN", description: "Returning the chamber to a safe handling state" }, { id: "COMPLETE", label: "COMPLETE", description: "Final mass and energy balance calculated" },
];
function Gauge({ label, value, max, unit, icon: Icon }: { label: string; value: number; max: number; unit: string; icon: typeof Wind }) { const percent = Math.max(0, Math.min(100, value / Math.max(max, .001) * 100)); return <div className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4"><div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400"><Icon className="h-4 w-4 text-cyan-400" />{label}</div><div className="flex items-end justify-between"><div className="font-mono text-2xl font-bold text-cyan-300">{value.toFixed(1)}</div><div className="text-xs text-slate-500">{unit}</div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${percent}%` }} /></div></div>; }
function machineLabel(on: boolean, active: string, standby = "STANDBY") { return on ? active : standby; }
export function ProcessSimulator({ experimentId, onExit, onComplete }: ProcessSimulatorProps) {
  const experimentQuery = trpc.experiments.get.useQuery(experimentId);
  const closedLoopMutation = trpc.closedLoop.run.useMutation();
  const [frames, setFrames] = useState<Frame[]>([]); const [timeline, setTimeline] = useState<MachineState[]>([]); const [cursor, setCursor] = useState(0); const [running, setRunning] = useState(false); const [paused, setPaused] = useState(false); const [alarm, setAlarm] = useState<string | null>(null); const [completed, setCompleted] = useState(false); const timerRef = useRef<number | null>(null);
  const current = frames[cursor] ?? { timestamp: 0, pressure: 1013.25, temperature: 25, yieldPercentage: 0, waterRemoved: 0, oilRecovered: 0, energyConsumed: 0, efficiency: 0 }; const machine = timeline[cursor]; const activeStage = machine?.stage ?? "PRE_FLIGHT"; const stageIndex = STAGES.findIndex(s => s.id === activeStage);
  const recentFrames = useMemo(() => frames.slice(Math.max(0, cursor - 80), cursor + 1), [frames, cursor]);
  useEffect(() => { if (!running || paused || !frames.length) return; timerRef.current = window.setInterval(() => setCursor(v => { if (v >= frames.length - 1) { setRunning(false); setCompleted(true); onComplete?.(); return v; } return v + 1; }), 80); return () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); }; }, [running, paused, frames.length, onComplete]);
  useEffect(() => () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); }, []);
  const startSimulation = async () => {
    if (!experimentQuery.data) return;
    setAlarm(null); setCompleted(false); setCursor(0);
    const experiment = experimentQuery.data; const p = experiment.inputParameters as Record<string, unknown>;
    try {
      const result = await closedLoopMutation.mutateAsync({
        experimentId,
        materialWeight: Number(p.materialWeight),
        waterContent: Number(p.waterContent),
        oilContent: Number(p.oilContent),
        targetPressure: Number(p.targetPressure),
        targetTemperature: Number(p.targetTemperature),
        dtSeconds: 1,
        maxSteps: Math.min(100000, Math.max(1, Math.ceil(Number(p.duration) * 3600))),
      });
      const mappedFrames: Frame[] = result.frames.map((frame) => ({
        timestamp: frame.timestampSeconds,
        pressure: frame.sensorAfter.pressureMbar,
        temperature: frame.sensorAfter.temperatureC,
        yieldPercentage: frame.sensorAfter.yieldPercent,
        waterRemoved: frame.sensorAfter.waterRemovedKg,
        oilRecovered: frame.sensorAfter.oilRecoveredKg,
        energyConsumed: frame.sensorAfter.energyKwh,
        efficiency: frame.sensorAfter.yieldPercent,
      }));
      const mappedTimeline: MachineState[] = result.frames.map((frame) => ({
        stage: frame.controller.stage,
        progress: frame.controller.progress,
        elapsedSeconds: frame.controller.elapsedSeconds,
        sensors: { pressureMbar: frame.sensorAfter.pressureMbar, temperatureC: frame.sensorAfter.temperatureC },
        commands: frame.controller.commands,
        interlocks: frame.controller.interlocks,
        alarm: frame.controller.alarm,
        transitionReason: frame.controller.transitionReason,
      }));
      setFrames(mappedFrames); setTimeline(mappedTimeline); setRunning(mappedFrames.length > 0); setPaused(false);
      if (result.status === "FAULT") setAlarm(result.frames.at(-1)?.controller.alarm ?? "CLOSED-LOOP SAFETY FAULT");
      toast.success("Closed-loop causal simulation loaded");
    } catch (error) {
      console.error(error); setAlarm("CLOSED-LOOP ENGINE ERROR — PROCESS NOT STARTED"); toast.error("Closed-loop simulation failed");
    }
  };
  const reset = () => { setRunning(false); setPaused(false); setCompleted(false); setCursor(0); setFrames([]); setTimeline([]); setAlarm(null); };
  const chartPoints = recentFrames.map((f, i) => { const x = recentFrames.length <= 1 ? 0 : i / (recentFrames.length - 1) * 100; const y = 100 - Math.min(100, f.temperature / 150 * 100); return `${x},${y}`; }).join(" ");
  const stateAlarm = machine?.alarm ?? alarm; const stageProgress = machine?.progress ?? 0;
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-4 text-slate-100 md:p-6"><div className="mx-auto max-w-[1500px] space-y-4">
    <header className="flex flex-col gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 backdrop-blur md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${running && !paused ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`} /><span className="font-mono text-xs tracking-[0.35em] text-cyan-400">IUVFES // DIGITAL TWIN CONTROL SYSTEM</span></div><h1 className="mt-2 text-2xl font-bold tracking-wide md:text-3xl">PROCESS SIMULATION CONTROL ROOM</h1><p className="font-mono text-xs text-slate-500">EXPERIMENT {experimentId}</p></div><div className="flex gap-2"><Button onClick={startSimulation} disabled={closedLoopMutation.isPending || running} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Play className="mr-2 h-4 w-4" />START</Button><Button onClick={() => setPaused(v => !v)} disabled={!running} variant="outline" className="border-yellow-500/40 bg-transparent text-yellow-300"><Pause className="mr-2 h-4 w-4" />{paused ? "RESUME" : "PAUSE"}</Button><Button onClick={reset} variant="outline" className="border-red-500/30 bg-transparent text-red-300"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button><Button onClick={onExit} variant="outline" className="border-slate-700 bg-transparent text-slate-300"><Square className="mr-2 h-4 w-4" />EXIT</Button></div></header>
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-slate-500">Controller state</p><h2 className={`text-xl font-semibold ${activeStage === "FAULT" ? "text-red-300" : "text-cyan-300"}`}>{STAGES.find(s => s.id === activeStage)?.label ?? activeStage}</h2></div><div className="font-mono text-xs text-slate-500">{Math.round(stageProgress * 100)}% CONTROLLER PROGRESS</div></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{STAGES.map((item, index) => <div key={item.id} className={`rounded-lg border p-3 transition-all ${index === stageIndex ? "border-cyan-400/70 bg-cyan-400/10" : index < stageIndex ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800 bg-slate-900/40"}`}><div className="mb-2 flex items-center justify-between">{index < stageIndex ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : index === stageIndex ? <CircleGauge className="h-4 w-4 animate-pulse text-cyan-400" /> : <div className="h-4 w-4 rounded-full border border-slate-700" />}<span className="font-mono text-[10px] text-slate-600">0{index + 1}</span></div><div className="text-[11px] font-semibold tracking-wider">{item.label}</div></div>)}</div><p className="mt-3 text-sm text-slate-400">{machine?.transitionReason ?? STAGES[stageIndex]?.description}</p></section>
    {stateAlarm && <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"><AlertTriangle className="h-5 w-5" />{stateAlarm}</div>}
    <div className="grid gap-4 lg:grid-cols-4"><Gauge label="CHAMBER PRESSURE" value={current.pressure} max={1013.25} unit="mbar" icon={Wind} /><Gauge label="PROCESS TEMPERATURE" value={current.temperature} max={150} unit="°C" icon={Thermometer} /><Gauge label="RECOVERY YIELD" value={current.yieldPercentage} max={100} unit="%" icon={CircleGauge} /><Gauge label="ENERGY LOAD" value={current.energyConsumed} max={10} unit="kWh" icon={Zap} /></div>
    <ProcessMachine3D machine={machine} />
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold tracking-wider text-cyan-300">LIVE PROCESS TREND</h3><span className="font-mono text-xs text-slate-500">T: {current.timestamp}s</span></div><div className="relative h-64 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />{chartPoints && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chartPoints} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>}<div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">TEMPERATURE PROFILE</div></div></section>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><h3 className="mb-4 font-semibold tracking-wider text-cyan-300">MACHINE STATE</h3><div className="space-y-3 font-mono text-xs">{[["VACUUM PUMP", machineLabel(machine?.commands.vacuumPump ?? false, "ACTIVE", "OFF")],["HEATER", machineLabel(machine?.commands.heater ?? false, "ACTIVE", "OFF")],["EXTRACTOR", machineLabel(machine?.commands.extractor ?? false, "ACTIVE", "OFF")],["CONDENSER", machineLabel(machine?.commands.condenser ?? false, "ACTIVE", "OFF")],["COOLING", machineLabel(machine?.commands.cooling ?? false, "ACTIVE", "OFF")],["VACUUM INTERLOCK", machine?.interlocks.vacuumAchieved ? "PASS" : "WAITING"],["THERMAL INTERLOCK", machine?.interlocks.overTemperature ? "TRIPPED" : "SAFE"],["MASS BALANCE", `${current.oilRecovered.toFixed(3)} kg oil / ${current.waterRemoved.toFixed(3)} kg water`]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span className="text-slate-500">{label}</span><span className={value === "ACTIVE" || value === "PASS" || value === "SAFE" ? "text-emerald-300" : value === "TRIPPED" ? "text-red-300" : "text-cyan-300"}>{value}</span></div>)}</div></section></div>
    <ProcessEventTimeline timeline={timeline} />
    <ScientificRunRecorder experimentId={experimentId} frames={frames} completed={completed} />
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="grid gap-3 md:grid-cols-4"><div><span className="text-xs text-slate-500">OIL RECOVERED</span><div className="font-mono text-xl text-amber-300">{current.oilRecovered.toFixed(3)} kg</div></div><div><span className="text-xs text-slate-500">WATER REMOVED</span><div className="font-mono text-xl text-blue-300">{current.waterRemoved.toFixed(3)} kg</div></div><div><span className="text-xs text-slate-500">EFFICIENCY</span><div className="font-mono text-xl text-emerald-300">{current.efficiency.toFixed(2)}%</div></div><div><span className="text-xs text-slate-500">DATA FRAME</span><div className="font-mono text-xl text-cyan-300">{frames.length ? `${cursor + 1}/${frames.length}` : "READY"}</div></div></div></section>
  </div></div>;
}
