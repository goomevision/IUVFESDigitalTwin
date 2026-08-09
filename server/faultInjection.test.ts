import { describe, expect, it } from 'vitest';
import {
  applyFaultInjection,
  buildFaultHardwareProfile,
  runFaultInjectionCampaign,
  runFaultInjectionScenario,
} from './faultInjection';

describe('fault injection / what-if engineering', () => {
  const baseConfig = {
    targetPressureMbar: 50,
    targetTemperatureC: 50,
    materialWeightKg: 10,
    waterContentPercent: 10,
    oilContentPercent: 20,
    dtSeconds: 1,
    maxSteps: 120,
    realTime: false,
    hardware: {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 250,
      heatingPowerKW: 9,
      coolingPowerKW: 3,
      leakRateMbarPerSecond: 0,
    },
  };

  it('does not mutate the base hardware profile', () => {
    const base = { pumpCapacityM3h: 200 };
    const next = applyFaultInjection(base, {
      type: 'PUMP_CAPACITY_DEGRADATION',
      severity: 0.5,
    });

    expect(base.pumpCapacityM3h).toBe(200);
    expect(next.pumpCapacityM3h).toBe(110);
  });

  it('composes multiple faults deterministically', () => {
    const next = buildFaultHardwareProfile(
      { pumpCapacityM3h: 200, leakRateMbarPerSecond: 0 },
      [
        { type: 'PUMP_CAPACITY_DEGRADATION', severity: 0.5 },
        { type: 'VACUUM_LEAK', severity: 0.5 },
      ],
    );

    expect(next.pumpCapacityM3h).toBe(110);
    expect(next.leakRateMbarPerSecond).toBe(0.25);
  });

  it('runs a fault case through the same closed-loop engine', () => {
    const run = runFaultInjectionScenario(baseConfig, {
      id: 'pump-50',
      label: 'Pump capacity reduced by 50%',
      faults: [{ type: 'PUMP_CAPACITY_DEGRADATION', severity: 0.5 }],
    });

    expect(run.hardware.pumpCapacityM3h).toBe(110);
    expect(run.result.frames.length).toBeGreaterThan(0);
    expect(run.metrics.steps).toBe(run.result.frames.length);
    expect(run.metrics.safetyEventCount).toBe(run.result.safetyEvents.length);
  });

  it('produces a baseline plus independent what-if runs', () => {
    const campaign = runFaultInjectionCampaign(baseConfig, [
      {
        id: 'leak-100',
        label: 'Vacuum leak',
        faults: [{ type: 'VACUUM_LEAK', severity: 1 }],
      },
      {
        id: 'heat-loss-50',
        label: 'Heating power loss',
        faults: [{ type: 'HEATING_POWER_LOSS', severity: 0.5 }],
      },
    ]);

    expect(campaign.baseline.scenario.id).toBe('baseline');
    expect(campaign.scenarios).toHaveLength(2);
    expect(campaign.scenarios[0].hardware.leakRateMbarPerSecond).toBe(0.5);
    expect(campaign.scenarios[1].hardware.heatingPowerKW).toBe(4.5);
  });
});
