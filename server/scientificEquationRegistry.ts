export type EquationDomain = "THERMAL" | "MASS" | "PRESSURE" | "ENERGY" | "FLOW";
export type EquationStatus = "IMPLEMENTED" | "REFERENCE_ONLY" | "DATA_GAP";

export type ScientificEquation = {
  id: string;
  name: string;
  domain: EquationDomain;
  expression: string;
  variables: Record<string, string>;
  assumptions: string[];
  units: string;
  validWhen: string[];
  source: string;
  status: EquationStatus;
};

/**
 * Human-auditable registry of governing equations used or planned by IUVFES.
 * The registry is intentionally explicit about assumptions and applicability.
 */
export const SCIENTIFIC_EQUATIONS: ScientificEquation[] = [
  {
    id: "ENERGY-001",
    name: "Sensible heating",
    domain: "ENERGY",
    expression: "Q = m * Cp * (T2 - T1)",
    variables: { Q: "energy", m: "mass", Cp: "specific heat capacity", T1: "initial temperature", T2: "final temperature" },
    assumptions: ["Cp is applicable over the requested temperature range", "phase does not change"],
    units: "SI",
    validWhen: ["single-phase sensible heating"],
    source: "First-law thermodynamics / energy balance",
    status: "REFERENCE_ONLY",
  },
  {
    id: "THERMAL-001",
    name: "Lumped thermal capacitance",
    domain: "THERMAL",
    expression: "m * Cp * dT/dt = Qdot_in - Qdot_out",
    variables: { m: "mass", Cp: "specific heat", dTdt: "temperature rate", Qdot_in: "heat input rate", Qdot_out: "heat loss rate" },
    assumptions: ["temperature is adequately represented by a lumped state", "internal temperature gradients are negligible or intentionally modeled elsewhere"],
    units: "SI",
    validWhen: ["lumped-capacitance approximation is justified"],
    source: "Transient energy balance",
    status: "REFERENCE_ONLY",
  },
  {
    id: "MASS-001",
    name: "Mass conservation",
    domain: "MASS",
    expression: "dm/dt = mdot_in - mdot_out + S_m",
    variables: { m: "system mass", mdot_in: "inlet mass flow", mdot_out: "outlet mass flow", S_m: "mass source/sink" },
    assumptions: ["all material streams use consistent units and sign convention"],
    units: "SI",
    validWhen: ["control-volume mass accounting"],
    source: "Conservation of mass",
    status: "REFERENCE_ONLY",
  },
  {
    id: "ENERGY-002",
    name: "First-law control-volume balance",
    domain: "ENERGY",
    expression: "dE/dt = Qdot - Wdot + sum(mdot*h)_in - sum(mdot*h)_out",
    variables: { E: "control-volume total energy", Qdot: "heat-transfer rate", Wdot: "work rate", h: "specific enthalpy" },
    assumptions: ["kinetic and potential terms are included when material to the model"],
    units: "SI",
    validWhen: ["open control volume"],
    source: "First law of thermodynamics",
    status: "REFERENCE_ONLY",
  },
  {
    id: "PRESSURE-001",
    name: "Ideal-gas state relation",
    domain: "PRESSURE",
    expression: "P * V = n * R * T",
    variables: { P: "absolute pressure", V: "volume", n: "amount of substance", R: "gas constant", T: "absolute temperature" },
    assumptions: ["gas behavior is adequately approximated as ideal"],
    units: "SI",
    validWhen: ["dilute gas regime where ideal-gas approximation is justified"],
    source: "Ideal-gas equation of state",
    status: "REFERENCE_ONLY",
  },
  {
    id: "THERMAL-002",
    name: "Fourier conduction",
    domain: "THERMAL",
    expression: "q = -k * grad(T)",
    variables: { q: "conductive heat-flux vector", k: "thermal conductivity", gradT: "temperature gradient" },
    assumptions: ["Fourier heat conduction is applicable", "k corresponds to the material and state"],
    units: "SI",
    validWhen: ["conductive heat transfer in the modeled material"],
    source: "Fourier's law of heat conduction",
    status: "REFERENCE_ONLY",
  },
];

export function getScientificEquation(id: string): ScientificEquation | undefined {
  return SCIENTIFIC_EQUATIONS.find((equation) => equation.id === id);
}
