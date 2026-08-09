import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as researchDb from "./researchDb";
import { assessValidationReadiness } from "./scientificValidation";
import { compareSimulationToExperiment, type ParameterTolerance } from "./comparisonEngine";
import { validateAgainstReplicates } from "./uncertaintyEngine";
import { validateEnergyBalance, validateMassBalance } from "./massEnergyBalance";
import { buildScientificValidationReport, type ReportSection } from "./scientificReport";

const simulationChannelMap: Record<string, string> = {
  pressure: "pressure",
  temperature: "temperature",
  yield: "yieldPercentage",
  waterRemoved: "waterRemoved",
  oilRecovered: "oilRecovered",
  energy: "energyConsumed",
};

const balanceTolerance = z.object({
  absoluteKg: z.number().nonnegative().optional(),
  relativePercent: z.number().nonnegative().optional(),
}).refine(value => value.absoluteKg !== undefined || value.relativePercent !== undefined, {
  message: "At least one balance tolerance is required for PASS/FAIL; otherwise the result is INCONCLUSIVE.",
});

const energyBalanceTolerance = z.object({
  absoluteKwh: z.number().nonnegative().optional(),
  relativePercent: z.number().nonnegative().optional(),
}).refine(value => value.absoluteKwh !== undefined || value.relativePercent !== undefined, {
  message: "At least one energy tolerance is required for PASS/FAIL; otherwise the result is INCONCLUSIVE.",
});

const comparisonTolerance = z.record(z.string(), z.object({
  maxBias: z.number().nonnegative().optional(),
  maxMae: z.number().nonnegative().optional(),
  maxRmse: z.number().nonnegative().optional(),
  maxAbsoluteError: z.number().nonnegative().optional(),
}).refine(value => Object.values(value).some(item => item !== undefined), {
  message: "Each parameter requires at least one acceptance threshold.",
}));

async function loadAuthorizedResearchExperiment(ctx: { user?: { id: number; role?: string } | null }, researchExperimentId: string) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const researchExperiment = await researchDb.getResearchExperiment(researchExperimentId);
  if (!researchExperiment) throw new TRPCError({ code: "NOT_FOUND" });
  if (researchExperiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return researchExperiment;
}

export const scientificRouter = router({
  validationReadiness: protectedProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
    const researchExperiment = await loadAuthorizedResearchExperiment(ctx, input);
    const [observations, instruments, datasets, provenance] = await Promise.all([
      researchDb.listSensorObservations(input, 1),
      researchDb.listExperimentInstruments(input),
      researchDb.listDatasetManifests(input),
      researchDb.listProvenanceRecords(researchExperiment.provenanceId ?? researchExperiment.id),
    ]);
    const instrumentIds = instruments.map(item => item.instrumentId);
    const calibrations = await researchDb.listInstrumentCalibrations(instrumentIds);
    const calibrationByInstrument = new Map<string, typeof calibrations[number]>();
    for (const calibration of calibrations) {
      const current = calibrationByInstrument.get(calibration.instrumentId);
      if (!current || calibration.calibratedAt > current.calibratedAt) calibrationByInstrument.set(calibration.instrumentId, calibration);
    }
    const now = new Date();
    const allAssignedInstrumentsCalibrated = instruments.length > 0 && instruments.every(item => {
      const calibration = item.calibrationId ? calibrations.find(candidate => candidate.id === item.calibrationId) : calibrationByInstrument.get(item.instrumentId);
      return Boolean(calibration && (!calibration.expiresAt || calibration.expiresAt > now));
    });
    const hasSimulationDataset = datasets.some(dataset => dataset.origin === "SIMULATION");
    const hasExperimentalDataset = datasets.some(dataset => dataset.origin === "EXPERIMENTAL");
    const readiness = assessValidationReadiness({
      experimentExists: true,
      hasSensorObservations: observations.length > 0,
      hasInstrumentAssignments: instruments.length > 0,
      allAssignedInstrumentsCalibrated,
      hasSimulationDataset,
      hasExperimentalDataset,
      hasProvenance: provenance.length > 0,
      experimentStatus: researchExperiment.status,
    });
    const simulationResult = await db.getSimulationResult(researchExperiment.experimentId);
    return {
      ...readiness,
      researchExperimentId: researchExperiment.id,
      experimentId: researchExperiment.experimentId,
      evidence: {
        sensorObservationPresent: observations.length > 0,
        instrumentCount: instruments.length,
        calibratedInstrumentCount: instruments.filter(item => {
          const calibration = item.calibrationId ? calibrations.find(candidate => candidate.id === item.calibrationId) : calibrationByInstrument.get(item.instrumentId);
          return Boolean(calibration && (!calibration.expiresAt || calibration.expiresAt > now));
        }).length,
        simulationDatasetCount: datasets.filter(dataset => dataset.origin === "SIMULATION").length,
        experimentalDatasetCount: datasets.filter(dataset => dataset.origin === "EXPERIMENTAL").length,
        provenanceCount: provenance.length,
        simulationResultPresent: Boolean(simulationResult),
      },
      scientificBoundary: "Readiness indicates evidence-chain completeness only. It does not establish physical model validity, measurement accuracy, or scientific truth.",
    };
  }),

  compareExperiment: protectedProcedure.input(z.object({
    researchExperimentId: z.string().min(1),
    tolerances: comparisonTolerance.optional(),
  })).query(async ({ ctx, input }) => {
    const researchExperiment = await loadAuthorizedResearchExperiment(ctx, input.researchExperimentId);
    const [observations, simulationResult] = await Promise.all([
      researchDb.listSensorObservations(input.researchExperimentId, 10000),
      db.getSimulationResult(researchExperiment.experimentId),
    ]);
    if (!simulationResult) throw new TRPCError({ code: "NOT_FOUND", message: "No simulation result is linked to this experiment." });
    const validTimes = observations.map(item => item.observedAt.getTime()).filter(Number.isFinite);
    if (validTimes.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No timestamped experimental observations are available." });
    const experimentStartMs = Math.min(...validTimes);
    const experimental = observations.map(item => ({ parameter: item.parameter, timeSeconds: (item.observedAt.getTime() - experimentStartMs) / 1000, value: Number(item.value), qualityFlag: item.qualityFlag }));
    const rawSimulation = Array.isArray(simulationResult.realTimeData) ? simulationResult.realTimeData as Array<Record<string, unknown>> : [];
    const simulation = rawSimulation.map(frame => {
      const values: Record<string, number> = {};
      for (const [parameter, channel] of Object.entries(simulationChannelMap)) {
        const value = Number(frame[channel]);
        if (Number.isFinite(value)) values[parameter] = value;
      }
      return { timeSeconds: Number(frame.timestamp), values };
    }).filter(frame => Number.isFinite(frame.timeSeconds));
    if (simulation.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "The linked simulation has no time-series frames to compare." });
    return compareSimulationToExperiment({ experimental, simulation, tolerances: input.tolerances as Record<string, ParameterTolerance> | undefined });
  }),

  replicateValidation: protectedProcedure.input(z.object({
    researchExperimentId: z.string().min(1), parameter: z.string().min(1), simulationValue: z.number(), experimentalValues: z.array(z.number()).min(1), instrumentStandardUncertainty: z.number().nonnegative().optional(), confidenceMultiplier: z.number().positive().optional(), tolerance: z.number().nonnegative().optional(),
  })).query(async ({ ctx, input }) => {
    await loadAuthorizedResearchExperiment(ctx, input.researchExperimentId);
    const finiteValues = input.experimentalValues.filter(Number.isFinite);
    if (finiteValues.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No finite experimental replicate values are available." });
    return { parameter: input.parameter, researchExperimentId: input.researchExperimentId, ...validateAgainstReplicates({ experimentalValues: finiteValues, simulationValue: input.simulationValue, instrumentStandardUncertainty: input.instrumentStandardUncertainty, confidenceMultiplier: input.confidenceMultiplier, tolerance: input.tolerance }), scientificBoundary: "Replicate uncertainty quantifies repeatability and supplied instrument uncertainty. It does not certify the physical model or measurement system." };
  }),

  balanceValidation: protectedProcedure.input(z.object({
    researchExperimentId: z.string().min(1),
    mass: z.object({ materialInKg: z.number().nonnegative(), waterRemovedKg: z.number().nonnegative().optional(), oilRecoveredKg: z.number().nonnegative().optional(), solidRecoveredKg: z.number().nonnegative().optional(), wasteKg: z.number().nonnegative().optional(), otherOutputKg: z.number().nonnegative().optional() }).optional(),
    energy: z.object({ energyInputKwh: z.number().nonnegative(), heatingKwh: z.number().nonnegative().optional(), vacuumKwh: z.number().nonnegative().optional(), extractionKwh: z.number().nonnegative().optional(), coolingKwh: z.number().nonnegative().optional(), otherKwh: z.number().nonnegative().optional() }).optional(),
    massTolerance: balanceTolerance.optional(), energyTolerance: energyBalanceTolerance.optional(),
  }).refine(input => input.mass !== undefined || input.energy !== undefined, { message: "At least one balance domain must be supplied." })).query(async ({ ctx, input }) => {
    await loadAuthorizedResearchExperiment(ctx, input.researchExperimentId);
    const mass = input.mass ? validateMassBalance(input.mass, input.massTolerance) : null;
    const energy = input.energy ? validateEnergyBalance(input.energy, input.energyTolerance) : null;
    return { researchExperimentId: input.researchExperimentId, mass, energy, scientificBoundary: "Balance closure evaluates declared accounting against explicit tolerances. It does not prove conservation-law compliance, instrument accuracy, process-model validity, or scientific truth." };
  }),

  validationReport: protectedProcedure.input(z.object({
    researchExperimentId: z.string().min(1),
    tolerances: comparisonTolerance.optional(),
    mass: z.object({ materialInKg: z.number().nonnegative(), waterRemovedKg: z.number().nonnegative().optional(), oilRecoveredKg: z.number().nonnegative().optional(), solidRecoveredKg: z.number().nonnegative().optional(), wasteKg: z.number().nonnegative().optional(), otherOutputKg: z.number().nonnegative().optional() }).optional(),
    energy: z.object({ energyInputKwh: z.number().nonnegative(), heatingKwh: z.number().nonnegative().optional(), vacuumKwh: z.number().nonnegative().optional(), extractionKwh: z.number().nonnegative().optional(), coolingKwh: z.number().nonnegative().optional(), otherKwh: z.number().nonnegative().optional() }).optional(),
    massTolerance: balanceTolerance.optional(), energyTolerance: energyBalanceTolerance.optional(),
  })).query(async ({ ctx, input }) => {
    const researchExperiment = await loadAuthorizedResearchExperiment(ctx, input.researchExperimentId);
    const readiness = await (async () => {
      const [observations, instruments, datasets, provenance] = await Promise.all([
        researchDb.listSensorObservations(input.researchExperimentId, 10000),
        researchDb.listExperimentInstruments(input.researchExperimentId),
        researchDb.listDatasetManifests(input.researchExperimentId),
        researchDb.listProvenanceRecords(researchExperiment.provenanceId ?? researchExperiment.id),
      ]);
      const calibrations = await researchDb.listInstrumentCalibrations(instruments.map(item => item.instrumentId));
      const now = new Date();
      const calibrated = instruments.length > 0 && instruments.every(item => {
        const c = item.calibrationId ? calibrations.find(candidate => candidate.id === item.calibrationId) : calibrations.filter(candidate => candidate.instrumentId === item.instrumentId).sort((a, b) => b.calibratedAt.getTime() - a.calibratedAt.getTime())[0];
        return Boolean(c && (!c.expiresAt || c.expiresAt > now));
      });
      return assessValidationReadiness({ experimentExists: true, hasSensorObservations: observations.length > 0, hasInstrumentAssignments: instruments.length > 0, allAssignedInstrumentsCalibrated: calibrated, hasSimulationDataset: datasets.some(d => d.origin === "SIMULATION"), hasExperimentalDataset: datasets.some(d => d.origin === "EXPERIMENTAL"), hasProvenance: provenance.length > 0, experimentStatus: researchExperiment.status });
    })();

    const sections: ReportSection[] = [{ key: "evidence", title: "Evidence-chain readiness", verdict: readiness.status === "READY_FOR_REVIEW" ? "PASS" : "INCONCLUSIVE", summary: readiness.message, evidence: readiness }];
    if (input.tolerances) {
      try {
        const comparison = await (async () => {
          const observations = await researchDb.listSensorObservations(input.researchExperimentId, 10000);
          const simulationResult = await db.getSimulationResult(researchExperiment.experimentId);
          if (!simulationResult) return null;
          const validTimes = observations.map(item => item.observedAt.getTime()).filter(Number.isFinite);
          if (validTimes.length === 0) return null;
          const start = Math.min(...validTimes);
          const experimental = observations.map(item => ({ parameter: item.parameter, timeSeconds: (item.observedAt.getTime() - start) / 1000, value: Number(item.value), qualityFlag: item.qualityFlag }));
          const frames = Array.isArray(simulationResult.realTimeData) ? simulationResult.realTimeData as Array<Record<string, unknown>> : [];
          const simulation = frames.map(frame => { const values: Record<string, number> = {}; for (const [parameter, channel] of Object.entries(simulationChannelMap)) { const value = Number(frame[channel]); if (Number.isFinite(value)) values[parameter] = value; } return { timeSeconds: Number(frame.timestamp), values }; }).filter(frame => Number.isFinite(frame.timeSeconds));
          if (!simulation.length) return null;
          return compareSimulationToExperiment({ experimental, simulation, tolerances: input.tolerances as Record<string, ParameterTolerance> });
        })();
        sections.push({ key: "comparison", title: "Simulation versus experiment", verdict: comparison?.overallVerdict ?? "INCONCLUSIVE", summary: comparison ? "Comparison metrics were computed using the supplied acceptance thresholds." : "Comparison evidence could not be computed from the linked data.", evidence: comparison ?? {} });
      } catch (error) {
        sections.push({ key: "comparison", title: "Simulation versus experiment", verdict: "INCONCLUSIVE", summary: error instanceof Error ? error.message : "Comparison could not be computed.", evidence: {} });
      }
    } else {
      sections.push({ key: "comparison", title: "Simulation versus experiment", verdict: "INCONCLUSIVE", summary: "No comparison acceptance thresholds were supplied; scientific PASS/FAIL cannot be established.", evidence: {} });
    }

    if (input.mass || input.energy) {
      const mass = input.mass ? validateMassBalance(input.mass, input.massTolerance) : null;
      const energy = input.energy ? validateEnergyBalance(input.energy, input.energyTolerance) : null;
      const verdict = mass?.verdict === "FAIL" || energy?.verdict === "FAIL" ? "FAIL" : mass?.verdict === "INCONCLUSIVE" || energy?.verdict === "INCONCLUSIVE" ? "INCONCLUSIVE" : "PASS";
      sections.push({ key: "balances", title: "Mass and energy balance", verdict, summary: "Declared mass and energy accounting was evaluated against supplied tolerances.", evidence: { mass, energy } });
    } else {
      sections.push({ key: "balances", title: "Mass and energy balance", verdict: "INCONCLUSIVE", summary: "No mass or energy balance evidence was supplied to this report.", evidence: {} });
    }

    const [datasets, provenance] = await Promise.all([
      researchDb.listDatasetManifests(input.researchExperimentId),
      researchDb.listProvenanceRecords(researchExperiment.provenanceId ?? researchExperiment.id),
    ]);
    const simulationResult = await db.getSimulationResult(researchExperiment.experimentId);
    return buildScientificValidationReport({
      researchExperimentId: researchExperiment.id,
      experimentId: researchExperiment.experimentId,
      sections,
      provenance: { datasetIds: datasets.map(dataset => dataset.id), observationCount: undefined, simulationResultPresent: Boolean(simulationResult), provenanceRecordCount: provenance.length },
    });
  }),
});
