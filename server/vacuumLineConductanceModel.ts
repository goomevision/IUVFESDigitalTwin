export type VacuumLineSegment = {
  id: string;
  lengthM: number;
  internalDiameterM: number;
  roughnessM?: number;
  fittingLossCoefficient?: number;
  valveRestrictionFactor?: number;
};

export type VacuumSystem = {
  vesselVolumeM3: number;
  pumpNominalSpeedM3PerS: number;
  lineSegments: VacuumLineSegment[];
};

export type VacuumEstimate = {
  effectivePumpingSpeedM3PerS: number;
  relativeConductanceFactor: number;
  estimatedTimeConstantS: number;
};

/**
 * Screening-level conductance contract. Detailed molecular/viscous flow
 * correlations must be selected from the actual pressure regime and geometry.
 * This function intentionally returns a relative conductance factor rather
 * than pretending one universal vacuum-flow equation applies everywhere.
 */
export function estimateVacuumLineEffect(system: VacuumSystem): VacuumEstimate {
  if (system.vesselVolumeM3 <= 0 || system.pumpNominalSpeedM3PerS <= 0) throw new Error("Vessel volume and pump speed must be positive.");
  let resistance = 0;
  for (const segment of system.lineSegments) {
    if (segment.lengthM <= 0 || segment.internalDiameterM <= 0) throw new Error(`Invalid vacuum segment: ${segment.id}`);
    const diameterResistance = segment.lengthM / Math.pow(segment.internalDiameterM, 4);
    const fitting = 1 + Math.max(0, segment.fittingLossCoefficient ?? 0);
    const valve = Math.max(0.01, Math.min(1, segment.valveRestrictionFactor ?? 1));
    resistance += diameterResistance * fitting / valve;
  }
  const relativeConductanceFactor = resistance === 0 ? 1 : 1 / (1 + resistance);
  const effectivePumpingSpeedM3PerS = system.pumpNominalSpeedM3PerS * relativeConductanceFactor;
  return { effectivePumpingSpeedM3PerS, relativeConductanceFactor, estimatedTimeConstantS: system.vesselVolumeM3 / effectivePumpingSpeedM3PerS };
}
