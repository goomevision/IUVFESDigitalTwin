import { describe, expect, it } from 'vitest';
import { classifyVacuumFlowRegime, regimeConductanceScreeningFactor } from './vacuumFlowRegime';

describe('vacuum flow regime screening', () => {
  it('classifies regime from pressure, temperature and line diameter', () => {
    const atmospheric = classifyVacuumFlowRegime({ absolutePressurePa: 101325, gasTemperatureK: 298.15, characteristicDiameterM: 0.02 });
    const deepVacuum = classifyVacuumFlowRegime({ absolutePressurePa: 1, gasTemperatureK: 298.15, characteristicDiameterM: 0.02 });
    expect(atmospheric.regime).toBe('VISCOUS');
    expect(deepVacuum.regime).toBe('MOLECULAR');
    expect(deepVacuum.knudsenNumber).toBeGreaterThan(atmospheric.knudsenNumber);
  });

  it('uses a lower screening conductance factor outside the viscous regime', () => {
    expect(regimeConductanceScreeningFactor('VISCOUS')).toBe(1);
    expect(regimeConductanceScreeningFactor('TRANSITIONAL')).toBeLessThan(1);
    expect(regimeConductanceScreeningFactor('MOLECULAR')).toBeLessThan(regimeConductanceScreeningFactor('TRANSITIONAL'));
  });
});
