import { describe, expect, it } from 'vitest';
import { ClosedLoopSimulationEngine } from './closedLoopSimulation';

describe('closed-loop physics coupling', () => {
  it('carries ultrasonic and water thermodynamic state into causal frames', () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 80,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 20,
      oilContentPercent: 5,
      dtSeconds: 1,
      maxSteps: 10,
      ultrasonic: {
        frequencyHz: 20_000,
        electricalPowerW: 100,
        transducerEfficiency: 0.6,
        activeAreaM2: 0.01,
        provenance: 'DATASHEET',
      },
    });

    const frame = engine.step();
    expect(frame).not.toBeNull();
    expect(frame?.ultrasonic).not.toBeNull();
    expect(frame?.waterThermo.modelStatus).toBe('IAPWS_SATURATION_REDUCED_ORDER_ENERGY');
    expect(frame?.materialInventory.initialMassKg).toBe(10);
  });
});
