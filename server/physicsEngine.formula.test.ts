import { describe, expect, it } from 'vitest';
import { PhysicsSimulationEngine, type SimulationParameters } from './physicsEngine';

const base: SimulationParameters = {
  materialWeight: 10,
  waterContent: 50,
  oilContent: 5,
  targetPressure: 50,
  targetTemperature: 60,
  ultrasonicFrequency: 30,
  duration: 1,
  materialWaterRatio: '1:1',
  processModel: 'distillation',
};

describe('physics formula corrections', () => {
  it('uses the Antoine water equation in the correct pressure unit', async () => {
    const engine = new PhysicsSimulationEngine(base);
    const result = await engine.runSimulation();
    const first = result.realTimeData[0];
    expect(first.pressure).toBeGreaterThanOrEqual(50);
    expect(first.pressure).toBeLessThanOrEqual(1013.25);
    expect(result.finalYield).toBeGreaterThanOrEqual(0);
    expect(result.finalYield).toBeLessThanOrEqual(100);
  });

  it('keeps recovery efficiency bounded by theoretical oil recovery', async () => {
    const result = await new PhysicsSimulationEngine({ ...base, processModel: 'vacuum' }).runSimulation();
    expect(result.efficiency).toBeGreaterThanOrEqual(0);
    expect(result.efficiency).toBeLessThanOrEqual(100);
    expect(result.finalYield).toBe(result.efficiency);
  });

  it('produces a closed mass balance without the previous arbitrary impurity mass', async () => {
    const result = await new PhysicsSimulationEngine(base).runSimulation();
    const m = result.massBalance;
    expect(m.outputOil + m.outputWater + m.outputWaste).toBeCloseTo(m.totalMass, 10);
    expect(m.totalMass).toBeCloseTo(m.inputMaterial, 10);
  });

  it('supports explicit dimensional diffusion geometry', async () => {
    const smallArea = await new PhysicsSimulationEngine({ ...base, processModel: 'vacuum', diffusionAreaM2: 0.5 }).runSimulation();
    const largeArea = await new PhysicsSimulationEngine({ ...base, processModel: 'vacuum', diffusionAreaM2: 1.0 }).runSimulation();
    expect(largeArea.massBalance.outputWater).toBeGreaterThan(smallArea.massBalance.outputWater);
  });
});
