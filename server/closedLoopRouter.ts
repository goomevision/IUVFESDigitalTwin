import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";
import { recordClosedLoopRun } from "./scientificEventJournal";
import { persistSimulationDataset } from "./scientificDatasetPersistence";

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

export const closedLoopRouter = router({
  run: protectedProcedure.input(inputSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const experiment = await db.getExperiment(input.experimentId);
    if (!experiment) throw new TRPCError({ code: "NOT_FOUND" });
    if (experiment.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: input.targetPressure,
      targetTemperatureC: input.targetTemperature,
      materialWeightKg: input.materialWeight,
      waterContentPercent: input.waterContent,
      oilContentPercent: input.oilContent,
      dtSeconds: input.dtSeconds,
      maxSteps: input.maxSteps,
    });

    await db.updateExperimentStatus(input.experimentId, "running");
    const result = engine.runToCompletion();
    const isComplete = result.status === "COMPLETE";
    const isFault = result.status === "FAULT";

    // The causal journal is persisted before the result is published.
    // A run without its journal is not considered auditable.
    const events = await recordClosedLoopRun(input.experimentId, result);

    // Build a content-addressed scientific dataset manifest. Simulation data
    // remains RAW until calibrated/validated against laboratory measurements.
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

    await db.updateExperimentStatus(
      input.experimentId,
      isComplete ? "completed" : isFault ? "failed" : "running",
    );

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
      frames: result.frames,
      finalSensors: result.finalSensors,
    };
  }),
});
