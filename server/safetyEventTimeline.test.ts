import { describe, expect, it } from 'vitest';
import { buildSafetyEventTimeline } from './safetyEventTimeline';
import type { CausalFrame } from './closedLoopSimulation';

function frame(step: number, pressureRate: number, severity: 'NORMAL' | 'WARNING' | 'CRITICAL', alarm: string | null, stage: CausalFrame['stateAfter']['stage'] = 'VACUUM'): CausalFrame {
  return {
    step,
    timestampSeconds: step,
    sensorBefore: { chamberSealed: true, pressureMbar: 500, temperatureC: 40, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
    controller: { stage, progress: 0.2, elapsedSeconds: step, sensors: { chamberSealed: true, pressureMbar: 500, temperatureC: 40, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 }, commands: { vacuumPump: true, heater: false, extractor: false, condenser: false, cooling: false }, interlocks: { chamberSealed: true, pressureSafeForHeating: true, temperatureSafeForCooling: false, overTemperature: false, vacuumAchieved: false, allSystemsSafe: severity === 'NORMAL', pressureTransient: severity !== 'NORMAL', temperatureTransient: false, overPressure: false, underPressure: false, pressureRateMbarPerSecond: pressureRate, temperatureRateCPerSecond: 0 }, alarm, transitionReason: '' },
    sensorAfter: { chamberSealed: true, pressureMbar: 500, temperatureC: 40, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
    stateAfter: { stage, progress: 0.2, elapsedSeconds: step, sensors: { chamberSealed: true, pressureMbar: 500, temperatureC: 40, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 }, commands: { vacuumPump: true, heater: false, extractor: false, condenser: false, cooling: false }, interlocks: { chamberSealed: true, pressureSafeForHeating: true, temperatureSafeForCooling: false, overTemperature: false, vacuumAchieved: false, allSystemsSafe: severity === 'NORMAL', pressureTransient: severity !== 'NORMAL', temperatureTransient: false, overPressure: false, underPressure: false, pressureRateMbarPerSecond: pressureRate, temperatureRateCPerSecond: 0 }, alarm, transitionReason: '' },
    safety: { severity, alarm, pressureRateMbarPerSecond: pressureRate, temperatureRateCPerSecond: 0, pressureTransient: severity !== 'NORMAL', temperatureTransient: false, overPressure: false, underPressure: false, overTemperature: false },
    paused: false,
  };
}

describe('safety event timeline', () => {
  it('records transient events and a recovery event', () => {
    const events = buildSafetyEventTimeline([
      frame(1, 0, 'NORMAL', null),
      frame(2, 300, 'WARNING', 'PRESSURE_TRANSIENT'),
      frame(3, 0, 'NORMAL', null),
    ]);

    expect(events.map((event) => event.type)).toEqual(['PRESSURE_TRANSIENT', 'SAFETY_RECOVERY']);
    expect(events[0].step).toBe(2);
    expect(events[1].step).toBe(3);
  });

  it('records a process fault independently of a rate transient', () => {
    const events = buildSafetyEventTimeline([frame(1, 0, 'CRITICAL', 'OVER_PRESSURE', 'FAULT')]);
    expect(events.map((event) => event.type)).toEqual(['PROCESS_FAULT']);
  });
});
