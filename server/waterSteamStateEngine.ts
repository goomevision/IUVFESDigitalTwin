import { WaterThermoEngine } from './waterThermo';

export type WaterSteamPhase = 'LIQUID' | 'VAPOR' | 'TWO_PHASE' | 'SUPERCRITICAL' | 'UNKNOWN';
export type WaterSteamStateStatus = 'READY_FOR_SIMULATION' | 'DATA_GAP';
export interface WaterSteamState { status: WaterSteamStateStatus; phase: WaterSteamPhase; region: number | null; temperatureK: number; pressureMPa: number; properties: { saturationPressureMPa?: number }; provenance: { standard: 'IAPWS_IF97'; selector: string; propertyAdapter: string; equationPath: string }; notes?: string[]; }

const thermo = new WaterThermoEngine();

export function resolveWaterSteamState(temperatureK: number, pressureMPa: number): WaterSteamState {
  const temperatureC = temperatureK - 273.15;
  const pressureMbar = Math.max(0.1, pressureMPa * 1000);
  if (temperatureC < 0 || temperatureK > 647.096 || pressureMPa <= 0) {
    return { status: 'DATA_GAP', phase: 'UNKNOWN', region: null, temperatureK, pressureMPa, properties: {}, provenance: { standard: 'IAPWS_IF97', selector: 'focused-saturation-adapter', propertyAdapter: 'waterThermo.ts', equationPath: 'out-of-domain or ice state' }, notes: ['Full IF97 multi-region property solving is not implemented in this focused adapter.'] };
  }
  const state = thermo.evaluate(temperatureC, pressureMbar);
  const psatMPa = state.saturationPressureMbar / 1000;
  const phase: WaterSteamPhase = Math.abs(psatMPa - pressureMPa) / Math.max(psatMPa, 1e-9) < 0.02 ? 'TWO_PHASE' : pressureMPa > psatMPa ? 'LIQUID' : 'VAPOR';
  return { status: 'READY_FOR_SIMULATION', phase, region: 4, temperatureK, pressureMPa, properties: { saturationPressureMPa: psatMPa }, provenance: { standard: 'IAPWS_IF97', selector: 'focused-saturation-adapter', propertyAdapter: 'WaterThermoEngine', equationPath: 'IAPWS saturation-pressure correlation' } };
}
