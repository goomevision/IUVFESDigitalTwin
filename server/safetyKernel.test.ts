import { describe, expect, it } from 'vitest';
import { evaluateSafety } from './safetyKernel';
import type { MachineSensors } from './processStateEngine';

const sensors = (pressureMbar: number, temperatureC: number): MachineSensors => ({
  chamberSealed: true,
  pressureMbar,
  temperatureC,
  yieldPercent: 0,
  waterRemovedKg: 0,
  oilRecoveredKg: 0,
  energyKwh: 0,
});

describe('safety kernel', () => {
  it('raises a warning for a pressure transient without declaring a fault', () => {
    const result = evaluateSafety(sensors(700, 50), sensors(300, 50), 0.5);
    expect(result.pressureTransient).toBe(true);
    expect(result.severity).toBe('WARNING');
    expect(result.alarm).toContain('PRESSURE_TRANSIENT');
  });

  it('raises a critical condition for over-pressure', () => {
    const result = evaluateSafety(sensors(1000, 50), sensors(1200, 50), 1);
    expect(result.overPressure).toBe(true);
    expect(result.severity).toBe('CRITICAL');
  });

  it('keeps a normal, gradual process inside the envelope', () => {
    const result = evaluateSafety(sensors(700, 50), sensors(693, 50.5), 1);
    expect(result.severity).toBe('NORMAL');
    expect(result.alarm).toBeNull();
  });
});
