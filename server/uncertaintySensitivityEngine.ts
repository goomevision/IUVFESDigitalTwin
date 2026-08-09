export type ParameterRange = {
  id: string;
  nominal: number;
  min: number;
  max: number;
};

export type OutputSample = {
  parameterId: string;
  value: number;
  output: number;
};

export type UncertaintySensitivityResult = {
  parameterId: string;
  nominal: number;
  range: { min: number; max: number };
  absoluteOutputSpan: number;
  normalizedSensitivity: number;
  samples: OutputSample[];
};

/**
 * Deterministic one-at-a-time sensitivity analysis.
 * The caller supplies outputs from the authoritative physics/simulation model.
 * This module does not invent a physical response function.
 */
export function analyzeOneAtATimeSensitivity(
  parameters: ParameterRange[],
  evaluate: (parameterId: string, value: number) => number,
): UncertaintySensitivityResult[] {
  return parameters.map((parameter) => {
    if (!(parameter.min <= parameter.nominal && parameter.nominal <= parameter.max)) {
      throw new Error(`Invalid range for parameter ${parameter.id}.`);
    }

    const low = evaluate(parameter.id, parameter.min);
    const nominalOutput = evaluate(parameter.id, parameter.nominal);
    const high = evaluate(parameter.id, parameter.max);
    if (![low, nominalOutput, high].every(Number.isFinite)) {
      throw new Error(`Non-finite simulation output for parameter ${parameter.id}.`);
    }

    const span = Math.abs(high - low);
    const inputSpan = parameter.max - parameter.min;
    const normalizedSensitivity = inputSpan === 0 ? 0 : span / inputSpan;

    return {
      parameterId: parameter.id,
      nominal: parameter.nominal,
      range: { min: parameter.min, max: parameter.max },
      absoluteOutputSpan: span,
      normalizedSensitivity,
      samples: [
        { parameterId: parameter.id, value: parameter.min, output: low },
        { parameterId: parameter.id, value: parameter.nominal, output: nominalOutput },
        { parameterId: parameter.id, value: parameter.max, output: high },
      ],
    };
  });
}
