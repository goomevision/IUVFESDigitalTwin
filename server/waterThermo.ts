/**
 * Evidence-aware water/steam thermodynamics for the IUVFES process model.
 *
 * The saturation-pressure relation follows the IAPWS saturation formulation
 * (the Wagner-type Region-4 saturation correlation). The remaining quantities
 * are deliberately reduced-order process estimates and are marked as such.
 *
 * This is NOT a complete IF97 implementation. It is a focused thermodynamic
 * kernel for vacuum drying/extraction where the first-order question is whether
 * liquid water is thermodynamically driven toward vapor at the current T/P.
 */

export interface WaterThermoState {
  temperatureC: number;
  pressureMbar: number;
  saturationPressureMbar: number;
  saturationTemperatureC: number;
  boilingMarginMbar: number;
  vaporDrive: number;
  liquidStable: boolean;
  boilingLikely: boolean;
  latentHeatKjPerKg: number;
  vaporizationEnergyKwh: number;
  waterMassVaporizedKg: number;
  modelStatus: 'IAPWS_SATURATION_REDUCED_ORDER_ENERGY';
}

const TC_K = 647.096;
const PC_MPA = 22.064;
const TREF_K = 373.15;
const LATENT_REF_KJ_PER_KG = 2256.9;
const WATSON_EXPONENT = 0.38;

// IAPWS saturation-pressure coefficients for ordinary water.
const A = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502] as const;

export class WaterThermoEngine {
  public evaluate(temperatureC: number, pressureMbar: number, waterMassKg = 0, dtSeconds = 1): WaterThermoState {
    const temperatureK = Math.max(273.15, Math.min(TC_K, temperatureC + 273.15));
    const pressure = Math.max(0.1, pressureMbar);
    const psatMbar = this.saturationPressureMbar(temperatureK);
    const boilingMargin = psatMbar - pressure;
    const vaporDrive = Math.max(0, Math.min(1, boilingMargin / Math.max(psatMbar, 1)));
    const boilingLikely = psatMbar >= pressure;
    const latentHeat = this.latentHeatKjPerKg(temperatureK);
    const rateKgPerSecond = waterMassKg > 0 && boilingLikely
      ? Math.min(waterMassKg / Math.max(dtSeconds, 0.05), waterMassKg * (0.0005 + 0.0045 * vaporDrive))
      : 0;
    const vaporized = Math.max(0, Math.min(waterMassKg, rateKgPerSecond * Math.max(dtSeconds, 0.05)));

    return {
      temperatureC: temperatureK - 273.15,
      pressureMbar: pressure,
      saturationPressureMbar: psatMbar,
      saturationTemperatureC: this.saturationTemperatureC(pressure),
      boilingMarginMbar: boilingMargin,
      vaporDrive,
      liquidStable: pressure > psatMbar,
      boilingLikely,
      latentHeatKjPerKg: latentHeat,
      vaporizationEnergyKwh: vaporized * latentHeat / 3600,
      waterMassVaporizedKg: vaporized,
      modelStatus: 'IAPWS_SATURATION_REDUCED_ORDER_ENERGY',
    };
  }

  public saturationPressureMbar(temperatureK: number): number {
    const T = Math.max(273.15, Math.min(TC_K - 1e-9, temperatureK));
    const theta = 1 - T / TC_K;
    const exponent = (TC_K / T) * (
      A[0] * theta
      + A[1] * Math.pow(theta, 1.5)
      + A[2] * Math.pow(theta, 3)
      + A[3] * Math.pow(theta, 3.5)
      + A[4] * Math.pow(theta, 4)
      + A[5] * Math.pow(theta, 7.5)
    );
    return PC_MPA * Math.exp(exponent) * 10000;
  }

  public saturationTemperatureC(pressureMbar: number): number {
    const target = Math.max(0.611657, Math.min(PC_MPA * 10000 * (1 - 1e-12), pressureMbar));
    let lo = 273.15;
    let hi = TC_K - 1e-9;
    for (let i = 0; i < 70; i += 1) {
      const mid = (lo + hi) / 2;
      const p = this.saturationPressureMbar(mid);
      if (p < target) lo = mid;
      else hi = mid;
    }
    return ((lo + hi) / 2) - 273.15;
  }

  private latentHeatKjPerKg(temperatureK: number): number {
    const reduced = Math.max(0, Math.min(1, (1 - temperatureK / TC_K) / (1 - TREF_K / TC_K)));
    return Math.max(0, LATENT_REF_KJ_PER_KG * Math.pow(reduced, WATSON_EXPONENT));
  }
}
