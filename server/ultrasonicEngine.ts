/**
 * IUVFES ultrasonic physics kernel.
 *
 * This is a reduced-order, evidence-aware model for power ultrasound. It keeps
 * the existing process equations intact and exposes the causal quantities that
 * must later be calibrated with hydrophone/calorimetry and laboratory data.
 *
 * Governing relationships:
 *   lambda = c / f
 *   I = P_acoustic / A
 *   p_A = sqrt(2 * rho * c * I)
 *   f_0 = (1 / (2*pi*R_0)) * sqrt((3*kappa*(P_0 + 2*sigma/R_0) - 2*sigma/R_0) / (rho*R_0^2))
 *   R*R'' + 1.5*R'^2 = [P_g + P_v - 2*sigma/R - 4*mu*R'/R - P_inf(t)] / rho
 *
 * Rayleigh-Plesset is used here as a single-bubble screening calculation. It
 * is not a full reactor acoustic field solver. Full-wave/Westervelt modelling,
 * transducer geometry and measured acoustic fields remain future validation work.
 */

export type UltrasonicCavitationStatus = 'OFF' | 'SUBTHRESHOLD' | 'ACTIVE' | 'UNSTABLE';

export interface UltrasonicConfig {
  enabled?: boolean;
  frequencyHz: number;
  electricalPowerW: number;
  transducerEfficiency: number;
  activeAreaM2: number;
  dutyCycle?: number;
  fluidDensityKgM3?: number;
  soundSpeedMps?: number;
  dynamicViscosityPaS?: number;
  surfaceTensionNPerM?: number;
  vaporPressurePa?: number;
  initialBubbleRadiusM?: number;
  polytropicExponent?: number;
  attenuationNpPerM?: number;
  propagationDistanceM?: number;
  maxMassTransferEnhancement?: number;
  acousticHeatingFraction?: number;
  provenance?: 'DEFAULT_WATER_BASELINE' | 'DATASHEET' | 'MEASURED' | 'CALIBRATED';
}

export interface UltrasonicState {
  enabled: boolean;
  frequencyHz: number;
  electricalPowerW: number;
  acousticPowerW: number;
  dutyCycle: number;
  wavelengthM: number;
  acousticIntensityWm2: number;
  acousticPressureAmplitudePa: number;
  peakNegativePressurePa: number;
  staticPressurePa: number;
  vaporPressurePa: number;
  cavitationThresholdMarginPa: number;
  cavitationActivity: number;
  cavitationStatus: UltrasonicCavitationStatus;
  bubbleEquilibriumRadiusM: number;
  bubbleResonanceFrequencyHz: number;
  bubbleMinRadiusM: number;
  bubbleMaxRadiusM: number;
  rayleighPlessetCycles: number;
  massTransferMultiplier: number;
  acousticHeatingW: number;
  attenuatedIntensityWm2: number;
  attenuationNpPerM: number;
  provenance: UltrasonicConfig['provenance'];
  modelStatus: 'REDUCED_ORDER_SCREENING' | 'DATA_GAP';
}

const DEFAULTS = {
  dutyCycle: 1,
  fluidDensityKgM3: 997,
  soundSpeedMps: 1497,
  dynamicViscosityPaS: 0.00089,
  surfaceTensionNPerM: 0.07197,
  vaporPressurePa: 3168,
  initialBubbleRadiusM: 5e-6,
  polytropicExponent: 1.4,
  attenuationNpPerM: 0,
  propagationDistanceM: 0,
  maxMassTransferEnhancement: 2,
  acousticHeatingFraction: 0.1,
  provenance: 'DEFAULT_WATER_BASELINE' as const,
};

export class UltrasonicEngine {
  private readonly c: Required<Omit<UltrasonicConfig, 'enabled' | 'frequencyHz' | 'electricalPowerW' | 'transducerEfficiency' | 'activeAreaM2'>> & Pick<UltrasonicConfig, 'frequencyHz' | 'electricalPowerW' | 'transducerEfficiency' | 'activeAreaM2'> & { enabled: boolean };

  constructor(config: UltrasonicConfig) {
    this.c = {
      enabled: config.enabled ?? true,
      frequencyHz: Math.max(1, config.frequencyHz),
      electricalPowerW: Math.max(0, config.electricalPowerW),
      transducerEfficiency: Math.max(0, Math.min(1, config.transducerEfficiency)),
      activeAreaM2: Math.max(1e-8, config.activeAreaM2),
      dutyCycle: Math.max(0, Math.min(1, config.dutyCycle ?? DEFAULTS.dutyCycle)),
      fluidDensityKgM3: Math.max(1, config.fluidDensityKgM3 ?? DEFAULTS.fluidDensityKgM3),
      soundSpeedMps: Math.max(1, config.soundSpeedMps ?? DEFAULTS.soundSpeedMps),
      dynamicViscosityPaS: Math.max(0, config.dynamicViscosityPaS ?? DEFAULTS.dynamicViscosityPaS),
      surfaceTensionNPerM: Math.max(0, config.surfaceTensionNPerM ?? DEFAULTS.surfaceTensionNPerM),
      vaporPressurePa: Math.max(0, config.vaporPressurePa ?? DEFAULTS.vaporPressurePa),
      initialBubbleRadiusM: Math.max(1e-8, config.initialBubbleRadiusM ?? DEFAULTS.initialBubbleRadiusM),
      polytropicExponent: Math.max(1, config.polytropicExponent ?? DEFAULTS.polytropicExponent),
      attenuationNpPerM: Math.max(0, config.attenuationNpPerM ?? DEFAULTS.attenuationNpPerM),
      propagationDistanceM: Math.max(0, config.propagationDistanceM ?? DEFAULTS.propagationDistanceM),
      maxMassTransferEnhancement: Math.max(0, config.maxMassTransferEnhancement ?? DEFAULTS.maxMassTransferEnhancement),
      acousticHeatingFraction: Math.max(0, Math.min(1, config.acousticHeatingFraction ?? DEFAULTS.acousticHeatingFraction)),
      provenance: config.provenance ?? DEFAULTS.provenance,
    };
  }

  public evaluate(staticPressureMbar: number): UltrasonicState {
    const pStatic = Math.max(1, staticPressureMbar) * 100;
    const disabled = !this.c.enabled || this.c.electricalPowerW <= 0 || this.c.dutyCycle <= 0;
    const acousticPower = disabled ? 0 : this.c.electricalPowerW * this.c.transducerEfficiency * this.c.dutyCycle;
    const intensity = acousticPower / this.c.activeAreaM2;
    const pressureAmplitude = Math.sqrt(Math.max(0, 2 * this.c.fluidDensityKgM3 * this.c.soundSpeedMps * intensity));
    const wavelength = this.c.soundSpeedMps / this.c.frequencyHz;
    const attenuation = Math.exp(-2 * this.c.attenuationNpPerM * this.c.propagationDistanceM);
    const attenuatedIntensity = intensity * attenuation;
    const attenuatedPressure = pressureAmplitude * Math.sqrt(attenuation);
    const thresholdMargin = attenuatedPressure - Math.max(0, pStatic - this.c.vaporPressurePa);
    const cavitationActivity = disabled ? 0 : this.cavitationActivity(thresholdMargin, attenuatedPressure, pStatic);
    const resonance = this.resonanceFrequency(pStatic);
    const resonanceFactor = this.lorentzian(this.c.frequencyHz, resonance);
    const activity = Math.min(1, cavitationActivity * (0.5 + 0.5 * resonanceFactor));
    const rp = disabled ? this.noBubbleResult(this.c.initialBubbleRadiusM) : this.simulateBubble(pStatic, attenuatedPressure);
    const status: UltrasonicCavitationStatus = disabled
      ? 'OFF'
      : rp.unstable ? 'UNSTABLE' : activity > 0 ? 'ACTIVE' : 'SUBTHRESHOLD';

    return {
      enabled: !disabled,
      frequencyHz: this.c.frequencyHz,
      electricalPowerW: this.c.electricalPowerW,
      acousticPowerW: acousticPower,
      dutyCycle: this.c.dutyCycle,
      wavelengthM: wavelength,
      acousticIntensityWm2: intensity,
      acousticPressureAmplitudePa: pressureAmplitude,
      peakNegativePressurePa: attenuatedPressure,
      staticPressurePa: pStatic,
      vaporPressurePa: this.c.vaporPressurePa,
      cavitationThresholdMarginPa: thresholdMargin,
      cavitationActivity: activity,
      cavitationStatus: status,
      bubbleEquilibriumRadiusM: this.c.initialBubbleRadiusM,
      bubbleResonanceFrequencyHz: resonance,
      bubbleMinRadiusM: rp.minRadius,
      bubbleMaxRadiusM: rp.maxRadius,
      rayleighPlessetCycles: rp.cycles,
      massTransferMultiplier: 1 + this.c.maxMassTransferEnhancement * activity,
      acousticHeatingW: acousticPower * this.c.acousticHeatingFraction,
      attenuatedIntensityWm2: attenuatedIntensity,
      attenuationNpPerM: this.c.attenuationNpPerM,
      provenance: this.c.provenance,
      modelStatus: this.c.provenance === 'DEFAULT_WATER_BASELINE' ? 'DATA_GAP' : 'REDUCED_ORDER_SCREENING',
    };
  }

  private resonanceFrequency(staticPressurePa: number): number {
    const r = this.c.initialBubbleRadiusM;
    const sigma = this.c.surfaceTensionNPerM;
    const rho = this.c.fluidDensityKgM3;
    const kappa = this.c.polytropicExponent;
    const numerator = 3 * kappa * (staticPressurePa + 2 * sigma / r) - 2 * sigma / r;
    const denominator = rho * r * r;
    const term = numerator / denominator;
    return term > 0 ? Math.sqrt(term) / (2 * Math.PI) : 0;
  }

  private cavitationActivity(marginPa: number, pressureAmplitudePa: number, staticPressurePa: number): number {
    if (pressureAmplitudePa <= 0 || marginPa <= 0) return 0;
    const thresholdRatio = Math.min(1, marginPa / Math.max(pressureAmplitudePa, 1));
    const staticRatio = Math.min(1, pressureAmplitudePa / Math.max(staticPressurePa, 1));
    return Math.max(0, Math.min(1, thresholdRatio * (0.25 + 0.75 * staticRatio)));
  }

  private lorentzian(frequencyHz: number, resonanceHz: number): number {
    if (resonanceHz <= 0) return 0;
    const ratio = (frequencyHz - resonanceHz) / resonanceHz;
    return 1 / (1 + 4 * ratio * ratio);
  }

  private noBubbleResult(radius: number): { minRadius: number; maxRadius: number; cycles: number; unstable: boolean } {
    return { minRadius: radius, maxRadius: radius, cycles: 0, unstable: false };
  }

  private simulateBubble(staticPressurePa: number, pressureAmplitudePa: number): { minRadius: number; maxRadius: number; cycles: number; unstable: boolean } {
    const rho = this.c.fluidDensityKgM3;
    const mu = this.c.dynamicViscosityPaS;
    const sigma = this.c.surfaceTensionNPerM;
    const pv = this.c.vaporPressurePa;
    const r0 = this.c.initialBubbleRadiusM;
    const kappa = this.c.polytropicExponent;
    const omega = 2 * Math.PI * this.c.frequencyHz;
    const gasPressure = Math.max(1, staticPressurePa + 2 * sigma / r0 - pv);
    const period = 1 / this.c.frequencyHz;
    const steps = 64;
    const h = period / steps;
    let r = r0;
    let v = 0;
    let minRadius = r0;
    let maxRadius = r0;
    let unstable = false;

    const acceleration = (time: number, radius: number, velocity: number): number => {
      const safeR = Math.max(radius, r0 * 0.05);
      const gas = gasPressure * Math.pow(r0 / safeR, 3 * kappa);
      const external = staticPressurePa - pressureAmplitudePa * Math.sin(omega * time);
      return (gas + pv - 2 * sigma / safeR - 4 * mu * velocity / safeR - external) / (rho * safeR)
        - 1.5 * velocity * velocity / safeR;
    };

    for (let i = 0; i < steps; i += 1) {
      const t = i * h;
      const k1r = v;
      const k1v = acceleration(t, r, v);
      const k2r = v + 0.5 * h * k1v;
      const k2v = acceleration(t + 0.5 * h, r + 0.5 * h * k1r, v + 0.5 * h * k1v);
      const k3r = v + 0.5 * h * k2v;
      const k3v = acceleration(t + 0.5 * h, r + 0.5 * h * k2r, v + 0.5 * h * k2v);
      const k4r = v + h * k3v;
      const k4v = acceleration(t + h, r + h * k3r, v + h * k3v);
      r += (h / 6) * (k1r + 2 * k2r + 2 * k3r + k4r);
      v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      if (!Number.isFinite(r) || !Number.isFinite(v) || r < r0 * 0.02 || r > r0 * 100) {
        unstable = true;
        r = Math.max(r0 * 0.02, Math.min(r0 * 100, Number.isFinite(r) ? r : r0));
        v = 0;
        break;
      }
      minRadius = Math.min(minRadius, r);
      maxRadius = Math.max(maxRadius, r);
    }
    return { minRadius, maxRadius, cycles: 1, unstable };
  }
}
