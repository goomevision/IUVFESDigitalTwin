import { describe, expect, it } from 'vitest';
import { applyActuatorFault, applySensorFault, propagateFaults } from './faultPropagation';
import type { MachineCommand, MachineSensors } from './processStateEngine';

const sensors: MachineSensors = {
  chamberSealed: true,
  pressureMbar: 100,
  temperatureC: 50,
  yieldPercent: 20,
  waterRemovedKg: 1,
  oilRecoveredKg: 2,
  energyKwh: 0.5,
};

const commands: MachineCommand = {
  vacuumPump: true,
  heater: true,
  extractor: true,
  condenser: true,
  cooling: true,
};

describe('causal sensor and actuator fault propagation', () => {
  it('applies pressure bias only to the observed value', () => {
    const observed = applySensorFault(sensors, {
      type: 'PRESSURE_BIAS',
      severity: 1,
      value: 20,
    });

    expect(observed.pressureMbar).toBe(120);
    expect(sensors.pressureMbar).toBe(100);
  });

  it('models a stuck temperature sensor using the previous observation', () => {
    const observed = applySensorFault(
      sensors,
      { type: 'TEMPERATURE_STUCK', severity: 1 },
      { ...sensors, temperatureC: 42 },
    );

    expect(observed.temperatureC).toBe(42);
  });

  it('blocks an unavailable actuator without mutating intended commands', () => {
    const effective = applyActuatorFault(commands, {
      type: 'VACUUM_PUMP_UNAVAILABLE',
      severity: 1,
    });

    expect(commands.vacuumPump).toBe(true);
    expect(effective.vacuumPump).toBe(false);
    expect(effective.heater).toBe(true);
  });

  it('keeps physical state and observed state distinct', () => {
    const physical = { ...sensors, pressureMbar: 80 };
    const result = propagateFaults(
      physical,
      commands,
      {
        id: 'sensor-bias',
        label: 'Pressure sensor bias',
        sensorFaults: [{ type: 'PRESSURE_BIAS', severity: 1, value: 20 }],
      },
    );

    expect(physical.pressureMbar).toBe(80);
    expect(result.observedSensors.pressureMbar).toBe(100);
    expect(result.effectiveCommands).toEqual(commands);
  });
});
