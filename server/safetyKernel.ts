/**
 * IUVFES Digital Twin safety kernel.
 *
 * The kernel evaluates absolute process limits and rates of change. It is a
 * simulation safety layer, not an industrial safety certification or a
 * substitute for vessel/instrument design limits and laboratory validation.
 */

import type { MachineSensors } from './processStateEngine';

export type SafetySeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface SafetyLimits {
  minPressureMbar: number;
  maxPressureMbar: number;
  maxTemperatureC: number;
  maxPressureRateMbarPerSecond: number;
  maxTemperatureRateCPerSecond: number;
}

export interface SafetyEvaluation {
  severity: SafetySeverity;
  alarm: string | null;
  pressureRateMbarPerSecond: number;
  temperatureRateCPerSecond: number;
  pressureTransient: boolean;
  temperatureTransient: boolean;
  overPressure: boolean;
  underPressure: boolean;
  overTemperature: boolean;
}

const DEFAULT_LIMITS: SafetyLimits = {
  minPressureMbar: 1,
  maxPressureMbar: 1100,
  maxTemperatureC: 150,
  maxPressureRateMbarPerSecond: 250,
  maxTemperatureRateCPerSecond: 2,
};

export function evaluateSafety(
  previous: MachineSensors | undefined,
  current: MachineSensors,
  dtSeconds: number,
  overrides: Partial<SafetyLimits> = {},
): SafetyEvaluation {
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  const dt = Math.max(0.001, dtSeconds);
  const previousPressure = previous?.pressureMbar ?? current.pressureMbar;
  const previousTemperature = previous?.temperatureC ?? current.temperatureC;
  const pressureRateMbarPerSecond = (current.pressureMbar - previousPressure) / dt;
  const temperatureRateCPerSecond = (current.temperatureC - previousTemperature) / dt;
  const pressureTransient = Math.abs(pressureRateMbarPerSecond) > limits.maxPressureRateMbarPerSecond;
  const temperatureTransient = Math.abs(temperatureRateCPerSecond) > limits.maxTemperatureRateCPerSecond;
  const overPressure = current.pressureMbar > limits.maxPressureMbar;
  const underPressure = current.pressureMbar < limits.minPressureMbar;
  const overTemperature = current.temperatureC >= limits.maxTemperatureC;

  if (overPressure) return { severity: 'CRITICAL', alarm: 'OVER_PRESSURE: pressure exceeded the configured simulation safety envelope.', pressureRateMbarPerSecond, temperatureRateCPerSecond, pressureTransient, temperatureTransient, overPressure, underPressure, overTemperature };
  if (underPressure) return { severity: 'CRITICAL', alarm: 'UNDER_PRESSURE: pressure crossed the configured minimum simulation limit.', pressureRateMbarPerSecond, temperatureRateCPerSecond, pressureTransient, temperatureTransient, overPressure, underPressure, overTemperature };
  if (overTemperature) return { severity: 'CRITICAL', alarm: 'OVER_TEMPERATURE: temperature exceeded the configured simulation safety envelope.', pressureRateMbarPerSecond, temperatureRateCPerSecond, pressureTransient, temperatureTransient, overPressure, underPressure, overTemperature };
  if (pressureTransient) return { severity: 'WARNING', alarm: 'PRESSURE_TRANSIENT: pressure changed faster than the configured simulation rate limit.', pressureRateMbarPerSecond, temperatureRateCPerSecond, pressureTransient, temperatureTransient, overPressure, underPressure, overTemperature };
  if (temperatureTransient) return { severity: 'WARNING', alarm: 'TEMPERATURE_TRANSIENT: temperature changed faster than the configured simulation rate limit.', pressureRateMbarPerSecond, temperatureRateCPerSecond, pressureTransient, temperatureTransient, overPressure, underPressure, overTemperature };
  return { severity: 'NORMAL', alarm: null, pressureRateMbarPerSecond, temperatureRateCPerSecond, pressureTransient, temperatureTransient, overPressure, underPressure, overTemperature };
}
