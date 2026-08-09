import { selectIf97Region } from "./if97RegionSelector";
import { region1Properties } from "./if97Region1";
import { region2Properties } from "./if97Region2";
import { saturationPressureIF97 } from "./if97Region4Saturation";

export type WaterSteamState = {
  status: "READY_FOR_SIMULATION" | "DATA_GAP" | "OUT_OF_DOMAIN";
  phase: "LIQUID" | "VAPOR" | "TWO_PHASE" | "UNKNOWN";
  region: number | null;
  temperatureK: number;
  pressureMPa: number;
  properties: Record<string, number>;
  provenance: {
    standard: "IAPWS_IF97";
    selector: "if97RegionSelector";
    propertyAdapter: string;
    equationPath: string;
  };
  notes: string[];
};

/** Single production entry point for currently implemented IF97 state properties. */
export function resolveWaterSteamState(temperatureK: number, pressureMPa: number): WaterSteamState {
  const base = {
    temperatureK,
    pressureMPa,
    properties: {} as Record<string, number>,
    provenance: {
      standard: "IAPWS_IF97" as const,
      selector: "if97RegionSelector" as const,
      propertyAdapter: "direct-region-solver",
      equationPath: "IF97 Region 1/2 Gibbs; Region 4 saturation",
    },
  };

  if (!Number.isFinite(temperatureK) || !Number.isFinite(pressureMPa) || temperatureK <= 0 || pressureMPa <= 0) {
    return {
      ...base,
      status: "OUT_OF_DOMAIN",
      phase: "UNKNOWN",
      region: null,
      notes: ["Temperature must be absolute and pressure must be absolute and positive."],
    };
  }

  const selection = selectIf97Region({ temperatureK, pressureMPa });

  if (selection.region === 1) {
    const state = region1Properties(temperatureK, pressureMPa);
    return {
      ...base,
      status: "READY_FOR_SIMULATION",
      phase: "LIQUID",
      region: 1,
      properties: {
        specificVolumeM3PerKg: state.specificVolumeM3PerKg,
        densityKgPerM3: 1 / state.specificVolumeM3PerKg,
        enthalpyKJPerKg: state.enthalpyJPerKg / 1000,
        internalEnergyKJPerKg: state.internalEnergyJPerKg / 1000,
        entropyKJPerKgK: state.entropyJPerKgK / 1000,
        cpKJPerKgK: state.cpJPerKgK / 1000,
      },
      notes: selection.notes,
    };
  }

  if (selection.region === 2) {
    const state = region2Properties(pressureMPa, temperatureK);
    return {
      ...base,
      status: "READY_FOR_SIMULATION",
      phase: "VAPOR",
      region: 2,
      properties: {
        specificVolumeM3PerKg: state.specificVolumeM3PerKg,
        densityKgPerM3: 1 / state.specificVolumeM3PerKg,
        enthalpyKJPerKg: state.enthalpyKJPerKg,
        internalEnergyKJPerKg: state.internalEnergyKJPerKg,
        entropyKJPerKgK: state.entropyKJPerKgK,
        cpKJPerKgK: state.cpKJPerKgK,
      },
      notes: selection.notes,
    };
  }

  if (selection.region === 4) {
    const saturation = saturationPressureIF97(temperatureK);
    return {
      ...base,
      status: "DATA_GAP",
      phase: "TWO_PHASE",
      region: 4,
      properties: { saturationPressureMPa: saturation.pressureMPa },
      notes: [
        ...selection.notes,
        "Two-phase mixture properties require quality x or equivalent state information; no mixture property is invented here.",
      ],
    };
  }

  return {
    ...base,
    status: selection.status === "OUT_OF_DOMAIN" ? "OUT_OF_DOMAIN" : "DATA_GAP",
    phase: selection.phase,
    region: selection.region,
    notes: selection.notes,
  };
}
