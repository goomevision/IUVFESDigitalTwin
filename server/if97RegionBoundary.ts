export type B23Result = {
  pressureMPa: number;
  temperatureK: number;
  status: "SUPPORTED" | "OUT_OF_DOMAIN";
  source: "IAPWS_IF97_R7_97_2012";
};

// IAPWS-IF97 B23 boundary coefficients, R7-97(2012), Table 1.
const N1 = 0.34805185628969e3;
const N2 = -0.11671859879975e1;
const N3 = 0.10192970039326e-2;

/**
 * Pressure on the Region 2/3 boundary as a function of absolute temperature.
 * Validity: 623.15 K <= T <= 863.15 K.
 * p is returned in MPa.
 */
export function if97B23Pressure(temperatureK: number): B23Result {
  const valid = Number.isFinite(temperatureK) && temperatureK >= 623.15 && temperatureK <= 863.15;
  if (!valid) {
    return {
      pressureMPa: Number.NaN,
      temperatureK,
      status: "OUT_OF_DOMAIN",
      source: "IAPWS_IF97_R7_97_2012",
    };
  }

  const pressureMPa = N1 + N2 * temperatureK + N3 * temperatureK * temperatureK;
  return {
    pressureMPa,
    temperatureK,
    status: "SUPPORTED",
    source: "IAPWS_IF97_R7_97_2012",
  };
}

export function if97Region23BoundaryTemperature(pressureMPa: number): B23Result {
  const discriminant = N2 * N2 - 4 * N3 * (N1 - pressureMPa);
  if (!Number.isFinite(pressureMPa) || pressureMPa <= 0 || discriminant < 0) {
    return {
      pressureMPa,
      temperatureK: Number.NaN,
      status: "OUT_OF_DOMAIN",
      source: "IAPWS_IF97_R7_97_2012",
    };
  }

  const roots = [
    (-N2 + Math.sqrt(discriminant)) / (2 * N3),
    (-N2 - Math.sqrt(discriminant)) / (2 * N3),
  ].filter((root) => root >= 623.15 && root <= 863.15);

  if (roots.length !== 1) {
    return {
      pressureMPa,
      temperatureK: Number.NaN,
      status: "OUT_OF_DOMAIN",
      source: "IAPWS_IF97_R7_97_2012",
    };
  }

  return {
    pressureMPa,
    temperatureK: roots[0],
    status: "SUPPORTED",
    source: "IAPWS_IF97_R7_97_2012",
  };
}
