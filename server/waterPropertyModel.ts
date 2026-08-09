export type PropertyEvaluation = {
  property: "vaporPressure";
  value: number;
  unit: "bar_abs";
  temperatureK: number;
  validRangeK: [number, number];
  sourceId: string;
  sourceReference: string;
};

// NIST Chemistry WebBook SRD 69, Antoine coefficients for water.
// This segment is valid for 273 K <= T <= 303 K and returns absolute pressure.
const A = 5.40221;
const B = 1838.675;
const C = -31.737;
const RANGE: [number, number] = [273, 303];
const SOURCE_ID = "NIST-WATER-ANTOINE-BRIDGEMAN-ALDRICH-273-303K";

export function waterVaporPressureBarAbs(temperatureK: number): PropertyEvaluation {
  if (!Number.isFinite(temperatureK) || temperatureK < RANGE[0] || temperatureK > RANGE[1]) {
    throw new Error(`Water vapor-pressure model is only valid from ${RANGE[0]} K to ${RANGE[1]} K.`);
  }
  const log10P = A - B / (temperatureK + C);
  return {
    property: "vaporPressure",
    value: 10 ** log10P,
    unit: "bar_abs",
    temperatureK,
    validRangeK: RANGE,
    sourceId: SOURCE_ID,
    sourceReference: "NIST Chemistry WebBook SRD 69; Antoine coefficients, Bridgeman and Aldrich (1964).",
  };
}
