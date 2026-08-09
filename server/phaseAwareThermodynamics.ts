export type WaterPhase = "LIQUID" | "VAPOR" | "TWO_PHASE" | "UNKNOWN";
export type ThermodynamicStatus = "SUPPORTED" | "DATA_GAP" | "OUT_OF_DOMAIN";

export type WaterStateRequest = {
  temperatureC: number;
  absolutePressureKPa: number;
};

export type WaterStateResult = {
  phase: WaterPhase;
  status: ThermodynamicStatus;
  temperatureC: number;
  absolutePressureKPa: number;
  notes: string[];
};

/**
 * Conservative phase classifier for water.
 *
 * This is intentionally a boundary layer, not a replacement for IAPWS-IF97.
 * The production property resolver must use an authoritative steam-table/
 * IAPWS implementation for saturation and property values.
 */
export function classifyWaterPhase(request: WaterStateRequest): WaterStateResult {
  const { temperatureC, absolutePressureKPa } = request;

  if (!Number.isFinite(temperatureC) || !Number.isFinite(absolutePressureKPa) || absolutePressureKPa <= 0) {
    return {
      phase: "UNKNOWN",
      status: "DATA_GAP",
      temperatureC,
      absolutePressureKPa,
      notes: ["Temperature and absolute pressure must be finite and pressure must be > 0 kPa."],
    };
  }

  // No arbitrary saturation curve is embedded here. Without an authoritative
  // saturation-property resolver, the safe result is DATA_GAP rather than a
  // guessed phase classification.
  return {
    phase: "UNKNOWN",
    status: "DATA_GAP",
    temperatureC,
    absolutePressureKPa,
    notes: [
      "Phase classification requires authoritative saturation properties (e.g. IAPWS) for the requested pressure.",
      "Do not apply a sensible-heat model across an unverified phase boundary.",
    ],
  };
}
