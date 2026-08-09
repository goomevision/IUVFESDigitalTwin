export type WaterReferenceState = {
  name: string;
  temperatureC: number;
  absolutePressureMPa: number;
  expectedRegion: "LIQUID" | "VAPOR" | "SATURATION";
  source: string;
};

/**
 * Reference points used to verify the eventual IAPWS implementation.
 * These are test-contract metadata, not an implementation of IAPWS itself.
 */
export const WATER_REFERENCE_STATES: WaterReferenceState[] = [
  {
    name: "saturation-near-atmospheric",
    temperatureC: 100,
    absolutePressureMPa: 0.101325,
    expectedRegion: "SATURATION",
    source: "IAPWS-IF97 Region 4 saturation formulation",
  },
  {
    name: "compressed-liquid-example",
    temperatureC: 80,
    absolutePressureMPa: 0.101325,
    expectedRegion: "LIQUID",
    source: "IAPWS-IF97 Region 1 / saturation boundary",
  },
  {
    name: "superheated-vapor-example",
    temperatureC: 150,
    absolutePressureMPa: 0.101325,
    expectedRegion: "VAPOR",
    source: "IAPWS-IF97 Region 2 / saturation boundary",
  },
];
