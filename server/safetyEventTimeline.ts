/**
 * Converts per-frame safety evidence into an auditable event timeline.
 * This is a simulation evidence layer, not an industrial alarm system.
 */

import type { CausalFrame } from './closedLoopSimulation';
import type { SafetySeverity } from './safetyKernel';

export type SafetyEventType =
  | 'PRESSURE_TRANSIENT'
  | 'TEMPERATURE_TRANSIENT'
  | 'OVER_PRESSURE'
  | 'UNDER_PRESSURE'
  | 'OVER_TEMPERATURE'
  | 'SAFETY_RECOVERY'
  | 'PROCESS_FAULT';

export interface SafetyEvent {
  id: string;
  step: number;
  timestampSeconds: number;
  wallClockTimestampMs?: number;
  type: SafetyEventType;
  severity: SafetySeverity;
  alarm: string;
  pressureMbar: number;
  temperatureC: number;
  pressureRateMbarPerSecond: number;
  temperatureRateCPerSecond: number;
}

function eventTypes(frame: CausalFrame): SafetyEventType[] {
  const events: SafetyEventType[] = [];
  if (frame.safety.overPressure) events.push('OVER_PRESSURE');
  if (frame.safety.underPressure) events.push('UNDER_PRESSURE');
  if (frame.safety.overTemperature) events.push('OVER_TEMPERATURE');
  if (frame.safety.pressureTransient) events.push('PRESSURE_TRANSIENT');
  if (frame.safety.temperatureTransient) events.push('TEMPERATURE_TRANSIENT');
  if (frame.stateAfter?.stage === 'FAULT') events.push('PROCESS_FAULT');
  return events;
}

export function buildSafetyEventTimeline(frames: readonly CausalFrame[]): SafetyEvent[] {
  const events: SafetyEvent[] = [];
  let previousAbnormal = false;

  frames.forEach((frame) => {
    const types = eventTypes(frame);
    const abnormal = types.length > 0;
    for (const type of types) {
      events.push({
        id: `safety-${frame.step}-${type.toLowerCase()}`,
        step: frame.step,
        timestampSeconds: frame.timestampSeconds,
        wallClockTimestampMs: frame.wallClockTimestampMs,
        type,
        severity: frame.safety.severity,
        alarm: frame.safety.alarm ?? frame.stateAfter?.alarm ?? type,
        pressureMbar: frame.sensorAfter.pressureMbar,
        temperatureC: frame.sensorAfter.temperatureC,
        pressureRateMbarPerSecond: frame.safety.pressureRateMbarPerSecond,
        temperatureRateCPerSecond: frame.safety.temperatureRateCPerSecond,
      });
    }
    if (previousAbnormal && !abnormal) {
      events.push({
        id: `safety-${frame.step}-recovery`,
        step: frame.step,
        timestampSeconds: frame.timestampSeconds,
        wallClockTimestampMs: frame.wallClockTimestampMs,
        type: 'SAFETY_RECOVERY',
        severity: 'NORMAL',
        alarm: 'Safety envelope recovered after the preceding abnormal frame.',
        pressureMbar: frame.sensorAfter.pressureMbar,
        temperatureC: frame.sensorAfter.temperatureC,
        pressureRateMbarPerSecond: frame.safety.pressureRateMbarPerSecond,
        temperatureRateCPerSecond: frame.safety.temperatureRateCPerSecond,
      });
    }
    previousAbnormal = abnormal;
  });

  return events;
}
