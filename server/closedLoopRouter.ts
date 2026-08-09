import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";
import { getClosedLoopSession, saveClosedLoopSession } from "./closedLoopSessionStore";

const configSchema = z.object({
  experimentId: z.string().min(1),
  materialWeight: z.number().min(0.1).max(1000),
  waterContent: z.number().min(0).max(100),
  oilContent: z.number().min(0).max(100),
  targetPressure: z.number().min(1).max(1000),
  targetTemperature: z.number().min(20).max(150),
  dtSeconds: z.number().min(0.1).max(10).default(1),
  maxSteps: z.number().int().min(1).max(100000).default(10000),
  realTime: z.boolean().default(true),
});

const experimentIdSchema = z.object({ experimentId: z.string().min(1) });

async function authorize(experimentId: string, user: { id: number; role: string }) {
  const experiment = await db.getExperiment(experimentId);
  if (!experiment) throw new TRPCError({ code: "NOT_FOUND" });
  if (experiment.userId !== user.id && user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return experiment;
}

function engineFromSession(snapshot: any) {
  const engine = new ClosedLoopSimulationEngine(snapshot.config);
  engine.restore(snapshot);
  return engine;
}

export const closedLoopRouter = router({
  start: protectedProcedure.input(configSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const existing = await getClosedLoopSession(input.experimentId);
    if (existing && ["running", "paused"].includes(existing.status)) {
      return { success: true, status: existing.status, step: existing.lastStep, frames: existing.snapshot.frames, sensors: existing.snapshot.sensors, state: existing.snapshot.state };
    }
    const engine = new ClosedLoopSimulationEngine(input);
    const snapshot = engine.snapshot();
    await saveClosedLoopSession(input.experimentId, "running", snapshot);
    await db.updateExperimentStatus(input.experimentId, "running");
    await db.logControlAction({ experimentId: input.experimentId, action: "start", operatorNotes: `Closed-loop simulation session started in ${input.realTime ? "REAL_TIME" : "ACCELERATED/BATCH"} mode.` });
    return { success: true, status: "running" as const, step: snapshot.stepNumber, frames: snapshot.frames, sensors: snapshot.sensors, state: snapshot.state };
  }),

  step: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const session = await getClosedLoopSession(input.experimentId);
    if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session. Start the experiment first." });
    const engine = engineFromSession(session.snapshot);
    if (session.status !== "running") return { success: false, status: session.status, frame: null, step: session.lastStep, frames: session.snapshot.frames, sensors: session.snapshot.sensors, state: session.snapshot.state };

    const frame = engine.step();
    if (frame === null) {
      const dtSeconds = Number(session.snapshot.config.dtSeconds ?? 1);
      return { success: false, status: "waiting" as const, frame: null, step: session.lastStep, frames: session.snapshot.frames, sensors: session.snapshot.sensors, state: session.snapshot.state, retryAfterMs: Math.max(50, Math.round(dtSeconds * 1000)) };
    }

    const state = engine.getState();
    const terminal = state.stage === "COMPLETE" || state.stage === "FAULT";
    const status = state.stage === "FAULT" ? "failed" : state.stage === "COMPLETE" ? "completed" : "running";
    const snapshot = engine.snapshot();
    await saveClosedLoopSession(input.experimentId, status, snapshot);
    if (terminal) await finalizeResult(input.experimentId, snapshot);
    return { success: !terminal || state.stage === "COMPLETE", status, frame, step: snapshot.stepNumber, frames: snapshot.frames, sensors: snapshot.sensors, state };
  }),

  pause: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const session = await getClosedLoopSession(input.experimentId);
    if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session." });
    const engine = engineFromSession(session.snapshot); engine.pause();
    const snapshot = engine.snapshot();
    await saveClosedLoopSession(input.experimentId, "paused", snapshot);
    await db.updateExperimentStatus(input.experimentId, "paused");
    await db.logControlAction({ experimentId: input.experimentId, action: "pause", operatorNotes: `Paused at simulation step ${snapshot.stepNumber}.` });
    return { success: true, status: "paused" as const, step: snapshot.stepNumber, sensors: snapshot.sensors, state: snapshot.state };
  }),

  resume: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const session = await getClosedLoopSession(input.experimentId);
    if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session." });
    const engine = engineFromSession(session.snapshot); engine.resume();
    const snapshot = engine.snapshot();
    await saveClosedLoopSession(input.experimentId, "running", snapshot);
    await db.updateExperimentStatus(input.experimentId, "running");
    await db.logControlAction({ experimentId: input.experimentId, action: "resume", operatorNotes: `Resumed at simulation step ${snapshot.stepNumber}.` });
    return { success: true, status: "running" as const, step: snapshot.stepNumber, sensors: snapshot.sensors, state: snapshot.state };
  }),

  stop: protectedProcedure.input(experimentIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const session = await getClosedLoopSession(input.experimentId);
    if (!session) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No closed-loop session." });
    const engine = engineFromSession(session.snapshot); engine.pause();
    const snapshot = engine.snapshot();
    await saveClosedLoopSession(input.experimentId, "stopped", snapshot);
    await db.updateExperimentStatus(input.experimentId, "failed");
    await db.logControlAction({ experimentId: input.experimentId, action: "stop", operatorNotes: `Stopped at simulation step ${snapshot.stepNumber}.` });
    return { success: true, status: "stopped" as const, step: snapshot.stepNumber, sensors: snapshot.sensors, state: snapshot.state, frames: snapshot.frames };
  }),

  status: protectedProcedure.input(experimentIdSchema).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    await authorize(input.experimentId, ctx.user);
    const session = await getClosedLoopSession(input.experimentId);
    if (!session) return { exists: false };
    return { exists: true, status: session.status, step: session.lastStep, frameCount: session.frameCount, sensors: session.snapshot.sensors, state: session.snapshot.state };
  }),
});

async function finalizeResult(experimentId: string, snapshot: any) {
  const state = snapshot.state;
  await db.createSimulationResult({
    experimentId,
    finalYield: snapshot.sensors.yieldPercent,
    oilComposition: null as any,
    energyConsumed: snapshot.sensors.energyKwh,
    efficiency: null as any,
    wasteComposition: null as any,
    realTimeData: snapshot.frames,
    massBalance: { waterRemovedKg: snapshot.sensors.waterRemovedKg, oilRecoveredKg: snapshot.sensors.oilRecoveredKg },
    energyBalance: { energyKwh: snapshot.sensors.energyKwh, terminalStage: state.stage },
  });
  await db.updateExperimentStatus(experimentId, state.stage === "FAULT" ? "failed" : "completed");
}
