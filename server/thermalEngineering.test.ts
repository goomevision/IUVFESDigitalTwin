import { describe, expect, it } from 'vitest';
import { estimateHeatingTime, stepThermalModel } from './thermalEngineering';

describe('thermal engineering model', () => {
  it('estimates finite heating time when heater overcomes heat loss', () => {
    const result = estimateHeatingTime({
      initialTemperatureC: 25,
      ambientTemperatureC: 25,
      targetTemperatureC: 60,
      thermalMassKJPerC: 250,
      heaterPowerKW: 9,
      coolingPowerKW: 0,
      effectiveHeatLossKWPerC: 0,
    });
    expect(result.reachable).toBe(true);
    expect(result.estimatedSeconds).toBeCloseTo(972.222, 1);
  });

  it('rejects a target above the modeled thermal equilibrium', () => {
    const result = estimateHeatingTime({
      initialTemperatureC: 25,
      ambientTemperatureC: 25,
      targetTemperatureC: 100,
      thermalMassKJPerC: 250,
      heaterPowerKW: 9,
      coolingPowerKW: 0,
      effectiveHeatLossKWPerC: 0.2,
    });
    expect(result.reachable).toBe(false);
    expect(result.estimatedSeconds).toBeNull();
  });

  it('changes temperature according to real elapsed model time', () => {
    const oneSecond = stepThermalModel({
      initialTemperatureC: 25,
      ambientTemperatureC: 25,
      targetTemperatureC: 60,
      thermalMassKJPerC: 250,
      heaterPowerKW: 9,
      coolingPowerKW: 0,
      effectiveHeatLossKWPerC: 0,
    }, 1);
    expect(oneSecond.temperatureC).toBeCloseTo(25.036, 3);
    expect(oneSecond.energyAddedKWh).toBeCloseTo(0.0025, 6);
  });
});
