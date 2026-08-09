/**
 * Causal sensor/actuator fault propagation layer.
 *
 * Physical process state is advanced first, then observation faults transform
 * what the controller sees. Actuator faults transform controller commands before
 * they reach virtual hardware dynamics. This keeps the distinction explicit:
 * physical state -> observation -> controller -> actuator -> dynamics.
 */

import type { MachineCommand, MachineSensors } from './processStateEngine';

export type SensorFaultType =
  | 'PRESSURE_BIAS'
  | 'TEMPERATURE_BIAS'
  | 'PRESSURE_SCALE'
  | 'TEMPERATURE_SCALE'
  | 'PRESSURE_STUCK'
  | 'TEMPERATURE_STUCK';

export type ActuatorFaultType =
  | 'VACUUM_PUMP_UNAVAILABLE'
  | 'HEATER_UNAVAILABLE'
  | 'COOLING_UNAVAILABLE'
  | 'EXTRACTOR_UNAVAILABLE'
  | 'CONDENSER_UNAVAILABLE';

export interface SensorFaultInjection {
  type: SensorFaultType;
  severity: number;
  value?: number;
  note?: string;
}

export interface ActuatorFaultInjection {
  type: ActuatorFaultType;
  severity: number;
  note?: string;
}

export interface FaultPropagationScenario {
  id: string;
  label: string;
  sensorFaults?: SensorFaultInjection[];
  actuatorFaults?: ActuatorFaultInjection[];
}

export interface FaultPropagationResult {
  observedSensors: MachineSensors;
  effectiveCommands: MachineCommand;
  observationFaultsApplied: SensorFaultInjection[];
  actuatorFaultsApplied: ActuatorFaultInjection[];
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function applySensorFault(
  physical: MachineSensors,
  fault: SensorFaultInjection,
  previousObserved?: MachineSensors,
): MachineSensors {
  const next = { ...physical };
  const severity = clamp(fault.severity);
  const value = fault.value ?? severity;

  switch (fault.type) {
    case 'PRESSURE_BIAS':
      next.pressureMbar = Math.max(0, physical.pressureMbar + value * severity);
      break;
    case 'TEMPERATURE_BIAS':
      next.temperatureC = physical.temperatureC + value * severity;
      break;
    case 'PRESSURE_SCALE':
      next.pressureMbar = Math.max(0, physical.pressureMbar * (1 + value * severity));
      break;
    case 'TEMPERATURE_SCALE':
      next.temperatureC = physical.temperatureC * (1 + value * severity);
      break;
    case 'PRESSURE_STUCK':
      next.pressureMbar = previousObserved?.pressureMbar ?? physical.pressureMbar;
      break;
    case 'TEMPERATURE_STUCK':
      next.temperatureC = previousObserved?.temperatureC ?? physical.temperatureC;
      break;
  }

  return next;
}

export function applySensorFaults(
  physical: MachineSensors,
  faults: readonly SensorFaultInjection[],
  previousObserved?: MachineSensors,
): MachineSensors {
  return faults.reduce(
    (observed, fault) => applySensorFault(observed, fault, previousObserved),
    { ...physical },
  );
}

export function applyActuatorFault(
  commands: MachineCommand,
  fault: ActuatorFaultInjection,
): MachineCommand {
  const next = { ...commands };
  const severity = clamp(fault.severity);

  if (severity <= 0) return next;

  switch (fault.type) {
    case 'VACUUM_PUMP_UNAVAILABLE': next.vacuumPump = false; break;
    case 'HEATER_UNAVAILABLE': next.heater = false; break;
    case 'COOLING_UNAVAILABLE': next.cooling = false; break;
    case 'EXTRACTOR_UNAVAILABLE': next.extractor = false; break;
    case 'CONDENSER_UNAVAILABLE': next.condenser = false; break;
  }

  return next;
}

export function applyActuatorFaults(
  commands: MachineCommand,
  faults: readonly ActuatorFaultInjection[],
): MachineCommand {
  return faults.reduce(applyActuatorFault, { ...commands });
}

export function propagateFaults(
  physicalSensors: MachineSensors,
  controllerCommands: MachineCommand,
  scenario: FaultPropagationScenario,
  previousObserved?: MachineSensors,
): FaultPropagationResult {
  const sensorFaults = scenario.sensorFaults ?? [];
  const actuatorFaults = scenario.actuatorFaults ?? [];

  return {
    observedSensors: applySensorFaults(physicalSensors, sensorFaults, previousObserved),
    effectiveCommands: applyActuatorFaults(controllerCommands, actuatorFaults),
    observationFaultsApplied: [...sensorFaults],
    actuatorFaultsApplied: [...actuatorFaults],
  };
}
