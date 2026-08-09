import { describe, expect, it } from 'vitest';
import { ClosedLoopSimulationEngine } from './closedLoopSimulation';

describe('fault propagation through closed-loop simulation', () => {
  const base = {
    targetPressureMbar: 50,
    targetTemperatureC: 50,
    materialWeightKg: 10,
    waterContentPercent: 10,
    oilContentPercent: 20,
    dtSeconds: 1,
    maxSteps: 20,
    realTime: false,
    hardware: {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 250,
      heatingPowerKW: 9,
      coolingPowerKW: 3,
      leakRateMbarPerSecond: 0,
    },
  };

  it('records intended and effective commands for an actuator fault', () => {
    const engine = new ClosedLoopSimulationEngine({
      ...base,
      faultScenario: {
        id: 'pump-unavailable',
        label: 'Vacuum pump unavailable',
        actuatorFaults: [{ type: 'VACUUM_PUMP_UNAVAILABLE', severity: 1 }],
      },
    });

    const result = engine.runToCompletion();
    const frame = result.frames[2];

    expect(frame.intendedCommands.vacuumPump).toBe(true);
    expect(frame.effectiveCommands.vacuumPump).toBe(false);
  });

  it('records physical and observed sensor values for a biased pressure sensor', () => {
    const engine = new ClosedLoopSimulationEngine({
      ...base,
      faultScenario: {
        id: 'pressure-bias',
        label: 'Pressure sensor +20 mbar bias',
        sensorFaults: [{ type: 'PRESSURE_BIAS', severity: 1, value: 20 }],
      },
    });

    const result = engine.runToCompletion();
    const frame = result.frames[1];

    expect(frame.sensorAfter.pressureMbar).toBe(frame.physicalSensorAfter.pressureMbar + 20);
  });
});
