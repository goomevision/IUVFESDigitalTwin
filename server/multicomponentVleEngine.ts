export type VleComponent = {
  id: string;
  name: string;
  molecularWeightKgPerKmol: number;
  liquidMoleFraction: number;
  vaporPressureKPaAbs: number;
  enabled: boolean;
};

export type VleResult = {
  temperatureK: number;
  pressureKPaAbs: number;
  components: Array<{
    id: string;
    liquidMoleFraction: number;
    equilibriumK: number;
    vaporMoleFraction: number;
    partialPressureKPaAbs: number;
  }>;
  vaporFraction: number;
  status: "EQUILIBRIUM" | "SINGLE_LIQUID" | "SINGLE_VAPOR" | "INVALID";
  assumptions: string[];
};

function normalize(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) throw new Error("Composition sum must be positive.");
  return values.map((v) => v / sum);
}

/**
 * Ideal-mixture TP flash using Raoult/Dalton assumptions.
 * K_i = Psat_i / P and y_i = K_i x_i.
 * Rachford-Rice is solved by bisection when a two-phase split exists.
 */
export function calculateIdealTpFlash(
  temperatureK: number,
  pressureKPaAbs: number,
  inputComponents: VleComponent[],
): VleResult {
  if (!(temperatureK > 0) || !(pressureKPaAbs > 0)) throw new Error("Temperature and absolute pressure must be positive.");
  if (inputComponents.length === 0) throw new Error("At least one component is required.");

  const components = inputComponents.filter((c) => c.enabled);
  if (components.length === 0) throw new Error("No enabled components.");
  if (components.some((c) => c.vaporPressureKPaAbs < 0 || c.liquidMoleFraction < 0 || c.molecularWeightKgPerKmol <= 0)) {
    throw new Error("Component properties must be finite and physically non-negative.");
  }

  const xFeed = normalize(components.map((c) => c.liquidMoleFraction));
  const K = components.map((c) => c.vaporPressureKPaAbs / pressureKPaAbs);
  const f = (beta: number) => xFeed.reduce((sum, x, i) => sum + (x * (K[i] - 1)) / (1 + beta * (K[i] - 1)), 0);

  if (K.every((k) => k <= 1)) {
    return {
      temperatureK, pressureKPaAbs,
      components: components.map((c, i) => ({ id: c.id, liquidMoleFraction: xFeed[i], equilibriumK: K[i], vaporMoleFraction: 0, partialPressureKPaAbs: 0 })),
      vaporFraction: 0,
      status: "SINGLE_LIQUID",
      assumptions: ["Ideal liquid mixture", "Ideal-gas vapor", "Raoult's law", "Negligible pressure correction"],
    };
  }
  if (K.every((k) => k >= 1)) {
    const y = normalize(xFeed.map((x, i) => x * K[i]));
    return {
      temperatureK, pressureKPaAbs,
      components: components.map((c, i) => ({ id: c.id, liquidMoleFraction: xFeed[i], equilibriumK: K[i], vaporMoleFraction: y[i], partialPressureKPaAbs: y[i] * pressureKPaAbs })),
      vaporFraction: 1,
      status: "SINGLE_VAPOR",
      assumptions: ["Ideal liquid mixture", "Ideal-gas vapor", "Raoult's law", "Negligible pressure correction"],
    };
  }

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  const beta = (lo + hi) / 2;
  const y = normalize(xFeed.map((x, i) => (x * K[i]) / (1 + beta * (K[i] - 1))));

  return {
    temperatureK,
    pressureKPaAbs,
    components: components.map((c, i) => ({ id: c.id, liquidMoleFraction: xFeed[i], equilibriumK: K[i], vaporMoleFraction: y[i], partialPressureKPaAbs: y[i] * pressureKPaAbs })),
    vaporFraction: beta,
    status: "EQUILIBRIUM",
    assumptions: ["Ideal liquid mixture", "Ideal-gas vapor", "Raoult's law", "Negligible pressure correction"],
  };
}
