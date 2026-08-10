/**
 * Labelled experimental ultrasonic channel.
 *
 * This is intentionally NOT a validated cavitation model. It converts operator
 * settings into bounded, traceable model outputs so experiments can generate
 * data for later calibration against laboratory measurements.
 */
export interface UltrasonicConfig {
  frequencyKHz?: number;
  maxElectricalPowerW?: number;
  requestedPowerW?: number;
  dutyCyclePercent?: number;
  acousticEfficiency?: number;
  enhancementCoefficient?: number;
}

export interface UltrasonicExperimentalFrame {
  sourceType: 'MODELLED';
  modelStatus: 'EXPERIMENTAL_DATA_LIMITED';
  frequencyKHz: number;
  requestedPowerW: number;
  effectivePowerW: number;
  dutyCyclePercent: number;
  estimatedAcousticPowerW: number;
  activityIndex: number;
  massTransferMultiplier: number;
  calibrationReady: boolean;
}

const DEFAULT_FREQUENCY_KHZ = 30;
const DEFAULT_MAX_POWER_W = 3000;
const DEFAULT_EFFICIENCY = 0.72;
const DEFAULT_ENHANCEMENT = 0.25;

export function evaluateUltrasonic(config: UltrasonicConfig = {}): UltrasonicExperimentalFrame {
  const frequencyKHz = Math.max(1, Math.min(200, config.frequencyKHz ?? DEFAULT_FREQUENCY_KHZ));
  const maxElectricalPowerW = Math.max(0, config.maxElectricalPowerW ?? DEFAULT_MAX_POWER_W);
  const requestedPowerW = Math.max(0, config.requestedPowerW ?? 0);
  const effectivePowerW = Math.min(requestedPowerW, maxElectricalPowerW);
  const dutyCyclePercent = Math.max(0, Math.min(100, config.dutyCyclePercent ?? 0));
  const acousticEfficiency = Math.max(0, Math.min(1, config.acousticEfficiency ?? DEFAULT_EFFICIENCY));
  const enhancementCoefficient = Math.max(0, Math.min(2, config.enhancementCoefficient ?? DEFAULT_ENHANCEMENT));
  const powerFraction = maxElectricalPowerW > 0 ? effectivePowerW / maxElectricalPowerW : 0;
  const dutyFraction = dutyCyclePercent / 100;

  // Activity is an intentionally simple, bounded experimental index.
  // Frequency is recorded but is NOT asserted to be a validated cavitation law.
  const activityIndex = Math.max(0, Math.min(1, powerFraction * dutyFraction));
  const estimatedAcousticPowerW = effectivePowerW * acousticEfficiency;
  const massTransferMultiplier = 1 + enhancementCoefficient * activityIndex;

  return {
    sourceType: 'MODELLED',
    modelStatus: 'EXPERIMENTAL_DATA_LIMITED',
    frequencyKHz,
    requestedPowerW,
    effectivePowerW,
    dutyCyclePercent,
    estimatedAcousticPowerW,
    activityIndex,
    massTransferMultiplier,
    calibrationReady: false,
  };
}
