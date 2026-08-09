export type PhaseChangeKind = "EVAPORATION" | "CONDENSATION";
export type PhaseChangeStatus = "READY" | "DATA_GAP" | "INVALID";

export type PhaseChangeRequest = {
  massKg: number;
  latentHeatJPerKg: number;
  qualityStart: number;
  qualityEnd: number;
  kind: PhaseChangeKind;
};

export type PhaseChangeResult = {
  status: PhaseChangeStatus;
  energyJ: number;
  deltaQuality: number;
  notes: string[];
};

/**
 * Energy accounting for an explicitly supplied two-phase latent heat.
 *
 * This model does not calculate saturation properties or latent heat itself.
 * Those values must come from the authoritative thermodynamic property layer.
 * Positive energy is required for evaporation and negative energy for
 * condensation.
 */
export function calculatePhaseChangeEnergy(request: PhaseChangeRequest): PhaseChangeResult {
  const finite = [request.massKg, request.latentHeatJPerKg, request.qualityStart, request.qualityEnd]
    .every(Number.isFinite);

  if (!finite || request.massKg < 0 || request.latentHeatJPerKg < 0) {
    return {
      status: "INVALID",
      energyJ: 0,
      deltaQuality: 0,
      notes: ["Mass and latent heat must be finite and non-negative."],
    };
  }

  if (request.qualityStart < 0 || request.qualityStart > 1 || request.qualityEnd < 0 || request.qualityEnd > 1) {
    return {
      status: "INVALID",
      energyJ: 0,
      deltaQuality: 0,
      notes: ["Vapor quality must be within [0, 1]."],
    };
  }

  const deltaQuality = request.qualityEnd - request.qualityStart;
  const expectedSign = request.kind === "EVAPORATION" ? 1 : -1;

  if ((request.kind === "EVAPORATION" && deltaQuality < 0) || (request.kind === "CONDENSATION" && deltaQuality > 0)) {
    return {
      status: "INVALID",
      energyJ: 0,
      deltaQuality,
      notes: ["Quality direction is inconsistent with the requested phase-change kind."],
    };
  }

  return {
    status: "READY",
    energyJ: expectedSign * request.massKg * request.latentHeatJPerKg * Math.abs(deltaQuality),
    deltaQuality,
    notes: ["Latent heat was supplied by the authoritative property layer; no latent heat was invented by this model."],
  };
}
