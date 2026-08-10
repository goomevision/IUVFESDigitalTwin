import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { ClosedLoopSimulationEngine, type ClosedLoopSimulationConfig } from "./closedLoopSimulation";
import { getClosedLoopSession, saveClosedLoopSession } from "./closedLoopSessionStore";

const ultrasonicConfigSchema = z.object({ enabled: z.boolean().default(true), frequencyHz: z.number().min(1).max(1_000_000), electricalPowerW: z.number().min(0).max(1_000_000), transducerEfficiency: z.number().min(0).max(1), activeAreaM2: z.number().positive().max(10_000), dutyCycle: z.number().min(0).max(1).default(1), fluidDensityKgM3: z.number().positive().max(20_000).optional(), soundSpeedMps: z.number().positive().max(20_000).optional(), dynamicViscosityPaS: z.number().min(0).max(10).optional(), surfaceTensionNPerM: z.number().min(0).max(10).optional(), vaporPressurePa: z.number().min(0).max(30_000_000).optional(), initialBubbleRadiusM: z.number().positive().max(1).optional(), polytropicExponent: z.number().min(1).max(3).optional(), attenuationNpPerM: z.number().min(0).max(100).optional(), propagationDistanceM: z.number().min(0).max(10_000).optional(), maxMassTransferEnhancement: z.number().min(0).max(100).optional(), acousticHeatingFraction: z.number().min(0).max(1).optional(), provenance: z.enum(["DEFAULT_WATER_BASELINE", "DATASHEET", "MEASURED", "CALIBRATED"]).default("DEFAULT_WATER_BASELINE") }).optional();
const configSchema = z.object({ experimentId: z.string().min(1), materialWeight: z.number().min(0.1).max(1000), waterContent: z.number().min(0).max(100), oilContent: z.number().min(0).max(100), targetPressure: z.number().min(1).max(1000), targetTemperature: z.number().min(20).max(150), dtSeconds: z.number().min(0.1).max(10).default(1), maxSteps: z.number().int().min(1).max(100000).default(10000), ultrasonic: ultrasonicConfigSchema });
const experimentIdSchema = z.object({ experimentId: z.string().min(1) });

async function authorize(experimentId: string, user: { id: number; role: string }) {
  const experiment = await db.getExperiment(experimentId);
  if (!experiment) throw new TRPCError({ code: "NOT_FOUND" });
  if (experiment.userId !== user.id && user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return experiment;
}

function toEngineConfig(input: z.infer<typeof configSchema>): ClosedLoopSimulationConfig {
  return { targetPressureMbar: input.targetPressure, targetTemperatureC: input.targetTemperature, materialWeightKg: input.materialWeight, waterContentPercent: input.waterContent, oilContentPercent: input.oilContent, dtSeconds: input.dtSeconds, maxSteps: input.maxSteps, ultrasonic: input.ultrasonic };
}
function engineFromSession(snapshot: any) { const engine = new ClosedLoopSimulationEngine(snapshot.config); engine.restore(snapshot); return engine; }

export const closedLoopRouter = router({
  start: protectedProcedure.input(configSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const existing = await getClosedLoopSession(input.experimentId);
    if (existing && ["running", "paused"].includes(existing.status)) return { success: true, status: existing.status, step: existing.lastStep, frames: existing.snapshot.frames, sensors: existing.snapshot.sensors, state: existing.snapshot.state };
    const engine = new ClosedLoopSimulationEngine(toEngineConfig(input));
    const snapshot = engine.snapshot();
    await saveClosedLoopSession(input.experimentId, "running", snapshot);
    await db.updateExperimentStatus(input.experimentId, "running");
    await db.logControlAction({ experimentId: input.experimentId, action: "start", operatorNotes: "Closed-loop simulation session started." });
    return { success: true, status: "running" as const, step: snapshot.stepNumber, frames: snapshot.frames, sensors: snapshot.sensors, state: snapshot.state };
  }),
  step: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const session = await getClosedLoopSession(input.experimentId);
    if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session. Start the experiment first." });
    const engine = engineFromSession(session.snapshot);
    if (session.status !== "running") return { success: false, status: session.status, frame: null, step: session.lastStep, frames: session.snapshot.frames, sensors: session.snapshot.sensors, state: session.snapshot.state };
    const frame = engine.step(); const state = engine.getState();
    const terminal = state.stage === "COMPLETE" || state.stage === "FAULT" || frame === null;
    const status = state.stage === "FAULT" ? "failed" : state.stage === "COMPLETE" ? "completed" : "running";
    const snapshot = engine.snapshot(); await saveClosedLoopSession(input.experimentId, status, snapshot); if (terminal) await finalizeResult(input.experimentId, snapshot);
    return { success: !terminal || state.stage === "COMPLETE", status, frame, step: snapshot.stepNumber, frames: snapshot.frames, sensors: snapshot.sensors, state };
  }),
  pause: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); await authorize(input.experimentId, ctx.user); const session = await getClosedLoopSession(input.experimentId); if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session." }); const engine = engineFromSession(session.snapshot); engine.pause(); const snapshot = engine.snapshot(); await saveClosedLoopSession(input.experimentId, "paused", snapshot); await db.updateExperimentStatus(input.experimentId, "paused"); await db.logControlAction({ experimentId: input.experimentId, action: "pause", operatorNotes: `Paused at simulation step ${snapshot.stepNumber}.` }); return { success: true, status: "paused" as const, step: snapshot.stepNumber, sensors: snapshot.sensors, state: snapshot.state };
  }),
  resume: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); await authorize(input.experimentId, ctx.user); const session = await getClosedLoopSession(input.experimentId); if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session." }); const engine = engineFromSession(session.snapshot); engine.resume(); const snapshot = engine.snapshot(); await saveClosedLoopSession(input.experimentId, "running", snapshot); await db.updateExperimentStatus(input.experimentId, "running"); await db.logControlAction({ experimentId: input.experimentId, action: "resume", operatorNotes: `Resumed at simulation step ${snapshot.stepNumber}.` }); return { success: true, status: "running" as const, step: snapshot.stepNumber, sensors: snapshot.sensors, state: snapshot.state };
  }),
  stop: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); await authorize(input.experimentId, ctx.user); const session = await getClosedLoopSession(input.experimentId); if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session." }); const engine = engineFromSession(session.snapshot); engine.pause(); const snapshot = engine.snapshot(); await saveClosedLoopSession(input.experimentId, "stopped", snapshot); await db.updateExperimentStatus(input.experimentId, "failed"); await db.logControlAction({ experimentId: input.experimentId, action: "stop", operatorNotes: `Stopped at simulation step ${snapshot.stepNumber}.` }); return { success: true, status: "stopped" as const, step: snapshot.stepNumber, sensors: snapshot.sensors, state: snapshot.state, frames: snapshot.frames };
  }),
  status: protectedProcedure.input(experimentIdSchema).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); await authorize(input.experimentId, ctx.user); const session = await getClosedLoopSession(input.experimentId); if (!session) return { exists: false as const }; return { exists: true as const, status: session.status, step: session.lastStep, frameCount: session.frameCount, sensors: session.snapshot.sensors, state: session.snapshot.state };
  }),
});

async function finalizeResult(experimentId: string, snapshot: any) {
  const state = snapshot.state;
  await db.createSimulationResult({ experimentId, finalYield: snapshot.sensors.yieldPercent, oilComposition: null as any, energyConsumed: snapshot.sensors.energyKwh, efficiency: null as any, wasteComposition: null as any, realTimeData: snapshot.frames, massBalance: { waterRemovedKg: snapshot.sensors.waterRemovedKg, oilRecoveredKg: snapshot.sensors.oilRecoveredKg }, energyBalance: { energyKwh: snapshot.sensors.energyKwh, terminalStage: state.stage } });
  await db.updateExperimentStatus(experimentId, state.stage === "FAULT" ? "failed" : "completed");
}
