export type VibrationMedium = {
  mediumId: string;
  volumeL: number;
  temperatureC: number;
  densityKgM3: number;
  heatCapacityJKgK: number;
  frequencyHz: number;
  electricalPowerW: number;
  dutyCycle: number;
  transducerEfficiency?: number;
  depthM?: number;
};

export type VibrationState = {
  mediumVolumeL: number;
  inputEnergyWh: number;
  depositedMechanicalEnergyWh: number;
  thermalEnergyWh: number;
};

export function estimateVibrationEnergyStep(medium: VibrationMedium, dtS: number, previousEnergyWh = 0): VibrationState {
  if (medium.volumeL <= 0 || medium.densityKgM3 <= 0 || medium.frequencyHz <= 0 || dtS <= 0) throw new Error("Invalid vibration-medium inputs.");
  const duty = Math.min(1, Math.max(0, medium.dutyCycle));
  const efficiency = Math.min(1, Math.max(0, medium.transducerEfficiency ?? 1));
  const inputEnergyWh = Math.max(0, medium.electricalPowerW) * duty * dtS / 3600;
  const depositedMechanicalEnergyWh = inputEnergyWh * efficiency;
  return {
    mediumVolumeL: medium.volumeL,
    inputEnergyWh: previousEnergyWh + inputEnergyWh,
    depositedMechanicalEnergyWh,
    thermalEnergyWh: depositedMechanicalEnergyWh,
  };
}
