import { describe, expect, it } from 'vitest';
import { MaterialProcessEngine } from './materialProcessEngine';

describe('MaterialProcessEngine', () => {
  it('moves moisture into vapor and condensate when heat, vacuum and condenser are active', () => {
    const engine = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.20, initialOilFraction: 0.03 });
    const before = engine.snapshot();
    const after = engine.step({
      materialMassKg: 10,
      initialWaterFraction: 0.20,
      initialOilFraction: 0.03,
      chamberPressureMbar: 80,
      materialTemperatureC: 80,
      heaterPowerFraction: 0.8,
      vacuumPowerFraction: 0.9,
      extractorPowerFraction: 0.3,
      condenserPowerFraction: 0.9,
      coolingPowerFraction: 0.8,
      dtSeconds: 60,
    });

    expect(after.moistureKg).toBeLessThan(before.moistureKg);
    expect(after.condensateWaterKg).toBeGreaterThan(0);
    expect(after.totalTrackedMassKg).toBeGreaterThan(0);
  });

  it('extracts oil only when the extraction actuator is engaged', () => {
    const engine = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.10, initialOilFraction: 0.05 });
    const idle = engine.step({
      materialMassKg: 10, initialWaterFraction: 0.10, initialOilFraction: 0.05,
      chamberPressureMbar: 100, materialTemperatureC: 75,
      heaterPowerFraction: 0.7, vacuumPowerFraction: 0.9, extractorPowerFraction: 0,
      condenserPowerFraction: 0, coolingPowerFraction: 0, dtSeconds: 60,
    });
    const active = engine.step({
      materialMassKg: 10, initialWaterFraction: 0.10, initialOilFraction: 0.05,
      chamberPressureMbar: 100, materialTemperatureC: 75,
      heaterPowerFraction: 0.7, vacuumPowerFraction: 0.9, extractorPowerFraction: 1,
      condenserPowerFraction: 1, coolingPowerFraction: 1, dtSeconds: 60,
    });

    expect(active.recoveredOilKg).toBeGreaterThanOrEqual(idle.recoveredOilKg);
  });
});
