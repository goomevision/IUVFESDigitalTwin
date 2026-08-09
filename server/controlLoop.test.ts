import { describe, expect, it } from 'vitest';
import { ProcessControlLoop, PIDController } from './controlLoop';

describe('PIDController', () => {
  it('drives output toward the setpoint', () => {
    const pid = new PIDController({ kp: 1, ki: 0, kd: 0, minOutput: 0, maxOutput: 1 });
    expect(pid.update(100, 0, 1)).toBe(1);
    expect(pid.update(100, 99.9, 1)).toBeGreaterThan(0);
  });
});

describe('ProcessControlLoop', () => {
  it('opens the correct valves for extraction', () => {
    const loop = new ProcessControlLoop();
    const output = loop.update({ targetTemperatureC: 70, targetPressureMbar: 100, temperatureC: 40, pressureMbar: 500, stage: 'EXTRACTION', dtSeconds: 1 });
    expect(output.heaterPower).toBeGreaterThan(0);
    expect(output.vacuumPumpPower).toBeGreaterThan(0);
    expect(output.valve.vacuumIsolation).toBe(1);
    expect(output.valve.vaporToCondenser).toBe(1);
  });

  it('closes process valves outside an active process stage', () => {
    const loop = new ProcessControlLoop();
    const output = loop.update({ targetTemperatureC: 70, targetPressureMbar: 100, temperatureC: 40, pressureMbar: 500, stage: 'COMPLETE', dtSeconds: 1 });
    expect(output.heaterPower).toBe(0);
    expect(output.vacuumPumpPower).toBe(0);
    expect(output.valve.vacuumIsolation).toBe(0);
  });
});
