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

      const hardware = frame!.hardwareDiagnostics;
      const levels = frame!.actuatorLevels;
      const expectedIncrementKwh = (
        levels.heater * hardware.heatingPowerKw +
        levels.vacuumPump * hardware.vacuumPumpPowerKw +
        levels.cooling * hardware.coolingPowerKw +
        hardware.ultrasonicEffectivePowerKw
      ) / 3600;
      const actualIncrementKwh = frame!.sensorAfter.energyKwh - previousEnergyKwh;

      expect(actualIncrementKwh).toBeCloseTo(expectedIncrementKwh, 12);
      previousEnergyKwh = frame!.sensorAfter.energyKwh;
    }
  });

  it('uses operator heater limits as a physical power constraint', () => {
    const engine = new ClosedLoopSimulationEngine({
      ...config,
      hardware: { heatingPowerKw: 9 },
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
});
