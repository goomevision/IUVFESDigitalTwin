import { describe, expect, it } from 'vitest';
import { ClosedLoopSimulationEngine } from './closedLoopSimulation';

const config = {
  targetPressureMbar: 100,
  targetTemperatureC: 70,
  materialWeightKg: 10,
  waterContentPercent: 20,
  oilContentPercent: 5,
  dtSeconds: 1,
  maxSteps: 1000,
};

const hardware = {
  connectedVolumeL: 250,
  pumpCapacityM3PerHour: 200,
  thermalMassKjPerK: 250,
  heatingPowerKw: 9,
  coolingPowerKw: 3,
  leakRateMbarPerSecond: 0,
};

describe('closed-loop physics closure', () => {
  it('closes the material inventory at every causal frame', () => {
    const engine = new ClosedLoopSimulationEngine(config);

    for (let i = 0; i < 20; i += 1) {
      const frame = engine.step();
      expect(frame).not.toBeNull();

      const inventory = frame!.materialInventory;
      const reconstructedInitialMass =
        inventory.remainingMassKg + inventory.waterRemovedKg + inventory.oilRecoveredKg;

      expect(reconstructedInitialMass).toBeCloseTo(inventory.initialMassKg, 12);
      expect(inventory.waterRemovedKg + inventory.waterRemainingKg).toBeCloseTo(inventory.waterInitialKg, 12);
      expect(inventory.oilRecoveredKg + inventory.oilRemainingPotentialKg).toBeCloseTo(inventory.oilPotentialKg, 12);
    }
  });

  it('closes electrical energy against the dimensional actuator power sum', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    let previousEnergyKwh = 0;

    for (let i = 0; i < 10; i += 1) {
      const frame = engine.step();
      expect(frame).not.toBeNull();

      const diagnostics = frame!.hardwareDiagnostics;
      const levels = frame!.actuatorLevels;
      const expectedIncrementKwh = (
        levels.heater * diagnostics.heatingPowerKw +
        levels.vacuumPump * diagnostics.vacuumPumpPowerKw +
        levels.cooling * diagnostics.coolingPowerKw +
        diagnostics.ultrasonicEffectivePowerKw
      ) / 3600;
      const actualIncrementKwh = frame!.sensorAfter.energyKwh - previousEnergyKwh;

      expect(actualIncrementKwh).toBeCloseTo(expectedIncrementKwh, 12);
      previousEnergyKwh = frame!.sensorAfter.energyKwh;
    }
  });

  it('uses operator heater limits as a physical power constraint', () => {
    const engine = new ClosedLoopSimulationEngine({
      ...config,
      hardware,
    });
    const snapshot = engine.snapshot();
    snapshot.state.stage = 'HEAT_UP';
    snapshot.state.sensors = { ...snapshot.state.sensors, pressureMbar: 100, temperatureC: 25 };
    snapshot.dynamics.state = { ...snapshot.dynamics.state, pressureMbar: 100, temperatureC: 25 };
    snapshot.sensors = { ...snapshot.sensors, pressureMbar: 100, temperatureC: 25 };
    engine.restore(snapshot);
    engine.setOperatorLimits({ heaterMax: 0.25 });

    const frame = engine.step();
    expect(frame).not.toBeNull();
    expect(frame!.actuatorLevels.heater).toBeCloseTo(0.25, 12);
    expect(frame!.sensorAfter.energyKwh).toBeCloseTo((0.25 * 9) / 3600, 12);
  });

  it('preserves deterministic physics across snapshot and restore', () => {
    const original = new ClosedLoopSimulationEngine({ ...config, hardware });
    original.step();
    original.step();
    const snapshot = original.snapshot();

    const restored = new ClosedLoopSimulationEngine({ ...config, hardware });
    restored.restore(snapshot);

    const expected = original.step();
    const actual = restored.step();
    expect(actual).toEqual(expected);
  });

  it('rejects non-physical configuration instead of silently clamping it', () => {
    expect(() => new ClosedLoopSimulationEngine({ ...config, materialWeightKg: Number.NaN })).toThrow(/materialWeightKg/);
    expect(() => new ClosedLoopSimulationEngine({ ...config, targetPressureMbar: 0 })).toThrow(/targetPressureMbar/);
    expect(() => new ClosedLoopSimulationEngine({ ...config, waterContentPercent: 80, oilContentPercent: 30 })).toThrow(/waterContentPercent/);
    expect(() => new ClosedLoopSimulationEngine({ ...config, dtSeconds: 0 })).toThrow(/dtSeconds/);
    expect(() => new ClosedLoopSimulationEngine({ ...config, maxSteps: 1.5 })).toThrow(/maxSteps/);
  });
});
