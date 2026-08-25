import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as researchDb from "./researchDb";
import { assessValidationReadiness } from "./scientificValidation";

export const scientificRouter = router({
  validationReadiness: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const researchExperiment = await researchDb.getResearchExperiment(input);
      if (!researchExperiment) throw new TRPCError({ code: "NOT_FOUND" });
      if (researchExperiment.researcherId !== String(ctx.user.id) && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

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
        if (!calibration) return false;
        return !calibration.expiresAt || calibration.expiresAt > now;
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
});
