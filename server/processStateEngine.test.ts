import { describe, expect, it } from 'vitest';
import { ProcessStateEngine, type MachineSensors } from './processStateEngine';

const sensors = (pressureMbar: number, temperatureC: number, yieldPercent = 0, oilRecoveredKg = 0, chamberSealed = true): MachineSensors => ({
  chamberSealed,
  pressureMbar,
  temperatureC,
  yieldPercent,
  oilRecoveredKg,
  waterRemovedKg: 0,
  energyKwh: 0,
});

describe('ProcessStateEngine', () => {
  it('blocks startup when the chamber seal sensor is false', () => {
    const engine = new ProcessStateEngine({ targetPressureMbar: 100, targetTemperatureC: 70 }, sensors(1013.25, 25, 0, 0, false));
    const state = engine.tick(sensors(1013.25, 25, 0, 0, false), 0);
    expect(state.stage).toBe('FAULT');
    expect(state.alarm).toContain('CHAMBER_SEAL_NOT_CONFIRMED');
  });

  it('advances to heat-up only after the vacuum condition is actually reached', () => {
    const engine = new ProcessStateEngine({ targetPressureMbar: 100, targetTemperatureC: 70 }, sensors(900, 25));
    expect(engine.tick(sensors(900, 25), 0).stage).toBe('CHARGE');
    expect(engine.tick(sensors(100, 25), 60).stage).toBe('HEAT_UP');
  });

  it('trips over-temperature and disables the heater', () => {
    const engine = new ProcessStateEngine({ targetPressureMbar: 100, targetTemperatureC: 70, maxTemperatureC: 120 }, sensors(900, 25));
    engine.tick(sensors(900, 25), 0);
    engine.tick(sensors(100, 25), 60);
    const state = engine.tick(sensors(100, 130), 120);
    expect(state.stage).toBe('FAULT');
    expect(state.commands.heater).toBe(false);
    expect(state.alarm).toContain('OVER_TEMPERATURE');
  });

  it('reaches complete only after the cooling interlock is satisfied', () => {
    const engine = new ProcessStateEngine({ targetPressureMbar: 100, targetTemperatureC: 70, coolingTemperatureC: 35 }, sensors(900, 25));
    engine.tick(sensors(900, 25), 0);
    engine.tick(sensors(100, 25), 60);
    engine.tick(sensors(100, 70), 120);
    engine.tick(sensors(100, 70, 99), 180);
    engine.tick(sensors(200, 50, 99), 240);
    expect(engine.tick(sensors(200, 35, 99), 300).stage).toBe('COMPLETE');
  });
});
