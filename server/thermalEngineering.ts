/**
 * Lumped thermal engineering model for the virtual hardware layer.
 *
 * This model is an engineering simulation aid, not a CFD model, thermal
 * qualification, or safety certification. Parameters must retain provenance.
 */

export interface ThermalEngineeringInput {
  initialTemperatureC: number;
  ambientTemperatureC: number;
  targetTemperatureC: number;
  thermalMassKJPerC: number;
  heaterPowerKW: number;
  coolingPowerKW: number;
  effectiveHeatLossKWPerC: number;
  heaterEfficiency?: number;
  coolingEfficiency?: number;
}

export interface ThermalStepResult {
  temperatureC: number;
  netHeatKW: number;
  energyAddedKWh: number;
  heatLossKWh: number;
  coolingRemovedKWh: number;
  reachedTarget: boolean;
  warning?: string;
}

export interface ThermalTimeEstimate {
  reachable: boolean;
  estimatedSeconds: number | null;
  netPowerKW: number;
  limitingFactor?: string;
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function validate(input: ThermalEngineeringInput): string[] {
  const errors: string[] = [];
  if (!finite(input.initialTemperatureC)) errors.push('initialTemperatureC must be finite.');
  if (!finite(input.ambientTemperatureC)) errors.push('ambientTemperatureC must be finite.');
  if (!finite(input.targetTemperatureC)) errors.push('targetTemperatureC must be finite.');
  if (!finite(input.thermalMassKJPerC) || input.thermalMassKJPerC <= 0) errors.push('thermalMassKJPerC must be greater than zero.');
  if (!finite(input.heaterPowerKW) || input.heaterPowerKW < 0) errors.push('heaterPowerKW must be non-negative.');
  if (!finite(input.coolingPowerKW) || input.coolingPowerKW < 0) errors.push('coolingPowerKW must be non-negative.');
  if (!finite(input.effectiveHeatLossKWPerC) || input.effectiveHeatLossKWPerC < 0) errors.push('effectiveHeatLossKWPerC must be non-negative.');
  return errors;
}

export function estimateHeatingTime(input: ThermalEngineeringInput): ThermalTimeEstimate {
  const errors = validate(input);
  if (errors.length > 0) {
    return { reachable: false, estimatedSeconds: null, netPowerKW: 0, limitingFactor: errors.join(' ') };
  }
  const efficiency = Math.min(1, Math.max(0, input.heaterEfficiency ?? 1));
  const netPowerKW = input.heaterPowerKW * efficiency;
  const deltaT = input.targetTemperatureC - input.initialTemperatureC;
  if (deltaT <= 0) return { reachable: true, estimatedSeconds: 0, netPowerKW };

  // A lumped model: dT/dt = (heater - heat loss*(T-ambient))/thermal mass.
  const lossAtTarget = input.effectiveHeatLossKWPerC * Math.max(0, input.targetTemperatureC - input.ambientTemperatureC);
  const availableAtTarget = netPowerKW - lossAtTarget;
  if (availableAtTarget <= 0) {
    return { reachable: false, estimatedSeconds: null, netPowerKW: availableAtTarget, limitingFactor: 'Heating power cannot overcome modeled heat loss at the target temperature.' };
  }

  // Exact first-order solution for constant heater power and linear heat loss.
  const k = input.effectiveHeatLossKWPerC;
  if (k === 0) {
    return { reachable: true, estimatedSeconds: (input.thermalMassKJPerC * deltaT) / netPowerKW, netPowerKW };
  }
  const equilibriumDelta = netPowerKW / k;
  const startDelta = input.initialTemperatureC - input.ambientTemperatureC;
  const targetDelta = input.targetTemperatureC - input.ambientTemperatureC;
  const remainingRatio = (equilibriumDelta - targetDelta) / Math.max(equilibriumDelta - startDelta, Number.EPSILON);
  if (remainingRatio <= 0 || remainingRatio >= 1) {
    return { reachable: false, estimatedSeconds: null, netPowerKW: availableAtTarget, limitingFactor: 'Target is outside the modeled thermal equilibrium.' };
  }
  const estimatedSeconds = -(input.thermalMassKJPerC / k) * Math.log(remainingRatio);
  return { reachable: Number.isFinite(estimatedSeconds), estimatedSeconds: Number.isFinite(estimatedSeconds) ? estimatedSeconds : null, netPowerKW: availableAtTarget };
}

export function stepThermalModel(input: ThermalEngineeringInput, dtSeconds: number): ThermalStepResult {
  const errors = validate(input);
  if (errors.length > 0 || !finite(dtSeconds) || dtSeconds < 0) {
    return { temperatureC: input.initialTemperatureC, netHeatKW: 0, energyAddedKWh: 0, heatLossKWh: 0, coolingRemovedKWh: 0, reachedTarget: false, warning: errors.concat('dtSeconds must be non-negative and finite.').join(' ') };
  }
  const heaterEfficiency = Math.min(1, Math.max(0, input.heaterEfficiency ?? 1));
  const coolingEfficiency = Math.min(1, Math.max(0, input.coolingEfficiency ?? 1));
  const energyAddedKWh = input.heaterPowerKW * heaterEfficiency * dtSeconds / 3600;
  const coolingRemovedKWh = input.coolingPowerKW * coolingEfficiency * dtSeconds / 3600;
  const deltaAmbient = Math.max(0, input.initialTemperatureC - input.ambientTemperatureC);
  const heatLossKWh = input.effectiveHeatLossKWPerC * deltaAmbient * dtSeconds / 3600;
  const netHeatKW = input.heaterPowerKW * heaterEfficiency - input.coolingPowerKW * coolingEfficiency - input.effectiveHeatLossKWPerC * deltaAmbient;
  const deltaT = (netHeatKW * dtSeconds) / input.thermalMassKJPerC;
  const temperatureC = input.initialTemperatureC + deltaT;
  const direction = input.targetTemperatureC >= input.initialTemperatureC ? temperatureC >= input.targetTemperatureC : temperatureC <= input.targetTemperatureC;
  return { temperatureC, netHeatKW, energyAddedKWh, heatLossKWh, coolingRemovedKWh, reachedTarget: direction };
}
