import { describe, expect, it } from 'vitest';
import { WaterThermoEngine } from './waterThermo';

describe('water thermodynamics kernel', () => {
  const engine = new WaterThermoEngine();
  it('matches the 100 C saturation-pressure anchor', () => {
    const state = engine.evaluate(100, 1014.18, 1, 1);
    expect(state.saturationPressureMbar).toBeCloseTo(1014.18, 1);
    expect(state.saturationTemperatureC).toBeCloseTo(100, 2);
  });
  it('predicts a strong vapor drive under deep vacuum at moderate temperature', () => {
    const state = engine.evaluate(50, 120, 1, 1);
    expect(state.saturationPressureMbar).toBeGreaterThan(100); expect(state.boilingLikely).toBe(true); expect(state.vaporDrive).toBeGreaterThan(0); expect(state.waterMassVaporizedKg).toBeGreaterThan(0);
  });
  it('does not claim boiling when pressure exceeds saturation pressure', () => {
    const state = engine.evaluate(50, 1000, 1, 1); expect(state.boilingLikely).toBe(false); expect(state.vaporDrive).toBe(0); expect(state.waterMassVaporizedKg).toBe(0);
  });
  it('keeps latent heat positive in the normal process range', () => {
    const low = engine.evaluate(30, 100, 0, 1); const high = engine.evaluate(80, 100, 0, 1); expect(low.latentHeatKjPerKg).toBeGreaterThan(high.latentHeatKjPerKg); expect(high.latentHeatKjPerKg).toBeGreaterThan(0);
  });
});
