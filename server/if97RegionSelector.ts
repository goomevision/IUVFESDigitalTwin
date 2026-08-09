export type IF97Region = 1 | 2 | 3 | 4 | 5 | null;
export type IF97RegionSelectionStatus = "SUPPORTED_REGION" | "SATURATION_BOUNDARY" | "OUT_OF_DOMAIN" | "DATA_GAP";

export type IF97RegionSelectionRequest = {
  temperatureK: number;
  pressureMPa: number;
  saturationPressureMPa: number;
  b23PressureMPa?: number;
};

export type IF97RegionSelectionResult = {
  status: IF97RegionSelectionStatus;
  region: IF97Region;
  notes: string[];
};

/**
 * Selects an IF97 region after authoritative saturation and B23 calculations
 * have already been supplied by their respective adapters.
 *
 * This module intentionally performs no property calculation. It is a routing
 * boundary only, and returns DATA_GAP when the supplied boundaries are not
 * available or the point is outside the supported IF97 domain.
 */
export function selectIF97Region(
  request: IF97RegionSelectionRequest,
): IF97RegionSelectionResult {
  const { temperatureK: T, pressureMPa: p, saturationPressureMPa: ps } = request;

  if (![T, p, ps].every(Number.isFinite) || p <= 0 || ps <= 0) {
    return { status: "DATA_GAP", region: null, notes: ["Temperature and absolute pressure inputs must be finite; pressures must be positive."] };
  }

  if (T < 273.15 || T > 1073.15 || p > 100) {
    return { status: "OUT_OF_DOMAIN", region: null, notes: ["This selector is limited to the ordinary IF97 domain up to 1073.15 K and 100 MPa."] };
  }

  const saturationToleranceMPa = 1e-7;
  if (Math.abs(p - ps) <= saturationToleranceMPa && T <= 647.096) {
    return { status: "SATURATION_BOUNDARY", region: 4, notes: ["State lies on the supplied saturation boundary within selector tolerance."] };
  }

  if (T <= 623.15) {
    return p > ps
      ? { status: "SUPPORTED_REGION", region: 1, notes: ["Region 1 selected from the liquid side of the saturation boundary."] }
      : { status: "SUPPORTED_REGION", region: 2, notes: ["Region 2 selected from the vapor side of the saturation boundary."] };
  }

  if (T <= 863.15) {
    if (request.b23PressureMPa === undefined || !Number.isFinite(request.b23PressureMPa)) {
      return { status: "DATA_GAP", region: null, notes: ["B23 boundary is required for Region 2/3 selection above 623.15 K."] };
    }

    if (Math.abs(p - request.b23PressureMPa) <= saturationToleranceMPa) {
      return { status: "DATA_GAP", region: null, notes: ["Point lies on the Region 2/3 B23 boundary; property evaluation requires explicit boundary handling."] };
    }

    return p < request.b23PressureMPa
      ? { status: "SUPPORTED_REGION", region: 2, notes: ["Region 2 selected below B23."] }
      : { status: "SUPPORTED_REGION", region: 3, notes: ["Region 3 selected above B23; a Region 3 property solver is required before physical properties are returned."] };
  }

  if (T <= 1073.15) {
    return { status: "SUPPORTED_REGION", region: 2, notes: ["Region 2 selected in the high-temperature IF97 domain below 100 MPa."] };
  }

  return { status: "OUT_OF_DOMAIN", region: null, notes: ["State is outside the selector domain."] };
}
