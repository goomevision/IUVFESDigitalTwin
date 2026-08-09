export type SaturationResult = {
  temperatureK: number;
  pressureMPa: number;
  status: "SUPPORTED" | "OUT_OF_DOMAIN";
  equationId: "IF97-REGION4";
};

// IAPWS-IF97 Region 4, Eq. (30), coefficients n1..n10.
// Reference: IAPWS R7-97(2012), Section 8 / Table 34.
const n = [
  0.11670521452767e4,
  -0.72421316703206e6,
  -0.17073846940092e2,
  0.12020824702470e5,
  -0.32325550322333e7,
  0.14915108613530e2,
  -0.48232657361591e4,
  0.40511340542057e6,
  -0.23855557567849e0,
  0.65017534844798e3,
] as const;

const MIN_T_K = 273.15;
const CRITICAL_T_K = 647.096;

export function saturationPressureIF97(temperatureK: number): SaturationResult {
  if (!Number.isFinite(temperatureK) || temperatureK < MIN_T_K || temperatureK > CRITICAL_T_K) {
    return {
      temperatureK,
      pressureMPa: Number.NaN,
      status: "OUT_OF_DOMAIN",
      equationId: "IF97-REGION4",
    };
  }

  // Eq. (30) uses the dimensional temperature transform
  // theta = T + n9 / (T - n10). The previous implementation normalized T
  // before applying the transform, which changes the equation itself and
  // produces incorrect saturation pressures.
  const theta = temperatureK + n[8] / (temperatureK - n[9]);
  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];
  const discriminant = B * B - 4 * A * C;

  if (discriminant < 0 || A === 0) {
    return {
      temperatureK,
      pressureMPa: Number.NaN,
      status: "OUT_OF_DOMAIN",
      equationId: "IF97-REGION4",
    };
  }

  const beta = 2 * C / (-B + Math.sqrt(discriminant));
  const pressureMPa = Math.pow(beta, 4);

  return {
    temperatureK,
    pressureMPa,
    status: "SUPPORTED",
    equationId: "IF97-REGION4",
  };
}
