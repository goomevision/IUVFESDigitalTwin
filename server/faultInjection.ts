/** Deterministic fault-injection / what-if engineering campaign layer. */
import { ClosedLoopSimulationEngine, type ClosedLoopResult, type ClosedLoopSimulationConfig } from './closedLoopSimulation';
import type { VirtualHardwareDynamicsConfig } from './machineDynamics';
import type { FaultPropagationScenario } from './faultPropagation';
export type FaultInjectionType = 'VACUUM_LEAK' | 'PUMP_CAPACITY_DEGRADATION' | 'HEATING_POWER_LOSS' | 'COOLING_POWER_LOSS' | 'THERMAL_MASS_INCREASE' | 'CHAMBER_VOLUME_INCREASE';
export interface FaultInjection { type: FaultInjectionType; severity: number; note?: string; }
export interface FaultInjectionScenario extends FaultPropagationScenario { id: string; label: string; faults: FaultInjection[]; }
export interface FaultInjectionMetrics { status: ClosedLoopResult['status']; steps: number; simulatedSeconds: number; finalPressureMbar: number; finalTemperatureC: number; finalYieldPercent: number; finalEnergyKwh: number; minimumPressureMbar: number; maximumPressureMbar: number; maximumTemperatureC: number; safetyEventCount: number; criticalSafetyEventCount: number; }
export interface FaultInjectionRun { scenario: FaultInjectionScenario; hardware: VirtualHardwareDynamicsConfig; metrics: FaultInjectionMetrics; result: ClosedLoopResult; }
export interface FaultInjectionCampaign { baseline: FaultInjectionRun; scenarios: FaultInjectionRun[]; }
function clampSeverity(value: number): number { return Math.max(0, Math.min(1, value)); }
function cleanNumber(value: number): number { return Number.parseFloat(value.toPrecision(15)); }
export function applyFaultInjection(base: VirtualHardwareDynamicsConfig, fault: FaultInjection): VirtualHardwareDynamicsConfig {
  const severity = clampSeverity(fault.severity); const next = { ...base };
  switch (fault.type) {
    case 'VACUUM_LEAK': next.leakRateMbarPerSecond = cleanNumber((next.leakRateMbarPerSecond ?? 0) + 0.5 * severity); break;
    case 'PUMP_CAPACITY_DEGRADATION': next.pumpCapacityM3h = cleanNumber((next.pumpCapacityM3h ?? 200) * (1 - 0.9 * severity)); break;
    case 'HEATING_POWER_LOSS': next.heatingPowerKW = cleanNumber((next.heatingPowerKW ?? 9) * (1 - severity)); break;
    case 'COOLING_POWER_LOSS': next.coolingPowerKW = cleanNumber((next.coolingPowerKW ?? 3) * (1 - 0.95 * severity)); break;
    case 'THERMAL_MASS_INCREASE': next.thermalMassKJPerC = cleanNumber((next.thermalMassKJPerC ?? 250) * (1 + 2 * severity)); break;
    case 'CHAMBER_VOLUME_INCREASE': next.chamberVolumeL = cleanNumber((next.chamberVolumeL ?? 250) * (1 + 2 * severity)); break;
  }
  return next;
}
export function buildFaultHardwareProfile(base: VirtualHardwareDynamicsConfig, faults: readonly FaultInjection[]): VirtualHardwareDynamicsConfig { return faults.reduce(applyFaultInjection, { ...base }); }
function summarize(result: ClosedLoopResult): FaultInjectionMetrics { const frames = result.frames; const pressures = frames.map((frame) => frame.sensorAfter.pressureMbar); const temperatures = frames.map((frame) => frame.sensorAfter.temperatureC); const last = result.finalSensors; const critical = new Set(['CRITICAL', 'EMERGENCY']); return { status: result.status, steps: frames.length, simulatedSeconds: frames.at(-1)?.timestampSeconds ?? 0, finalPressureMbar: last.pressureMbar, finalTemperatureC: last.temperatureC, finalYieldPercent: last.yieldPercent, finalEnergyKwh: last.energyKwh, minimumPressureMbar: pressures.length ? Math.min(...pressures) : last.pressureMbar, maximumPressureMbar: pressures.length ? Math.max(...pressures) : last.pressureMbar, maximumTemperatureC: temperatures.length ? Math.max(...temperatures) : last.temperatureC, safetyEventCount: result.safetyEvents.length, criticalSafetyEventCount: result.safetyEvents.filter((event) => critical.has(event.severity)).length }; }
export function runFaultInjectionScenario(baseConfig: ClosedLoopSimulationConfig, scenario: FaultInjectionScenario): FaultInjectionRun { const hardware = buildFaultHardwareProfile(baseConfig.hardware ?? {}, scenario.faults); const engine = new ClosedLoopSimulationEngine({ ...baseConfig, hardware, faultScenario: { id: scenario.id, label: scenario.label, sensorFaults: scenario.sensorFaults, actuatorFaults: scenario.actuatorFaults }, realTime: false }); const result = engine.runToCompletion(); return { scenario, hardware, metrics: summarize(result), result }; }
export function runFaultInjectionCampaign(baseConfig: ClosedLoopSimulationConfig, scenarios: readonly FaultInjectionScenario[]): FaultInjectionCampaign { const baseline = runFaultInjectionScenario(baseConfig, { id: 'baseline', label: 'Baseline / no injected fault', faults: [], sensorFaults: [], actuatorFaults: [] }); return { baseline, scenarios: scenarios.map((scenario) => runFaultInjectionScenario(baseConfig, scenario)) }; }
