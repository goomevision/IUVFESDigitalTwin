export type Region3BoundaryStatus = "SUPPORTED" | "OUT_OF_DOMAIN" | "DATA_GAP";

export type Region3BoundaryResult = {
  status: Region3BoundaryStatus;
  temperatureK: number;
  pressureMPa: number;
  region: 3 | null;
  notes: string[];
};

/**
 * Region 3 boundary/domain gate.
 *
 * Region 3 is governed by the IF97 Helmholtz formulation and a dense set of
 * subregion equations. This module deliberately acts only as a safety gate;
 * it does not fabricate Region 3 properties until the authoritative
 * coefficient tables and subregion mapping are connected and reference-tested.
 */
export function classifyRegion3Boundary(
  temperatureK: number,
  pressureMPa: number,
): Region3BoundaryResult {
  if (!Number.isFinite(temperatureK) || !Number.isFinite(pressureMPa) || pressureMPa <= 0) {
    return {
      status: "DATA_GAP",
      temperatureK,
      pressureMPa,
      region: null,
      notes: ["Absolute temperature and positive absolute pressure are required."],
    };
  }

  const inRegion3TemperatureBand = temperatureK >= 623.15 && temperatureK <= 863.15;
  const inPressureDomain = pressureMPa >= 16.5291643 && pressureMPa <= 100;

  if (!inRegion3TemperatureBand || !inPressureDomain) {
    return {
      status: "OUT_OF_DOMAIN",
      temperatureK,
      pressureMPa,
      region: null,
      notes: ["State is outside the conservative Region 3 gate."],
    };
  }

  return {
    status: "SUPPORTED",
    temperatureK,
    pressureMPa,
    region: 3,
    notes: [
      "Region 3 routing is recognized, but property evaluation remains DATA_GAP until the IF97 Helmholtz subregion solver is reference-tested.",
    ],
  };
}
