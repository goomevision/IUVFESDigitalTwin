import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import * as researchDb from "./researchDb";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { PhysicsSimulationEngine } from "./physicsEngine";
import { AIOptimizer, type SimulationDataPoint } from "./aiOptimizer";
import { ProcessStateEngine, type ProcessState, type MachineSensors } from "./processStateEngine";
import { MachineDynamicsEngine } from "./machineDynamics";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  materials: router({
    list: publicProcedure.query(async () => db.getMaterials()),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => { const material = await db.getMaterialById(input); if (!material) throw new TRPCError({ code: "NOT_FOUND" }); return material; }),
    getByName: publicProcedure.input(z.string()).query(async ({ input }) => { const material = await db.getMaterialByName(input); if (!material) throw new TRPCError({ code: "NOT_FOUND" }); return material; }),
    create: protectedProcedure.input(z.object({ name: z.string().min(1).max(100), description: z.string().optional(), defaultWaterContent: z.number().min(0).max(100), defaultOilContent: z.number().min(0).max(100), oilComposition: z.record(z.string(), z.number()), density: z.number().optional(), thermalProperties: z.record(z.string(), z.number()).optional() })).mutation(async ({ input }) => db.createMaterial(input)),
  }),
  experiments: router({
    create: protectedProcedure.input(z.object({ materialId: z.number(), experimentName: z.string().min(1).max(255), inputParameters: z.record(z.string(), z.any()) })).mutation(async ({ ctx, input }) => { if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experimentId = await db.createExperiment({ userId: ctx.user.id, materialId: input.materialId, experimentName: input.experimentName, inputParameters: input.inputParameters }); return { experimentId }; }),
    get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => { if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await db.getExperiment(input); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" }); return experiment; }),
    list: protectedProcedure.query(async ({ ctx }) => { if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); return db.listUserExperiments(ctx.user.id); }),
    updateStatus: protectedProcedure.input(z.object({ experimentId: z.string(), status: z.enum(["draft", "running", "paused", "completed", "failed"]) })).mutation(async ({ ctx, input }) => { if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await db.getExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" }); await db.updateExperimentStatus(input.experimentId, input.status); return { success: true }; }),
  }),
  research: router({
    create: protectedProcedure.input(z.object({ title: z.string().min(1).max(255), objective: z.string().min(1), hypothesis: z.string().optional(), materialId: z.number().int().positive(), sampleId: z.string().min(1).max(128), batchId: z.string().max(128).optional(), massKg: z.number().positive(), environment: z.record(z.string(), z.any()).optional(), procedure: z.array(z.string().min(1)).min(1), inputParameters: z.record(z.string(), z.any()) })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const experimentId = randomUUID(); const researchId = `IUVFES-EXP-${experimentId}`;
      await researchDb.createResearchExperiment({ id: researchId, experimentId, title: input.title, status: "ready", researcherId: String(ctx.user.id), objective: input.objective, hypothesis: input.hypothesis, materialId: input.materialId, sampleId: input.sampleId, batchId: input.batchId, massKg: String(input.massKg), environment: input.environment, procedure: input.procedure, inputParameters: input.inputParameters });
      return { researchId, experimentId };
    }),
    get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); return experiment;
    }),
    start: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); await researchDb.updateResearchExperimentStatus(input, "running"); return { success: true };
    }),
    pause: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); await researchDb.updateResearchExperimentStatus(input, "paused"); return { success: true };
    }),
    complete: protectedProcedure.input(z.object({ experimentId: z.string(), outcome: z.enum(["completed", "failed"]), conclusion: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); await researchDb.updateResearchExperimentStatus(input.experimentId, input.outcome); await researchDb.appendOperatorObservation({ experimentId: input.experimentId, observedAt: new Date(), authorId: String(ctx.user.id), note: `Experiment closeout: ${input.outcome}. ${input.conclusion}` }); return { success: true };
    }),
    recordSensor: protectedProcedure.input(z.object({ experimentId: z.string(), observedAt: z.coerce.date(), instrumentId: z.string().min(1), parameter: z.string().min(1), value: z.number(), unit: z.string().max(32).optional(), qualityFlag: z.enum(["RAW", "VALIDATED", "REJECTED", "CORRECTED"]).default("RAW"), rawPayloadRef: z.string().max(512).optional(), rawPayloadSha256: z.string().length(64).optional() })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); await researchDb.appendSensorObservation({ ...input, value: String(input.value) }); return { success: true };
    }),
    recordNote: protectedProcedure.input(z.object({ experimentId: z.string(), observedAt: z.coerce.date(), note: z.string().min(1), eventId: z.string().max(128).optional() })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); await researchDb.appendOperatorObservation({ ...input, authorId: String(ctx.user.id) }); return { success: true };
    }),
    sensorHistory: protectedProcedure.input(z.object({ experimentId: z.string(), limit: z.number().int().min(1).max(10000).default(1000) })).query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await researchDb.getResearchExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); return researchDb.listSensorObservations(input.experimentId, input.limit);
    }),
    datasetManifest: protectedProcedure.input(z.object({ id: z.string().min(1).max(128), experimentId: z.string().optional(), version: z.string().min(1).max(32), origin: z.enum(["EXPERIMENTAL", "SIMULATION", "DERIVED", "AI_ANALYSIS"]), qualityStatus: z.enum(["RAW", "VALIDATED", "REVIEWED", "CALIBRATED", "REPLICATED", "PUBLISHED", "RETRACTED", "SUPERSEDED"]), sha256: z.string().length(64), storageRef: z.string().min(1).max(512), metadata: z.record(z.string(), z.any()) })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); if (input.experimentId) { const experiment = await researchDb.getResearchExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" }); } await researchDb.createDatasetManifest(input); return { datasetId: input.id };
    }),
  }),
  simulation: router({
    run: protectedProcedure.input(z.object({ experimentId: z.string(), materialId: z.number(), materialWeight: z.number().min(0.1).max(1000), waterContent: z.number().min(0).max(100), oilContent: z.number().min(0).max(100), targetPressure: z.number().min(1).max(1000), targetTemperature: z.number().min(20).max(150), ultrasonicFrequency: z.number().min(20).max(100), duration: z.number().min(0.5).max(24), materialWaterRatio: z.string(), processModel: z.enum(["vacuum", "distillation", "ultrasonic", "hybrid"]) })).mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try { await db.updateExperimentStatus(input.experimentId, "running"); const engine = new PhysicsSimulationEngine({ materialWeight: input.materialWeight, waterContent: input.waterContent, oilContent: input.oilContent, targetPressure: input.targetPressure, targetTemperature: input.targetTemperature, ultrasonicFrequency: input.ultrasonicFrequency, duration: input.duration, materialWaterRatio: input.materialWaterRatio, processModel: input.processModel }); const results = await engine.runSimulation(); const initialSensors: MachineSensors = { chamberSealed: true, pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 }; const controller = new ProcessStateEngine({ targetPressureMbar: input.targetPressure, targetTemperatureC: input.targetTemperature }, initialSensors); const dynamics = new MachineDynamicsEngine(initialSensors, { vacuumRateMbarPerSecond: 7, heaterRateCPerSecond: Math.max(0.08, input.targetTemperature / 550), coolingRateCPerSecond: 0.12 }); const processTimeline: ProcessState[] = []; let sensors = initialSensors; for (const frame of results.realTimeData) { const demanded: MachineSensors = { chamberSealed: true, pressureMbar: frame.pressure, temperatureC: frame.temperature, yieldPercent: frame.yieldPercentage, waterRemovedKg: frame.waterRemoved, oilRecoveredKg: frame.oilRecovered, energyKwh: frame.energyConsumed }; const stateBeforeActuation = controller.tick(sensors, frame.timestamp); sensors = dynamics.step(demanded, stateBeforeActuation.commands, Math.max(1, frame.timestamp - (processTimeline.at(-1)?.elapsedSeconds ?? 0))); const stateAfterActuation = controller.tick(sensors, frame.timestamp); processTimeline.push(stateAfterActuation); } const resultId = await db.createSimulationResult({ experimentId: input.experimentId, finalYield: results.finalYield, oilComposition: results.oilComposition, energyConsumed: results.energyConsumed, efficiency: results.efficiency, wasteComposition: results.wasteComposition, realTimeData: results.realTimeData, massBalance: results.massBalance, energyBalance: results.energyBalance }); await db.updateExperimentStatus(input.experimentId, "completed"); return { success: true, resultId, results, processTimeline }; } catch (error) { await db.updateExperimentStatus(input.experimentId, "failed"); console.error("Simulation error:", error); throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Simulation failed" }); }
    }),
    getResults: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => { if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const results = await db.getSimulationResult(input); if (!results) throw new TRPCError({ code: "NOT_FOUND" }); return results; }),
  }),
  ai: router({
    analyze: protectedProcedure.input(z.object({ experimentId: z.string(), dataUpToTime: z.number().optional(), params: z.object({ targetPressure: z.number(), targetTemperature: z.number(), ultrasonicFrequency: z.number(), duration: z.number(), materialWeight: z.number(), oilContent: z.number(), processModel: z.string() }) })).query(async ({ ctx, input }) => { if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" }); const experiment = await db.getExperiment(input.experimentId); if (!experiment) throw new TRPCError({ code: "NOT_FOUND" }); if (experiment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" }); const result = await db.getSimulationResult(input.experimentId); let data: SimulationDataPoint[] = []; if (result && result.realTimeData) { data = result.realTimeData as unknown as SimulationDataPoint[]; if (input.dataUpToTime !== undefined) data = data.filter(d => d.time <= input.dataUpToTime!); } return new AIOptimizer(input.params).analyze(data); }),
  }),
});
export type AppRouter = typeof appRouter;
