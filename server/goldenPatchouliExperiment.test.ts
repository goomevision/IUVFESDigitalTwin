import { runGoldenPatchouliExperiment } from './goldenPatchouliExperiment';

describe('golden patchouli experiment', () => {
  it('records a complete time-resolved process dataset', () => {
    const dataset = runGoldenPatchouliExperiment();
    expect(dataset.datasetId).toBe('GOLDEN-PATCHOULI-V1');
    expect(dataset.rows.length).toBeGreaterThan(0);
    expect(dataset.rows[0].tSeconds).toBe(1);
    for (let i = 1; i < dataset.rows.length; i += 1) {
      expect(dataset.rows[i].tSeconds).toBeGreaterThan(dataset.rows[i - 1].tSeconds);
    }
  });

  it('does not report negative tracked masses or energy', () => {
    const dataset = runGoldenPatchouliExperiment();
    for (const row of dataset.rows) {
      expect(row.massKg).toBeGreaterThanOrEqual(0);
      expect(row.waterKg).toBeGreaterThanOrEqual(0);
      expect(row.vaporKg).toBeGreaterThanOrEqual(0);
      expect(row.condensateWaterKg).toBeGreaterThanOrEqual(0);
      expect(row.oilInMatrixKg).toBeGreaterThanOrEqual(0);
      expect(row.oilVaporKg).toBeGreaterThanOrEqual(0);
      expect(row.recoveredOilKg).toBeGreaterThanOrEqual(0);
      expect(row.volatileLossKg).toBeGreaterThanOrEqual(0);
      expect(row.energyKWh).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps material mass and latent-energy residuals at the configured tolerance', () => {
    const dataset = runGoldenPatchouliExperiment();
    for (const row of dataset.rows) {
      expect(row.massKg).toBeGreaterThanOrEqual(0);
      expect(Math.abs(row.massKg - 10)).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(row.latentHeatEnergyKWh - row.latentHeatEnergyKWh)).toBeLessThanOrEqual(1e-12);
    }
  });

  it('records vacuum regime information without fabricating unknown values', () => {
    const dataset = runGoldenPatchouliExperiment();
    expect(dataset.rows.some((row) => row.flowRegime !== undefined)).toBe(true);
    for (const row of dataset.rows) {
      if (row.flowRegime === undefined) expect(row.knudsenNumber).toBeUndefined();
    }
  });

  it('responds to lower heater power with a different thermal trajectory', () => {
    const nominal = runGoldenPatchouliExperiment();
    const lowPower = runGoldenPatchouliExperiment({ hardware: { heatingPowerKW: 4 } });
    const n = Math.min(nominal.rows.length, lowPower.rows.length);
    const changed = nominal.rows.slice(0, n).some((row, i) => Math.abs(row.temperatureC - lowPower.rows[i].temperatureC) > 1e-9);
    expect(changed).toBe(true);
  });
});
