import { if97B23Pressure } from "./if97RegionBoundary";
import { saturationPressureIF97 } from "./if97Region4Saturation";

export type If97RegionSelection = {
  region: 1 | 2 | 3 | 4 | null;
  phase: "LIQUID" | "VAPOR" | "TWO_PHASE" | "UNKNOWN";
  status: "SUPPORTED" | "DATA_GAP" | "OUT_OF_DOMAIN";
  notes: string[];
};

const T_MIN = 273.15;
const T_REGION1_MAX = 623.15;
const T_B23_MAX = 863.15;
const T_REGION2_MAX = 1073.15;
const P_MAX = 100;
const RELATIVE_BOUNDARY_TOL = 1e-8;

export function selectIf97Region(request: { temperatureK: number; pressureMPa: number }): If97RegionSelection {
  const { temperatureK: T, pressureMPa: P } = request;
  const notes: string[] = [];

  if (!Number.isFinite(T) || !Number.isFinite(P) || P <= 0) {
    return { region: null, phase: "UNKNOWN", status: "OUT_OF_DOMAIN", notes: ["T and absolute P must be finite; P must be > 0 MPa."] };
  }
  if (T < T_MIN || T > T_REGION2_MAX || P > P_MAX) {
    return { region: null, phase: "UNKNOWN", status: "OUT_OF_DOMAIN", notes: ["State is outside the currently implemented IF97 Region 1/2/3 routing envelope."] };
  }

  if (T <= T_REGION1_MAX) {
    const sat = saturationPressureIF97(T);
    if (sat.status !== "SUPPORTED") {
      return { region: null, phase: "UNKNOWN", status: "DATA_GAP", notes: ["Saturation pressure could not be resolved for this temperature."] };
    }
    const scale = Math.max(1, Math.abs(sat.pressureMPa));
    if (Math.abs(P - sat.pressureMPa) <= RELATIVE_BOUNDARY_TOL * scale) {
      return { region: 4, phase: "TWO_PHASE", status: "SUPPORTED", notes: ["State is on the Region 4 saturation boundary within numerical tolerance."] };
    }
    if (P > sat.pressureMPa) {
      return { region: 1, phase: "LIQUID", status: "SUPPORTED", notes: ["Pressure is above saturation pressure at the supplied temperature."] };
    }
    return { region: 2, phase: "VAPOR", status: "SUPPORTED", notes: ["Pressure is below saturation pressure at the supplied temperature."] };
  }

  if (T <= T_B23_MAX) {
    const b23 = if97B23Pressure(T);
    if (b23.status !== "SUPPORTED") {
      return { region: null, phase: "UNKNOWN", status: "DATA_GAP", notes: ["B23 boundary could not be resolved."] };
    }
    if (P < b23.pressureMPa) {
      return { region: 2, phase: "VAPOR", status: "SUPPORTED", notes: ["State is below the B23 boundary."] };
    }
    return { region: 3, phase: "UNKNOWN", status: "DATA_GAP", notes: ["Region 3 is selected, but its property solver is not yet connected to the unified engine."] };
  }

  return { region: 2, phase: "VAPOR", status: "SUPPORTED", notes: ["State lies in the currently routed high-temperature Region 2 envelope."] };
}
