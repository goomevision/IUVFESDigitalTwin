import { describe, expect, it } from 'vitest';
import { MaterialProcessEngine } from './materialProcessEngine';

describe('material process thermodynamic coupling', () => {
  it('records IF97 water-state provenance and saturation pressure', () => {
    const engine = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.2, initialOilFraction: 0.05 });
    const inventory = engine.step({
      materialMassKg: 10, initialWaterFraction: 0.2, initialOilFraction: 0.05,
      chamberPressureMbar: 200, materialTemperatureC: 60,
      heaterPowerFraction: 1, vacuumPowerFraction: 1,
      extractorPowerFraction: 0, condenserPowerFraction: 1,
      coolingPowerFraction: 1, dtSeconds: 1,
    });
    expect(inventory.waterStateProvenance.standard).toBe('IAPWS_IF97');
    expect(inventory.saturationPressureMbar).toBeGreaterThan(0);
    expect(inventory.waterPhase).toBeDefined();
  });

  it('does not invent an ice correlation for frozen material', () => {
    const engine = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.7, initialOilFraction: 0.05 });
    const inventory = engine.step({
      materialMassKg: 10, initialWaterFraction: 0.7, initialOilFraction: 0.05,
      chamberPressureMbar: 1, materialTemperatureC: -20,
      heaterPowerFraction: 0, vacuumPowerFraction: 1,
      extractorPowerFraction: 0, condenserPowerFraction: 1,
      coolingPowerFraction: 0, dtSeconds: 1,
    });
    expect(inventory.waterPhase).toBe('ICE');
    expect(inventory.waterStateStatus).toBe('DATA_GAP');
    expect(inventory.moistureKg).toBeCloseTo(7, 10);
  });

  it('responds to saturation-pressure margin rather than only a fixed pressure factor', () => {
    const engineA = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.5, initialOilFraction: 0 });
    const engineB = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.5, initialOilFraction: 0 });
    const common = {
      materialMassKg: 10, initialWaterFraction: 0.5, initialOilFraction: 0,
      materialTemperatureC: 60, heaterPowerFraction: 1, vacuumPowerFraction: 1,
      extractorPowerFraction: 0, condenserPowerFraction: 0,
      coolingPowerFraction: 0, dtSeconds: 10,
    };
    const highPressure = engineA.step({ ...common, chamberPressureMbar: 800 });
    const lowPressure = engineB.step({ ...common, chamberPressureMbar: 200 });
    expect(lowPressure.moistureKg).toBeLessThanOrEqual(highPressure.moistureKg);
  });

  it('closes the extractor-to-condenser material path without inventing recovery', () => {
    const engine = new MaterialProcessEngine({ materialMassKg: 10, initialWaterFraction: 0.2, initialOilFraction: 0.05 });
    const extraction = engine.step({
      materialMassKg: 10, initialWaterFraction: 0.2, initialOilFraction: 0.05,
      chamberPressureMbar: 200, materialTemperatureC: 60,
      heaterPowerFraction: 1, vacuumPowerFraction: 1,
      extractorPowerFraction: 1, condenserPowerFraction: 0,
      coolingPowerFraction: 0, dtSeconds: 60,
    });

    expect(extraction.oilInMatrixKg).toBeLessThan(0.5);
    expect(extraction.oilVaporKg).toBeGreaterThan(0);
    expect(extraction.recoveredOilKg).toBe(0);

    const condensed = engine.step({
      materialMassKg: 10, initialWaterFraction: 0.2, initialOilFraction: 0.05,
      chamberPressureMbar: 200, materialTemperatureC: 60,
      heaterPowerFraction: 1, vacuumPowerFraction: 1,
      extractorPowerFraction: 0, condenserPowerFraction: 1,
      coolingPowerFraction: 1, dtSeconds: 1,
    });

    expect(condensed.oilVaporKg).toBeLessThan(extraction.oilVaporKg);
    expect(condensed.recoveredOilKg).toBeGreaterThan(0);
    expect(condensed.oilRecoveryFraction).toBeGreaterThan(0);
    expect(condensed.massBalanceResidualKg).toBe(0);
    expect(condensed.energyBalanceResidualKWh).toBe(0);
  });
});
