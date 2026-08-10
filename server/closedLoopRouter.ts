import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { ClosedLoopSimulationEngine, type ClosedLoopSimulationConfig } from "./closedLoopSimulation";
import { describeClosedLoopEngineContract } from "./closedLoopInputContract";
import { recordClosedLoopRun } from "./scientificEventJournal";
import { persistSimulationDataset } from "./scientificDatasetPersistence";
import {
  createRuntimeSession,
  getRuntimeFrames,
  getRuntimeSession,
  getRuntimeSnapshot,
  pauseRuntimeSession,
  resetRuntimeSession,
  resumeRuntimeSession,
  startRuntimeSession,
  stepRuntimeSession,
  stopRuntimeSession,
} from "./closedLoopRuntimeStore";

const inputSchema = z.object({
  experimentId: z.string().min(1),
  materialWeight: z.number().min(0.1).max(1000),
  waterContent: z.number().min(0).max(100),
  oilContent: z.number().min(0).max(100),
  targetPressure: z.number().min(1).max(1000),
  targetTemperature: z.number().min(20).max(150),
  dtSeconds: z.number().min(0.1).max(10).default(1),
  maxSteps: z.number().int().min(1).max(100000).default(10000),
});

function toEngineConfig(input: z.infer<typeof inputSchema>): ClosedLoopSimulationConfig {
  return {
    targetPressureMbar: input.targetPressure,
    targetTemperatureC: input.targetTemperature,
    materialWeightKg: input.materialWeight,
    waterContentPercent: input.waterContent,
    oilContentPercent: input.oilContent,
    dtSeconds: input.dtSeconds,
    maxSteps: input.maxSteps,
  };
}

async function assertExperimentAccess(ctx: { user?: { id: number; role: string } | null }, experimentId: string) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const experiment = await db.getExperiment(experimentId);
  if (!experiment) throw new TRPCError({ code: "NOT_FOUND" });
  if (experiment.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return experiment;
}

function sessionView(sessionId: string) {
  const session = getRuntimeSession(sessionId);
  const snapshot = getRuntimeSnapshot(sessionId);
  return {
    sessionId: session.sessionId,
    experimentId: session.experimentId,
    status: session.status,
    createdAt: session.createdAt,
    startedAt: session.startedAt ?? null,
    updatedAt: session.updatedAt,
    configuration: session.configuration,
    dataSource: describeClosedLoopEngineContract(),
    currentStep: snapshot.stepNumber,
    elapsedSeconds: snapshot.elapsedSeconds,
    currentFrame: snapshot.frames.at(-1) ?? null,
    frameCount: snapshot.frames.length,
    pausedSteps: snapshot.pausedSteps,
  };
}

export const closedLoopRouter = router({
  create: protectedProcedure.input(inputSchema).mutation(async ({ ctx, input }) => {
    await assertExperimentAccess(ctx, input.experimentId);
    const session = createRuntimeSession(input.experimentId, toEngineConfig(input));
    return sessionView(session.sessionId);
  }),
  start: protectedProcedure.input(z.string().min(1)).mutation(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    startRuntimeSession(input);
    await db.updateExperimentStatus(session.experimentId, "running");
    return sessionView(input);
  }),
  step: protectedProcedure.input(z.string().min(1)).mutation(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    const frame = stepRuntimeSession(input);
    return { frame, session: sessionView(input) };
  }),
  pause: protectedProcedure.input(z.string().min(1)).mutation(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    pauseRuntimeSession(input);
    await db.updateExperimentStatus(session.experimentId, "paused");
    return sessionView(input);
  }),
  resume: protectedProcedure.input(z.string().min(1)).mutation(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    resumeRuntimeSession(input);
    await db.updateExperimentStatus(session.experimentId, "running");
    return sessionView(input);
  }),
  stop: protectedProcedure.input(z.string().min(1)).mutation(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    stopRuntimeSession(input);
    await db.updateExperimentStatus(session.experimentId, "failed");
    return sessionView(input);
  }),
  reset: protectedProcedure.input(z.string().min(1)).mutation(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    resetRuntimeSession(input);
    await db.updateExperimentStatus(session.experimentId, "draft");
    return sessionView(input);
  }),
  get: protectedProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    return sessionView(input);
  }),
  frames: protectedProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    return { sessionId: input, frames: getRuntimeFrames(input), dataSource: describeClosedLoopEngineContract() };
  }),
  snapshot: protectedProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
    const session = getRuntimeSession(input);
    await assertExperimentAccess(ctx, session.experimentId);
    return getRuntimeSnapshot(input);
  }),
  run: protectedProcedure.input(inputSchema).mutation(async ({ ctx, input }) => {
    await assertExperimentAccess(ctx, input.experimentId);
    const engine = new ClosedLoopSimulationEngine(toEngineConfig(input));
    await db.updateExperimentStatus(input.experimentId, "running");
    const result = engine.runToCompletion();
    const isComplete = result.status === "COMPLETE";
    const isFault = result.status === "FAULT";
    const events = await recordClosedLoopRun(input.experimentId, result);
    const dataset = await persistSimulationDataset({
      experimentId: input.experimentId,
      parameters: {
        materialWeightKg: input.materialWeight,
        waterContentPercent: input.waterContent,
        oilContentPercent: input.oilContent,
        targetPressureMbar: input.targetPressure,
        targetTemperatureC: input.targetTemperature,
        dtSeconds: input.dtSeconds,
        maxSteps: input.maxSteps,
      },
      result,
      events,
    });
    const resultId = await db.createSimulationResult({
      experimentId: input.experimentId,
      finalYield: result.finalSensors.yieldPercent,
      oilComposition: null,
      energyConsumed: result.finalSensors.energyKwh,
      efficiency: null,
      wasteComposition: null,
      realTimeData: result.frames,
      massBalance: {
        materialWeightKg: input.materialWeight,
        waterRemovedKg: result.finalSensors.waterRemovedKg,
        oilRecoveredKg: result.finalSensors.oilRecoveredKg,
      },
      energyBalance: { energyKwh: result.finalSensors.energyKwh },
    });
    await db.updateExperimentStatus(input.experimentId, isComplete ? "completed" : isFault ? "failed" : "running");
    return {
      success: isComplete,
      resultId,
      status: result.status,
      eventCount: events.length,
      lastEventHash: events.at(-1)?.eventHash ?? null,
      datasetId: dataset.datasetId,
      datasetSha256: dataset.sha256,
      provenanceId: dataset.provenanceId,
      datasetQualityStatus: dataset.qualityStatus,
      dataSource: describeClosedLoopEngineContract(),
      frames: result.frames,
      finalSensors: result.finalSensors,
    };
  }),
});
