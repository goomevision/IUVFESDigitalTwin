export type HardwareDesignStatus = "SIMULATION_PROPOSAL" | "ENGINEERING_REVIEW_REQUIRED" | "RELEASED_FOR_FABRICATION";

export type VesselDesign = {
  materialId: string;
  internalDiameterM: number;
  straightLengthM: number;
  wallThicknessM: number;
  designPressureMPa: number;
  designTemperatureC: number;
  volumeM3: number;
};

export type HeaterDesign = {
  ratedPowerW: number;
  efficiency: number;
  controlRangeC: { min: number; max: number };
};

export type PumpDesign = {
  nominalSpeedM3PerS: number;
  minimumOperatingPressurePa: number;
  maximumOperatingPressurePa: number;
};

export type ValveDesign = {
  openingFraction: number;
  responseTimeS: number;
};

export type HardwareDesignModel = {
  designId: string;
  revision: string;
  units: "SI";
  vessel: VesselDesign;
  heater: HeaterDesign;
  vacuumPump: PumpDesign;
  valve: ValveDesign;
  status: HardwareDesignStatus;
  evidence: string[];
  unresolvedEngineeringChecks: string[];
};

export function createHardwareDesignModel(input: Omit<HardwareDesignModel, "units">): HardwareDesignModel {
  if (input.vessel.internalDiameterM <= 0 || input.vessel.wallThicknessM <= 0 || input.vessel.straightLengthM <= 0) {
    throw new Error("Vessel dimensions must be positive.");
  }
  if (input.vessel.designPressureMPa <= 0) throw new Error("Design pressure must be positive absolute pressure.");
  if (input.heater.ratedPowerW < 0) throw new Error("Heater power cannot be negative.");
  if (input.heater.efficiency < 0 || input.heater.efficiency > 1) throw new Error("Heater efficiency must be between 0 and 1.");
  if (input.valve.openingFraction < 0 || input.valve.openingFraction > 1) throw new Error("Valve opening must be between 0 and 1.");

  return {
    ...input,
    units: "SI",
    status: input.status === "RELEASED_FOR_FABRICATION" ? "ENGINEERING_REVIEW_REQUIRED" : input.status,
    unresolvedEngineeringChecks: [
      ...input.unresolvedEngineeringChecks,
      "Pressure-vessel code/design calculation must be independently verified before fabrication release.",
      "Material certification, weld/joint design, relief protection and fabrication tolerances must be reviewed.",
    ],
  };
}
