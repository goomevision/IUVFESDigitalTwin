import { useMemo, useState } from "react";

import type { CausalFrame as Frame } from "../../../server/closedLoopSimulation";

function scalar(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(4);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v == null) return "UNKNOWN";
  return String(v);
}

function Group({ title, entries }: { title: string; entries: Array<[string, unknown]> }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-2 text-[9px] tracking-[0.2em] text-slate-500">{title}</div>
      <div className="grid min-w-0 gap-1.5 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="min-w-0 rounded bg-slate-900/60 px-2 py-1.5 font-mono text-[9px]"
          >
            <div className="min-w-0 break-words text-slate-500">{key}</div>
            <div className="min-w-0 break-words text-slate-200">{scalar(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CausalFrameInspector({ frames }: { frames: ReadonlyArray<Frame> }) {
  const [index, setIndex] = useState(-1);
  const [windowSize, setWindowSize] = useState(20);
  const selected = frames.length
    ? frames[Math.max(0, Math.min(index < 0 ? frames.length - 1 : index, frames.length - 1))]
    : undefined;
  const visible = useMemo(() => frames.slice(-windowSize), [frames, windowSize]);
  const selectedPosition = selected ? frames.findIndex(f => f.step === selected.step) : -1;
  const controller = selected?.controller;
  const rows = selected
    ? [
        ["SENSOR BEFORE", `T=${scalar(selected.sensorBefore.temperatureC)} °C · P=${scalar(selected.sensorBefore.pressureMbar)} mbar`],
        ["CONTROLLER", `${controller?.stage ?? "UNKNOWN"} · progress=${(controller?.progress ?? 0).toFixed(2)}%`],
        ["INTENDED ACTUATORS", Object.entries(selected.intendedCommands).filter(([, v]) => v).map(([k]) => k).join(", ") || "NONE"],
        ["EFFECTIVE ACTUATORS", Object.entries(selected.effectiveCommands).filter(([, v]) => v).map(([k]) => k).join(", ") || "NONE"],
        ["CONTROL OUTPUT", `heater=${scalar(selected.controlOutput.heaterPower)} · vacuum=${scalar(selected.controlOutput.vacuumPumpPower)}`],
        ["PHYSICAL SENSOR AFTER", `T=${scalar(selected.physicalSensorAfter.temperatureC)} °C · P=${scalar(selected.physicalSensorAfter.pressureMbar)} mbar`],
        ["OBSERVED SENSOR AFTER", `T=${scalar(selected.sensorAfter.temperatureC)} °C · P=${scalar(selected.sensorAfter.pressureMbar)} mbar`],
        ["SAFETY", selected.safety.allSystemsSafe ? "ALL SYSTEMS SAFE" : (selected.safety.alarm ?? "CHECK SAFETY")],
      ]
    : [];

  return (
    <section className="flex min-h-0 max-h-[720px] min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] tracking-[0.25em] text-slate-500">CAUSAL TRACE</div>
          <h2 className="font-semibold tracking-wider text-cyan-300">FRAME INSPECTOR</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="font-mono text-[9px] text-slate-500">WINDOW</label>
          <select
            value={windowSize}
            onChange={e => setWindowSize(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={80}>80</option>
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        {!selected ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center font-mono text-xs text-slate-600">
            WAITING FOR CAUSAL FRAME
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-slate-900/70 p-3">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                <span className="min-w-0 break-words text-cyan-300">
                  FRAME #{selected.step} · T+{selected.timestampSeconds.toFixed(1)} s
                </span>
                <span className="shrink-0 text-slate-500">{selectedPosition + 1}/{frames.length}</span>
              </div>
              <input
                className="mt-3 w-full accent-cyan-400"
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={Math.max(0, selectedPosition)}
                onChange={e => setIndex(Number(e.target.value))}
              />
              <div className="mt-1 flex justify-between font-mono text-[8px] text-slate-600">
                <span>EARLIEST</span>
                <span>LATEST</span>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 xl:grid-cols-2">
              <div className="min-w-0 space-y-3">
                {rows.map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="text-[8px] tracking-[0.2em] text-slate-600">{label}</div>
                    <div className="mt-1 min-w-0 break-words font-mono text-[10px] text-slate-200">{value}</div>
                  </div>
                ))}
                <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="text-[8px] tracking-[0.2em] text-slate-600">TRANSITION</div>
                  <div className="mt-1 min-w-0 break-words text-xs text-slate-300">{selected.safety.transitionReason}</div>
                </div>
              </div>

              <div className="min-w-0 grid gap-3">
                <Group
                  title="INTERLOCKS"
                  entries={Object.entries(selected.safety).filter(([k]) =>
                    ["chamberSealed", "pressureSafeForHeating", "temperatureSafeForCooling", "overTemperature", "vacuumAchieved", "allSystemsSafe"].includes(k),
                  )}
                />
                <Group title="VALVES" entries={Object.entries(selected.controlOutput.valve)} />
                <Group
                  title="HARDWARE DIAGNOSTICS"
                  entries={Object.entries(selected.hardwareDiagnostics ?? {}).filter(([, v]) => typeof v !== "object")}
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-4">
          <div className="mb-2 text-[8px] tracking-[0.2em] text-slate-600">
            AVAILABLE FRAME WINDOW · LAST {visible.length}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {visible.map(f => (
              <button
                key={f.step}
                onClick={() => setIndex(frames.findIndex(x => x.step === f.step))}
                className={`min-w-12 shrink-0 rounded border px-2 py-1 font-mono text-[8px] ${selected?.step === f.step ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-slate-800 text-slate-600 hover:text-slate-300"}`}
              >
                #{f.step}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 break-words text-[8px] font-mono text-slate-600">
          TRACE ORDER: sensor-before → controller/interlocks → intended commands → effective commands → physical response → observed sensor-after → safety/result.
        </div>
      </div>
    </section>
  );
}
