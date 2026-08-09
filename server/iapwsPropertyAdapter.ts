export type ThermodynamicPropertyStatus = "READY_FOR_REFERENCE" | "DATA_GAP";

export type IapwsPropertyRequest = {
  temperatureK: number;
  pressureMPa: number;
};

export type IapwsPropertyResult = {
  status: ThermodynamicPropertyStatus;
  source: "IAPWS_IF97";
  temperatureK: number;
  pressureMPa: number;
  region: number | null;
  phase: "LIQUID" | "VAPOR" | "TWO_PHASE" | "UNKNOWN";
  properties: Record<string, number>;
  notes: string[];
};

/**
 * Authoritative thermodynamic boundary for water/steam.
 *
 * This module deliberately does not implement IF97 coefficients itself yet.
 * Until the production IF97 implementation is connected and reference-tested,
 * returning DATA_GAP is safer than silently substituting an approximate model.
 */
export function resolveIapwsWaterState(
  request: IapwsPropertyRequest,
): IapwsPropertyResult {
  const valid = Number.isFinite(request.temperatureK)
    && Number.isFinite(request.pressureMPa)
    && request.temperatureK > 0
    && request.pressureMPa > 0;

  if (!valid) {
    return {
      status: "DATA_GAP",
      source: "IAPWS_IF97",
      temperatureK: request.temperatureK,
      pressureMPa: request.pressureMPa,
      region: null,
      phase: "UNKNOWN",
      properties: {},
      notes: ["Temperature must be absolute and pressure must be absolute and positive."],
    };
  }

  return {
    status: "DATA_GAP",
    source: "IAPWS_IF97",
    temperatureK: request.temperatureK,
    pressureMPa: request.pressureMPa,
    region: null,
    phase: "UNKNOWN",
    properties: {},
    notes: [
      "IAPWS-IF97 property evaluation is not silently approximated here.",
      "Connect a verified IF97 region implementation and compare it against the repository reference states before returning physical properties.",
    ],
  };
}
