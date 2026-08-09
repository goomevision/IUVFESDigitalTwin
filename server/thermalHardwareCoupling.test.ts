import { describe, expect, it } from 'vitest';
import { buildCoupledThermalModel } from './thermalHardwareCoupling';

describe('thermal hardware coupling', () => {
  const material = {
    densityKgPerM3: 8000,
    specificHeatKJPerKgC: 0.5,
    thermalConductivityWPerMK: 16,
  };

  it('derives thermal mass from geometry and material', () => {
    const result = buildCoupledThermalModel({
      geometry: { innerDiameterM: 0.6, cylindricalLengthM: 0.884, wallThicknessM: 0.01 },
      material,
      internalFluidMassKg: 50,
      internalFluidSpecificHeatKJPerKgC: 4.18,
    });

    expect(result.derivedShellMassKg).toBeGreaterThan(70);
    expect(result.effectiveThermalMassKJPerC).toBeGreaterThan(result.derivedShellMassKg * 0.5);
    expect(result.modelConfig.thermalMassKJPerC).toBe(result.effectiveThermalMassKJPerC);
  });

  it('reduces the first-order heat-loss coefficient when insulation is added', () => {
    const bare = buildCoupledThermalModel({
      geometry: { innerDiameterM: 0.6, cylindricalLengthM: 0.884, wallThicknessM: 0.01 },
      material,
    });
    const insulated = buildCoupledThermalModel({
      geometry: { innerDiameterM: 0.6, cylindricalLengthM: 0.884, wallThicknessM: 0.01 },
      material,
      insulation: { thicknessM: 0.05, conductivityWPerMK: 0.04 },
    });

    expect(insulated.estimatedHeatLossCoefficientKWPerC).toBeLessThan(bare.estimatedHeatLossCoefficientKWPerC);
  });
});
