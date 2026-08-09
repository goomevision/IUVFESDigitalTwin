import { classifyWaterPhase } from "./phaseAwareThermodynamics";
import { selectIf97Region } from "./if97RegionSelector";
import { resolveIapwsWaterState } from "./iapwsPropertyAdapter";

export type WaterSteamState = {
  status: "ROUTED" | "DATA_GAP" | "OUT_OF_DOMAIN";
  phase: "LIQUID" | "VAPOR" | "TWO_PHASE" | "UNKNOWN";
  region: number | null;
  temperatureK: number;
  pressureMPa: number;
  properties: Record<string, number>;
  provenance: {
    standard: "IAPWS_IF97";
    selector: string;
    propertyAdapter: string;
  };
  notes: string[];
};

/**
 * Single entry point for water/steam thermodynamics.
 *
 * The router is intentionally conservative: region selection can succeed
 * before property evaluation is available. In that case the state remains
 * DATA_GAP and no invented properties are returned.
 */
export function resolveWaterSteamState(
  temperatureK: number,
  pressureMPa: number,
): WaterSteamState {
  const base = {
    temperatureK,
    pressureMPa,
    properties: {},
    provenance: {
      standard: "IAPWS_IF97" as const,
      selector: "if97RegionSelector",
      propertyAdapter: "iapwsPropertyAdapter",
    },
    notes: [] as string[],
  };

  if (!Number.isFinite(temperatureK) || !Number.isFinite(pressureMPa) || temperatureK <= 0 || pressureMPa <= 0) {
    return {
      ...base,
      status: "DATA_GAP",
      phase: "UNKNOWN",
      region: null,
      notes: ["Temperature must be absolute and pressure must be absolute and positive."],
    };
  }

  const phase = classifyWaterPhase({ temperatureC: temperatureK - 273.15, absolutePressureKPa: pressureMPa * 1000 });
  const region = selectIf97Region({ temperatureK, pressureMPa });
  const properties = resolveIapwsWaterState({ temperatureK, pressureMPa });

  const notes = [...phase.notes, ...region.notes, ...properties.notes];
  const routedRegion = region.region ?? null;
  const routedPhase = region.region === 1 ? "LIQUID" : region.region === 2 ? "VAPOR" : region.region === 4 ? "TWO_PHASE" : "UNKNOWN";

  return {
    ...base,
    status: properties.status === "READY_FOR_REFERENCE" ? "ROUTED" : "DATA_GAP",
    phase: routedPhase,
    region: routedRegion,
    notes,
  };
}
