import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Activity, AlertTriangle, CheckCircle2, CircleGauge, Droplets, FileText, Gauge, Pause, Play, Radio, RotateCcw, ShieldCheck, Snowflake, Square, Thermometer, Wind, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ProcessMachine3D } from "@/components/ProcessMachine3D";
import { ProcessEventTimeline } from "@/components/ProcessEventTimeline";
import { ScientificRunRecorder } from "@/components/ScientificRunRecorder";
import { LiveProcessTrend } from "@/components/LiveProcessTrend";
import { CausalFrameInspector } from "@/components/CausalFrameInspector";
import { ProcessRunReplay } from "@/components/ProcessRunReplay";
import { ControlRoomObservabilityPanel } from "@/components/ControlRoomObservabilityPanel";
import { WhyThisValue, type WhyThisValueProps } from "@/components/WhyThisValue";
import { InstrumentRegistry } from "@/components/InstrumentRegistry";
import { LaboratoryEvidenceCenter } from "@/components/LaboratoryEvidenceCenter";
import { ExperimentalComparisonCenter } from "@/components/ExperimentalComparisonCenter";
import { recordControlRoomEvent, toFrameReference, toOperatorReference } from "@/lib/controlRoomObservability";
import { useAuth } from "@/_core/hooks/useAuth";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { Link } from "wouter";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Frame = RouterOutputs["closedLoop"]["frames"]["frames"][number];
type NumericInput = number | undefined;

const metricTone = {
  cyan: "text-cyan-300 border-cyan-500/20",
  sky: "text-sky-300 border-sky-500/20",
  amber: "text-amber-300 border-amber-500/20",
  emerald: "text-emerald-300 border-emerald-500/20",
} as const;

function numberValue(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function format(value: unknown, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function ControlSlider({ label, value, min, max, step, unit, Icon, onChange, onApply, disabled }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  Icon: ComponentType<{ className?: string }>;
  onChange: (value: number) => void;
  onApply: () => void;
  disabled?: boolean;
}) {
  return <label className="block rounded-lg border border-slate-800 bg-slate-950/60 p-3">
    <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-slate-500"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-cyan-400" />{label}</span><span className="font-mono text-cyan-300">{value.toFixed(step < 1 ? 1 : 0)} {unit}</span></span>
    <input disabled={disabled} className="mt-3 w-full accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-35" type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} onPointerUp={onApply} />
    <span className="mt-1 flex justify-between font-mono text-[8px] text-slate-700"><span>{min}</span><span>{max}</span></span>
  </label>;
}

function Instrument({ label, value, unit, tone = "cyan", source = "CAUSAL FRAME", why }: { label: string; value: string; unit: string; tone?: keyof typeof metricTone; source?: string; why?: WhyThisValueProps }) {
  return <div className={`border-l bg-slate-950/65 px-3 py-2 ${metricTone[tone]}`}>
    <div className="text-[8px] font-medium tracking-[0.18em] text-slate-500">{label}</div>
    <div className="mt-1 flex items-end gap-1 font-mono"><span className="text-lg leading-none">{value}</span><span className="text-[9px] text-slate-500">{unit}</span></div>
    <div className="mt-1 text-[7px] tracking-[0.12em] text-slate-600">{source}</div>
    {why ? <WhyThisValue {...why} /> : null}
  </div>;
}

function DetailLine({ label, value, tone = "text-slate-200" }: { label: string; value: string; tone?: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-2 font-mono text-[10px] last:border-0"><span className="text-slate-500">{label}</span><span className={`text-right ${tone}`}>{value}</span></div>;
}

function ProgressRing({ progress }: { progress: number }) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  return <div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(rgb(34 211 238) ${safeProgress * 3.6}deg, rgb(15 23 42) 0deg)` }}>
    <div className="grid h-[92px] w-[92px] place-items-center rounded-full border border-cyan-500/20 bg-slate-950 text-center"><span className="font-mono text-2xl text-cyan-200">{Math.round(safeProgress)}%</span><span className="text-[8px] tracking-[0.16em] text-slate-500">ENGINE PROGRESS</span></div>
  </div>;
}

export function ProcessSimulator({ experimentId, onExit, onComplete }: { experimentId: string; onExit?: () => void; onComplete?: () => void }) {
  const auth = useAuth();
  const experiment = trpc.experiments.get.useQuery(experimentId);
  const create = trpc.closedLoop.create.useMutation();
  const start = trpc.closedLoop.start.useMutation();
  const step = trpc.closedLoop.step.useMutation();
  const control = trpc.closedLoop.control.useMutation();
  const pause = trpc.closedLoop.pause.useMutation();
  const resume = trpc.closedLoop.resume.useMutation();
  const stop = trpc.closedLoop.stop.useMutation();
  const reset = trpc.closedLoop.reset.useMutation();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [focusedInstrumentId, setFocusedInstrumentId] = useState<string | undefined>(undefined);
  const [replayMode, setReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [temperature, setTemperature] = useState(62);
  const [pressure, setPressure] = useState(20);
  const [cooling, setCooling] = useState(35);
  const [heaterLimit, setHeaterLimit] = useState(1);
  const [pumpLimit, setPumpLimit] = useState(1);
  const [condenserLimit, setCondenserLimit] = useState(1);
  const [coolingLimit, setCoolingLimit] = useState(1);

  const recoveredSession = trpc.closedLoop.getForExperiment.useQuery(experimentId, { enabled: Boolean(experimentId), refetchInterval: sessionId ? false : 2000 });
  const session = trpc.closedLoop.get.useQuery(sessionId ?? "", { enabled: Boolean(sessionId), refetchInterval: sessionId ? 1000 : false });
  const sessionFrames = trpc.closedLoop.frames.useQuery(sessionId ?? "", { enabled: Boolean(sessionId), refetchInterval: sessionId ? 1000 : false });
  const busy = useRef(false);
  const timer = useRef<number | null>(null);
  const lastObservedFrameStep = useRef<number | null>(null);
  const experimentEventRecorded = useRef(false);
  const scientificOutputRef = useRef<HTMLDivElement | null>(null);
  const clearTimer = () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; };

  useEffect(() => () => clearTimer(), []);
  useEffect(() => {
    recordControlRoomEvent({ event: "CONTROL_ROOM_OPEN", result: "INFO", operator: toOperatorReference(auth.user), experimentId });
  }, [experimentId]);
  useEffect(() => {
    if (experiment.data && !experimentEventRecorded.current) {
      experimentEventRecorded.current = true;
      recordControlRoomEvent({ event: "EXPERIMENT_OPEN", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId });
    }
    if (experiment.error) recordControlRoomEvent({ event: "SESSION_ERROR", result: "ERROR", operator: toOperatorReference(auth.user), experimentId, detail: { source: "experiments.get", message: experiment.error.message } });
  }, [auth.user, experiment.data, experiment.error, experimentId]);
  useEffect(() => {
    const parameters = experiment.data?.inputParameters as Record<string, unknown> | undefined;
    if (!parameters) return;
    setTemperature(previous => numberValue(parameters.targetTemperature) ?? previous);
    setPressure(previous => numberValue(parameters.targetPressure) ?? previous);
    setCooling(previous => numberValue(parameters.coolingTemperature) ?? previous);
  }, [experiment.data]);
  useEffect(() => {
    const recovered = recoveredSession.data;
    if (!recovered || sessionId) return;
    recordControlRoomEvent({ event: "SESSION_RECOVER", result: "INFO", operator: toOperatorReference(auth.user), experimentId, sessionId: recovered.sessionId });
    setSessionId(recovered.sessionId);
    setRunning(recovered.status === "running");
    setPaused(recovered.status === "paused");
    setCompleted(recovered.status === "completed");
  }, [recoveredSession.data, sessionId]);
  useEffect(() => {
    const persisted = sessionFrames.data?.frames as Frame[] | undefined;
    if (!persisted) return;
    setFrames(previous => persisted.length >= previous.length ? persisted : previous);
    const frame = persisted.at(-1);
    if (frame && frame.step !== lastObservedFrameStep.current) {
      lastObservedFrameStep.current = frame.step;
      recordControlRoomEvent({ event: "FRAME_RECEIVED", result: "INFO", operator: toOperatorReference(auth.user), experimentId, sessionId: sessionId ?? undefined, frameRef: toFrameReference(frame) });
    }
  }, [sessionFrames.data]);
  useEffect(() => {
    if (!recoveredSession.error) return;
    recordControlRoomEvent({ event: "SESSION_ERROR", result: "ERROR", operator: toOperatorReference(auth.user), experimentId, detail: { source: "closedLoop.getForExperiment", message: recoveredSession.error.message } });
  }, [auth.user, experimentId, recoveredSession.error]);
  useEffect(() => {
    const status = session.data?.status;
    if (!status) return;
    const terminal = status === "completed" || status === "fault" || status === "stopped";
    if (terminal) { clearTimer(); setRunning(false); setPaused(false); setCompleted(status === "completed"); }
    else if (status === "paused") { clearTimer(); setRunning(false); setPaused(true); }
  }, [session.data]);

  const displayIndex = replayMode ? Math.min(replayIndex, Math.max(0, frames.length - 1)) : Math.max(0, frames.length - 1);
  const displayFrame = frames.length ? frames[displayIndex] : undefined;
  const sensor = displayFrame?.sensorAfter;
  const state = displayFrame?.controller;
  const safety = displayFrame?.safety;
  const hardware = displayFrame?.hardwareDiagnostics;
  const material = displayFrame?.materialInventory;
  const recent = useMemo(() => replayMode ? frames.slice(0, displayIndex + 1).slice(-80) : frames.slice(-80), [frames, replayMode, displayIndex]);
  const replayFrames = useMemo(() => replayMode ? frames.slice(0, displayIndex + 1) : frames, [frames, replayMode, displayIndex]);
  const operatorInputs = (experiment.data?.inputParameters ?? {}) as Record<string, unknown>;
  const engineProgress = Math.max(0, Math.min(100, (state?.progress ?? 0) * 100));
  const runtimeStatus = replayMode ? "REPLAY" : session.data?.status?.toUpperCase() ?? (running ? "RUNNING" : paused ? "PAUSED" : completed ? "COMPLETED" : "READY");
  const statusTone = runtimeStatus === "RUNNING" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" : runtimeStatus === "PAUSED" || runtimeStatus === "REPLAY" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : runtimeStatus === "FAULT" ? "text-red-300 border-red-500/30 bg-red-500/10" : "text-cyan-300 border-cyan-500/30 bg-cyan-500/10";
  const disabled = !running || replayMode;

  const onReplayFrame = useCallback((frame: Frame | undefined, index: number) => { if (!frame) return; setReplayMode(true); setReplayIndex(index); recordControlRoomEvent({ event: "REPLAY_OPEN", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId: sessionId ?? undefined, frameRef: toFrameReference(frame) }); }, [auth.user, experimentId, sessionId]);
  const onMachineObservabilityEvent = useCallback((event: Parameters<NonNullable<Parameters<typeof ProcessMachine3D>[0]["onObservabilityEvent"]>>[0]) => {
    recordControlRoomEvent({ ...event, operator: toOperatorReference(auth.user), experimentId, sessionId: sessionId ?? undefined });
  }, [auth.user, experimentId, sessionId]);
  const onMachineInstrumentFocus = useCallback((instrumentId: string | undefined) => {
    setFocusedInstrumentId(previous => previous === instrumentId ? previous : instrumentId);
  }, []);
  const oneStep = async (id: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await step.mutateAsync(id);
      if (!result.frame) return;
      const frame = result.frame as Frame;
      setFrames(previous => [...previous, frame]);
      setReplayMode(false);
      if (frame.safety.stage === "COMPLETE") { setRunning(false); setCompleted(true); clearTimer(); onComplete?.(); }
      if (frame.safety.stage === "FAULT") { setRunning(false); clearTimer(); toast.error(frame.safety.alarm ?? "Safety fault"); }
    } catch (error) {
      console.error(error);
      setRunning(false);
      clearTimer();
      toast.error("Live step failed");
    } finally { busy.current = false; }
  };

  useEffect(() => {
    clearTimer();
    if (!running || paused || !sessionId) return;
    timer.current = window.setInterval(() => void oneStep(sessionId), 1000);
    return clearTimer;
  }, [running, paused, sessionId]);

  const startSimulation = async () => {
    if (!experiment.data) return;
    const parameters = experiment.data.inputParameters as Record<string, unknown>;
    try {
      recordControlRoomEvent({ event: "PLAY", result: "INFO", operator: toOperatorReference(auth.user), experimentId });
      clearTimer();
      setFrames([]);
      setReplayMode(false);
      setReplayIndex(0);
      setCompleted(false);
      setPaused(false);
      const durationHours = Number(parameters.duration);
      const maxSteps = Math.max(1, Math.min(100000, Math.ceil(Number.isFinite(durationHours) && durationHours > 0 ? durationHours * 3600 : 300)));
      const created = await create.mutateAsync({
        experimentId,
        materialWeight: Number(parameters.materialWeight),
        waterContent: Number(parameters.waterContent),
        oilContent: Number(parameters.oilContent),
        targetPressure: pressure,
        targetTemperature: temperature,
        coolingTemperature: cooling,
        dtSeconds: 1,
        maxSteps,
        ultrasonicFrequency: numberValue(parameters.ultrasonicFrequency),
        ultrasonicPowerW: numberValue(parameters.ultrasonicPowerW ?? parameters.ultrasonicPower),
        ultrasonicDutyCyclePercent: numberValue(parameters.ultrasonicDutyCyclePercent ?? parameters.ultrasonicDuty),
        ultrasonicMaxPowerW: numberValue(parameters.ultrasonicMaxPowerW),
      });
      await start.mutateAsync(created.sessionId);
      setSessionId(created.sessionId);
      setRunning(true);
      await oneStep(created.sessionId);
      recordControlRoomEvent({ event: "PLAY", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId: created.sessionId });
      toast.success("Closed-loop engine connected");
    } catch (error) { recordControlRoomEvent({ event: "PLAY", result: "FAILURE", operator: toOperatorReference(auth.user), experimentId, detail: { message: error instanceof Error ? error.message : String(error) } }); console.error(error); toast.error("Could not start closed-loop controller"); }
  };

  const apply = async () => {
    if (!sessionId) return;
    try {
      recordControlRoomEvent({ event: "CONTROL_APPLY", result: "INFO", operator: toOperatorReference(auth.user), experimentId, sessionId });
      const view = await control.mutateAsync({ sessionId, targetPressureMbar: pressure, targetTemperatureC: temperature, coolingTemperatureC: cooling, heaterMax: heaterLimit, vacuumPumpMax: pumpLimit, condenserMax: condenserLimit, coolingMax: coolingLimit, operatorNotes: "Operator live controller adjustment." });
      setTemperature(view.targets.targetTemperatureC);
      setPressure(view.targets.targetPressureMbar);
      setCooling(view.targets.coolingTemperatureC);
      setHeaterLimit(view.operatorLimits.heaterMax);
      setPumpLimit(view.operatorLimits.vacuumPumpMax);
      setCondenserLimit(view.operatorLimits.condenserMax);
      setCoolingLimit(view.operatorLimits.coolingMax);
      recordControlRoomEvent({ event: "CONTROL_APPLY", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId });
      toast.success("Controller settings applied");
    } catch (error) { recordControlRoomEvent({ event: "CONTROL_APPLY", result: "FAILURE", operator: toOperatorReference(auth.user), experimentId, sessionId, detail: { message: error instanceof Error ? error.message : String(error) } }); toast.error("Controller setting rejected"); }
  };

  const doPause = async () => { if (!sessionId) return; try { await pause.mutateAsync(sessionId); clearTimer(); setPaused(true); setRunning(false); recordControlRoomEvent({ event: "PAUSE", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId }); } catch (error) { recordControlRoomEvent({ event: "PAUSE", result: "FAILURE", operator: toOperatorReference(auth.user), experimentId, sessionId, detail: { message: error instanceof Error ? error.message : String(error) } }); toast.error("Pause rejected"); } };
  const doResume = async () => { if (!sessionId) return; try { await resume.mutateAsync(sessionId); setPaused(false); setRunning(true); setReplayMode(false); recordControlRoomEvent({ event: "RESUME", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId }); } catch (error) { recordControlRoomEvent({ event: "RESUME", result: "FAILURE", operator: toOperatorReference(auth.user), experimentId, sessionId, detail: { message: error instanceof Error ? error.message : String(error) } }); toast.error("Resume rejected"); } };
  const doStop = async () => { if (!sessionId) return; try { await stop.mutateAsync(sessionId); clearTimer(); setRunning(false); setPaused(false); recordControlRoomEvent({ event: "STOP", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId }); } catch (error) { recordControlRoomEvent({ event: "STOP", result: "FAILURE", operator: toOperatorReference(auth.user), experimentId, sessionId, detail: { message: error instanceof Error ? error.message : String(error) } }); toast.error("Stop rejected"); } };
  const doReset = async () => { clearTimer(); if (sessionId) try { await reset.mutateAsync(sessionId); recordControlRoomEvent({ event: "RESET", result: "SUCCESS", operator: toOperatorReference(auth.user), experimentId, sessionId }); } catch (error) { recordControlRoomEvent({ event: "RESET", result: "FAILURE", operator: toOperatorReference(auth.user), experimentId, sessionId, detail: { message: error instanceof Error ? error.message : String(error) } }); toast.error("Reset rejected"); } setSessionId(null); setFrames([]); setReplayMode(false); setReplayIndex(0); setRunning(false); setPaused(false); setCompleted(false); };

  return <div className="min-h-screen bg-[#020712] text-slate-100">
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-12%,#123a54_0%,#06111d_35%,#020712_72%)] px-3 py-3 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1660px] space-y-3">
        <header className="grid gap-3 border-y border-cyan-500/25 bg-slate-950/80 px-4 py-3 backdrop-blur xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <div><div className="font-mono text-[9px] tracking-[0.32em] text-cyan-400">IUVFES // INTEGRATED ULTRASONIC VACUUM FRYING EXTRACTION SYSTEM</div><h1 className="mt-1 text-xl font-semibold tracking-[0.08em] text-slate-100">PROCESS SIMULATOR</h1><p className="mt-1 text-[9px] tracking-[0.2em] text-slate-500">LIVE PROCESS VISUALIZATION · ENGINE-BACKED CAUSAL TELEMETRY</p></div>
          <div className="text-center"><div className="font-mono text-[9px] tracking-[0.16em] text-slate-500">EXPERIMENT / RUN</div><div className="mt-1 font-mono text-sm text-cyan-200">{experimentId}</div><div className="mt-1 text-[8px] tracking-[0.14em] text-slate-600">{sessionId ? `SESSION ${sessionId.slice(0, 8)}` : "NO ACTIVE SESSION"}</div></div>
          <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end"><span className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-[10px] tracking-[0.14em] ${statusTone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{runtimeStatus}</span><span className="border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[10px] text-slate-400">T+{format(displayFrame?.timestampSeconds, 1)} s</span><span className="border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[10px] text-slate-400">{frames.length} FRAMES</span><Link href="/knowledge"><span className="inline-flex cursor-pointer border border-cyan-500/30 px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-500/10">KNOWLEDGE CENTER</span></Link></div>
        </header>

        <section className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="space-y-3 border border-slate-800 bg-slate-950/70 p-3 backdrop-blur">
            <div className="border-b border-slate-800 pb-3"><div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-cyan-300"><Gauge className="h-3.5 w-3.5" />OPERATOR CONTROL</div><p className="mt-1 text-[9px] leading-relaxed text-slate-500">Operator inputs become engine targets and limits. They are never live sensor readings.</p></div>
            <ControlSlider label="TARGET TEMPERATURE" value={temperature} min={30} max={100} step={0.5} unit="°C" Icon={Thermometer} onChange={setTemperature} onApply={() => void apply()} disabled={disabled} />
            <ControlSlider label="TARGET VACUUM" value={pressure} min={5} max={500} step={1} unit="mbar" Icon={Wind} onChange={setPressure} onApply={() => void apply()} disabled={disabled} />
            <ControlSlider label="COOL-DOWN TARGET" value={cooling} min={25} max={70} step={0.5} unit="°C" Icon={Snowflake} onChange={setCooling} onApply={() => void apply()} disabled={disabled} />
            <div className="grid grid-cols-2 gap-2"><ControlSlider label="HEATER LIMIT" value={heaterLimit * 100} min={0} max={100} step={1} unit="%" Icon={Zap} onChange={value => setHeaterLimit(value / 100)} onApply={() => void apply()} disabled={disabled} /><ControlSlider label="PUMP LIMIT" value={pumpLimit * 100} min={0} max={100} step={1} unit="%" Icon={Wind} onChange={value => setPumpLimit(value / 100)} onApply={() => void apply()} disabled={disabled} /></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3"><div className="mb-2 text-[9px] tracking-[0.18em] text-slate-500">EXPERIMENT INPUT</div><DetailLine label="MATERIAL" value={String(experiment.data?.materialId ?? "UNKNOWN")} /><DetailLine label="MASS" value={`${format(numberValue(operatorInputs.materialWeight), 2)} kg`} /><DetailLine label="WATER CONTENT" value={`${format(numberValue(operatorInputs.waterContent), 2)} %`} /><DetailLine label="OIL CONTENT" value={`${format(numberValue(operatorInputs.oilContent), 2)} %`} /></div>
            <div className="grid grid-cols-2 gap-2"><Button onClick={() => void startSimulation()} disabled={running || paused || create.isPending || start.isPending} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"><Play className="mr-1 h-3.5 w-3.5" />START</Button><Button onClick={() => void (paused ? doResume() : doPause())} disabled={!running && !paused} variant="outline" className="border-amber-500/40 text-amber-300">{paused ? <Play className="mr-1 h-3.5 w-3.5" /> : <Pause className="mr-1 h-3.5 w-3.5" />}{paused ? "RESUME" : "PAUSE"}</Button><Button onClick={() => void doStop()} disabled={!sessionId} variant="outline" className="border-red-500/40 text-red-300"><Square className="mr-1 h-3.5 w-3.5" />STOP</Button><Button onClick={() => void doReset()} variant="outline" className="border-slate-700 text-slate-300"><RotateCcw className="mr-1 h-3.5 w-3.5" />RESET</Button></div>
          </aside>

          <main className="min-w-0 space-y-3">
            <section className="border border-cyan-500/25 bg-slate-950/70 p-3 shadow-[0_0_55px_rgba(14,116,144,0.12)]"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><div className="text-[9px] tracking-[0.24em] text-cyan-300">PROCESS TWIN</div><h2 className="mt-1 text-lg font-semibold tracking-wide">REACTOR → VAPOR → MULTI-STAGE CONDENSATION → RECOVERY</h2></div><div className="flex items-center gap-3"><ProgressRing progress={engineProgress} /><div className="font-mono text-[10px]"><div className="text-slate-500">ENGINE STAGE</div><div className="mt-1 text-cyan-200">{state?.stage ?? "WAITING"}</div><div className="mt-1 max-w-[220px] text-[9px] text-slate-500">{safety?.transitionReason ?? "Waiting for the first CausalFrame."}</div></div></div></div><ProcessMachine3D frame={displayFrame} onObservabilityEvent={onMachineObservabilityEvent} onInstrumentFocus={onMachineInstrumentFocus} /></section>
            <section className="grid divide-x divide-slate-800 border border-slate-800 bg-slate-950/65 sm:grid-cols-3 xl:grid-cols-6"><Instrument label="TEMPERATURE" value={format(sensor?.temperatureC, 1)} unit="°C" why={{ source: "CausalFrame", field: "sensorAfter.temperatureC", classification: "SIMULATION", meaning: "Active-frame temperature presented by the Control Room.", notMeaning: "A laboratory measurement unless a separate MEASURED dataset says so.", frameLabel: displayFrame ? `Frame #${displayFrame.step} at ${format(displayFrame.timestampSeconds, 1)} s` : "UNKNOWN — no active frame" }} /><Instrument label="PRESSURE" value={format(sensor?.pressureMbar, 1)} unit="mbar" tone="sky" why={{ source: "CausalFrame", field: "sensorAfter.pressureMbar", classification: "SIMULATION", meaning: "Active-frame pressure presented by the Control Room.", notMeaning: "A laboratory measurement unless a separate MEASURED dataset says so.", frameLabel: displayFrame ? `Frame #${displayFrame.step} at ${format(displayFrame.timestampSeconds, 1)} s` : "UNKNOWN — no active frame" }} /><Instrument label="YIELD" value={format(sensor?.yieldPercent, 2)} unit="%" tone="emerald" /><Instrument label="OIL RECOVERED" value={format(sensor?.oilRecoveredKg, 3)} unit="kg" tone="amber" /><Instrument label="WATER REMOVED" value={format(sensor?.waterRemovedKg, 3)} unit="kg" tone="sky" /><Instrument label="ENERGY" value={format(sensor?.energyKwh, 3)} unit="kWh" tone="amber" /></section>
          </main>

          <aside className="space-y-3 border border-slate-800 bg-slate-950/70 p-3 backdrop-blur">
            <section><div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-[9px] tracking-[0.2em] text-sky-300"><Snowflake className="h-3.5 w-3.5" />COLD TRAP DIAGNOSTICS</div><div className="mt-2 grid grid-cols-2 gap-2">{[0, 1, 2, 3].map(index => <div key={index} className="border border-slate-800 bg-slate-950/80 p-2"><div className="text-[8px] tracking-[0.16em] text-slate-500">TRAP {index + 1}</div><div className="mt-1 font-mono text-sm text-sky-200">{format(hardware?.coldTrapTemperaturesC?.[index], 1)} °C</div><div className="mt-1 text-[8px] text-slate-600">CONDENSED {format(hardware?.coldTrapStageCondensedWaterKg?.[index], 3)} kg</div><div className="mt-1 text-[7px] tracking-[0.12em] text-slate-700">MODEL DIAGNOSTIC</div></div>)}</div></section>
            <section className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-cyan-300"><Wind className="h-3.5 w-3.5" />VACUUM & ULTRASONIC</div><div className="mt-2"><DetailLine label="VACUUM OUTPUT" value={`${format(typeof displayFrame?.controlOutput.vacuumPumpPower === "number" ? displayFrame.controlOutput.vacuumPumpPower * 100 : undefined, 1)} %`} /><DetailLine label="EFFECTIVE PUMP" value={`${format(hardware?.effectivePumpCapacityM3h, 1)} m³/h`} /><DetailLine label="CONDUCTANCE" value={`${format(hardware?.vacuumConductanceM3h, 3)} m³/h`} /><DetailLine label="ULTRASONIC FREQ." value={`${format(displayFrame?.ultrasonic.frequencyKHz, 1)} kHz`} /><DetailLine label="ULTRASONIC POWER" value={`${format(displayFrame?.ultrasonic.effectivePowerW, 1)} W`} /></div></section>
            <section className={`border p-3 ${safety?.allSystemsSafe ? "border-emerald-500/25 bg-emerald-500/5" : "border-red-500/30 bg-red-500/10"}`}><div className="flex items-center gap-2 text-[9px] tracking-[0.2em]"><ShieldCheck className={`h-3.5 w-3.5 ${safety?.allSystemsSafe ? "text-emerald-300" : "text-red-300"}`} />SAFETY / INTERLOCK</div><div className={`mt-2 font-mono text-sm ${safety?.allSystemsSafe ? "text-emerald-300" : "text-red-300"}`}>{safety?.allSystemsSafe ? "SYSTEM SAFE" : safety?.alarm ?? "CHECK SAFETY"}</div><div className="mt-2 grid grid-cols-2 gap-x-3 text-[8px] text-slate-500"><span>VACUUM {safety?.vacuumAchieved ? "PASS" : "WAIT"}</span><span>THERMAL {safety?.overTemperature ? "TRIPPED" : "SAFE"}</span></div></section>
            <section className="border border-slate-800 bg-slate-950/80 p-3"><div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-violet-300"><Radio className="h-3.5 w-3.5" />DATA PROVENANCE</div><div className="mt-2"><DetailLine label="PRIMARY SOURCE" value="SIMULATION" tone="text-violet-200" /><DetailLine label="FRAME ORIGIN" value="CLOSED-LOOP ENGINE" tone="text-violet-200" /><DetailLine label="LAB VALIDATION" value="NOT AVAILABLE" tone="text-amber-300" /><DetailLine label="FRAME" value={displayFrame ? `#${displayFrame.step}` : "UNKNOWN"} /></div><p className="mt-2 text-[8px] leading-relaxed text-slate-600">Simulation-derived values are not laboratory observations. Missing properties remain UNKNOWN / DATA GAP.</p></section>
          </aside>
        </section>

        <InstrumentRegistry selectedInstrumentId={focusedInstrumentId} />
        <LaboratoryEvidenceCenter />
        <ExperimentalComparisonCenter />

        <section className="grid gap-3 xl:grid-cols-[1.15fr_.85fr]"><LiveProcessTrend frames={recent} /><CausalFrameInspector frames={replayFrames} /></section>
        <ControlRoomObservabilityPanel />
        <section className="grid gap-3 xl:grid-cols-[1fr_.8fr]"><ProcessRunReplay frames={frames} onFrameChange={onReplayFrame} /><section className="border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center justify-between"><div><div className="text-[9px] tracking-[0.2em] text-cyan-300">PROCESS STATE</div><div className="mt-1 text-lg font-semibold">{state?.stage ?? "WAITING"}</div></div><Activity className={`h-7 w-7 ${safety?.allSystemsSafe ? "text-emerald-300" : "text-red-300"}`} /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="border border-slate-800 p-2"><div className="text-[8px] text-slate-600">MATERIAL REMAINING</div><div className="mt-1 font-mono text-xs text-slate-200">{format(material?.remainingMassKg, 3)} kg</div></div><div className="border border-slate-800 p-2"><div className="text-[8px] text-slate-600">WATER REMAINING</div><div className="mt-1 font-mono text-xs text-sky-200">{format(material?.waterRemainingKg, 3)} kg</div></div><div className="border border-slate-800 p-2"><div className="text-[8px] text-slate-600">OIL POTENTIAL</div><div className="mt-1 font-mono text-xs text-amber-200">{format(material?.oilRemainingPotentialKg, 3)} kg</div></div></div><div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500"><Droplets className="h-3.5 w-3.5 text-sky-300" />Mass-inventory values are derived from the active engine frame.</div></section></section>
        <section className="grid gap-3 xl:grid-cols-[.85fr_1.15fr]"><ProcessEventTimeline timeline={replayFrames.map(frame => ({ stage: frame.safety.stage, elapsedSeconds: frame.controller.elapsedSeconds, alarm: frame.safety.alarm, transitionReason: frame.safety.transitionReason, interlocks: { overTemperature: frame.safety.overTemperature, vacuumAchieved: frame.safety.vacuumAchieved, allSystemsSafe: frame.safety.allSystemsSafe } }))} /><section className="border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[9px] tracking-[0.2em] text-emerald-300">SCIENTIFIC OUTPUT</div><p className="mt-1 text-xs text-slate-500">Use the recorder below to preserve run metadata and the causal-frame dataset.</p></div><Button onClick={() => scientificOutputRef.current?.scrollIntoView({ behavior: "smooth" })} disabled={!frames.length} variant="outline" className="border-emerald-500/40 text-emerald-300"><FileText className="mr-2 h-4 w-4" />RESULTS / PRINT</Button></div></section></section>
        <div ref={scientificOutputRef}><ScientificRunRecorder experimentId={experimentId} frames={frames} completed={completed} /></div>
        {onExit && <div className="flex justify-end"><Button onClick={onExit} variant="outline" className="border-slate-700 text-slate-400">EXIT CONTROL ROOM</Button></div>}
      </div>
    </div>
  </div>;
}
