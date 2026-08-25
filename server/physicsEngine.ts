/**
 * IUVFES Physics Simulation Engine
 * Reduced-order botanical extraction model.
 *
 * Scientific note:
 * - Antoine uses water constants with pressure in mmHg, converted to mbar.
 * - Water diffusion uses dimensional Fick's first law: J = -D dC/dx.
 * - The diffusion geometry/material properties are explicit parameters so the
 *   result is not silently based on an arbitrary unitless scale factor.
 */

export interface SimulationParameters {
  materialWeight: number; // kg
  waterContent: number; // %
  oilContent: number; // %
  targetPressure: number; // mbar
  targetTemperature: number; // °C
  ultrasonicFrequency: number; // kHz
  duration: number; // hours
  materialWaterRatio: string;
  processModel: "vacuum" | "distillation" | "ultrasonic" | "hybrid";
  diffusionCoefficientM2PerS?: number;
  diffusionLengthM?: number;
  diffusionAreaM2?: number;
  materialDensityKgPerM3?: number;
}

export interface SimulationResult {
  timestamp: number;
  pressure: number;
  temperature: number;
  yieldPercentage: number;
  waterRemoved: number;
  oilRecovered: number;
  energyConsumed: number;
  efficiency: number;
  moleculeCount: { water: number; patchouliAlcohol: number; terpenes: number };
}

export interface FinalResults {
  finalYield: number;
  oilComposition: Record<string, number>;
  energyConsumed: number;
  efficiency: number;
  wasteComposition: Record<string, any>;
  realTimeData: SimulationResult[];
  massBalance: {
    inputMaterial: number; inputWater: number; outputOil: number;
    outputWater: number; outputWaste: number; totalMass: number;
  };
  energyBalance: {
    inputEnergy: number; heatingEnergy: number; vacuumPumpEnergy: number;
    ultrasonicEnergy: number; coolingEnergy: number; totalEnergy: number;
    energyInOil: number; efficiency: number;
  };
}

const ATM_PRESSURE_MBAR = 1013.25;
const DEFAULT_DIFFUSION_COEFF_M2_PER_S = 1e-9;
const DEFAULT_DIFFUSION_LENGTH_M = 0.01;
const DEFAULT_DIFFUSION_AREA_M2 = 1;
const DEFAULT_MATERIAL_DENSITY_KG_PER_M3 = 1000;
const MMHG_TO_MBAR = 1.333223684;

export class PhysicsSimulationEngine {
  private params: SimulationParameters;
  private results: SimulationResult[] = [];
  private currentState = {
    pressure: ATM_PRESSURE_MBAR,
    temperature: 25,
    waterRemoved: 0,
    oilRecovered: 0,
    energyConsumed: 0,
  };

  constructor(params: SimulationParameters) { this.params = params; }

  async runSimulation(): Promise<FinalResults> {
    this.results = [];
    this.currentState = {
      pressure: ATM_PRESSURE_MBAR,
      temperature: 25,
      waterRemoved: 0,
      oilRecovered: 0,
      energyConsumed: 0,
    };
    const steps = Math.max(1, Math.ceil(this.params.duration * 60));
    const timeStep = (this.params.duration * 3600) / steps;
    for (let i = 0; i < steps; i++) this.results.push(this.simulateStep(i, timeStep));
    return this.calculateFinalResults();
  }

  private simulateStep(stepIndex: number, timeStep: number): SimulationResult {
    const steps = Math.max(1, Math.ceil(this.params.duration * 60));
    const progress = stepIndex / steps;
    switch (this.params.processModel) {
      case "vacuum": this.applyVacuumDrying(progress, timeStep); break;
      case "distillation": this.applyVacuumDistillation(progress, timeStep); break;
      case "ultrasonic": this.applyUltrasonicExtraction(progress, timeStep); break;
      case "hybrid": this.applyHybridModel(progress, timeStep); break;
    }
    const theoreticalMaxOil = this.theoreticalMaxOil;
    const yieldPercentage = theoreticalMaxOil > 0 ? (this.currentState.oilRecovered / theoreticalMaxOil) * 100 : 0;
    return {
      timestamp: stepIndex * 60,
      pressure: this.currentState.pressure,
      temperature: this.currentState.temperature,
      yieldPercentage,
      waterRemoved: this.currentState.waterRemoved,
      oilRecovered: this.currentState.oilRecovered,
      energyConsumed: this.currentState.energyConsumed,
      efficiency: this.calculateEfficiency(),
      moleculeCount: this.calculateMoleculeMovement(progress),
    };
  }

  private get theoreticalMaxOil(): number {
    return Math.max(0, this.params.materialWeight * this.params.oilContent / 100);
  }

  private get theoreticalWater(): number {
    return Math.max(0, this.params.materialWeight * this.params.waterContent / 100);
  }

  /** Fick first law with explicit SI dimensions: J[kg/m²/s] = D[m²/s] * dC[kg/m³]/dx[m]. */
  private calculateWaterRemovalRateKgPerS(): number {
    const waterRemaining = Math.max(0, this.theoreticalWater - this.currentState.waterRemoved);
    if (waterRemaining <= 0 || this.params.materialWeight <= 0) return 0;
    const D = Math.max(0, this.params.diffusionCoefficientM2PerS ?? DEFAULT_DIFFUSION_COEFF_M2_PER_S);
    const dx = Math.max(1e-9, this.params.diffusionLengthM ?? DEFAULT_DIFFUSION_LENGTH_M);
    const area = Math.max(0, this.params.diffusionAreaM2 ?? DEFAULT_DIFFUSION_AREA_M2);
    const density = Math.max(1e-9, this.params.materialDensityKgPerM3 ?? DEFAULT_MATERIAL_DENSITY_KG_PER_M3);
    const materialVolumeM3 = this.params.materialWeight / density;
    const concentrationKgPerM3 = waterRemaining / Math.max(materialVolumeM3, 1e-12);
    const gradientKgPerM4 = concentrationKgPerM3 / dx;
    return Math.max(0, D * gradientKgPerM4 * area);
  }

  private applyVacuumDrying(progress: number, timeStep: number): void {
    const pressureReduction = (ATM_PRESSURE_MBAR - this.params.targetPressure) * Math.min(progress * 2, 1);
    this.currentState.pressure = Math.max(this.params.targetPressure, ATM_PRESSURE_MBAR - pressureReduction);
    const tempIncrease = (this.params.targetTemperature - 25) * Math.min(progress * 1.5, 1);
    this.currentState.temperature = 25 + tempIncrease;

    const waterRate = this.calculateWaterRemovalRateKgPerS();
    this.currentState.waterRemoved = Math.min(this.theoreticalWater, this.currentState.waterRemoved + waterRate * timeStep);
    const oilRate = waterRate * 0.3 * (this.params.oilContent / 100);
    this.currentState.oilRecovered = Math.min(this.theoreticalMaxOil, this.currentState.oilRecovered + oilRate * timeStep);
    this.currentState.energyConsumed += Math.max(0, ATM_PRESSURE_MBAR - this.currentState.pressure) * 0.001 * timeStep / 3600;
  }

  private applyVacuumDistillation(progress: number, timeStep: number): void {
    const tempIncrease = (this.params.targetTemperature - 25) * Math.min(progress * 2, 1);
    this.currentState.temperature = 25 + tempIncrease;
    const pressureReduction = (ATM_PRESSURE_MBAR - this.params.targetPressure) * Math.min(progress * 1.8, 1);
    this.currentState.pressure = Math.max(this.params.targetPressure, ATM_PRESSURE_MBAR - pressureReduction);

    const vaporPressure = this.calculateVaporPressure(this.currentState.temperature);
    const pressureDifference = Math.max(0, vaporPressure - this.currentState.pressure);
    const distillationEfficiency = vaporPressure > 0 ? Math.min(1, pressureDifference / vaporPressure) : 0;
    const waterRate = distillationEfficiency * 0.002 * (this.currentState.temperature / 100) * this.params.materialWeight / 3600;
    this.currentState.waterRemoved = Math.min(this.theoreticalWater, this.currentState.waterRemoved + waterRate * timeStep);
    const oilRate = distillationEfficiency * 0.0015 * (this.currentState.temperature / 100) * this.params.materialWeight / 3600;
    this.currentState.oilRecovered = Math.min(this.theoreticalMaxOil, this.currentState.oilRecovered + oilRate * timeStep);
    const heatingEnergy = Math.max(0, this.currentState.temperature - 25) * 0.001 * timeStep / 3600;
    const vacuumEnergy = Math.max(0, ATM_PRESSURE_MBAR - this.currentState.pressure) * 0.0005 * timeStep / 3600;
    this.currentState.energyConsumed += heatingEnergy + vacuumEnergy;
  }

  private applyUltrasonicExtraction(progress: number, timeStep: number): void {
    const frequencyFactor = Math.min(1, Math.max(0, this.params.ultrasonicFrequency / 100));
    const cavitationIntensity = frequencyFactor * Math.sin(progress * Math.PI);
    this.currentState.temperature = 25 + cavitationIntensity * 30 * Math.min(progress * 1.5, 1);
    this.currentState.pressure = Math.max(this.params.targetPressure, ATM_PRESSURE_MBAR - cavitationIntensity * (ATM_PRESSURE_MBAR - this.params.targetPressure) * 0.5);
    const cavitationEffect = cavitationIntensity * 0.003;
    const oilRate = cavitationEffect * (1 + frequencyFactor) * this.params.materialWeight / 3600;
    this.currentState.oilRecovered = Math.min(this.theoreticalMaxOil, this.currentState.oilRecovered + oilRate * timeStep);
    const waterRate = cavitationEffect * 0.5 * this.params.materialWeight / 3600;
    this.currentState.waterRemoved = Math.min(this.theoreticalWater, this.currentState.waterRemoved + waterRate * timeStep);
    this.currentState.energyConsumed += frequencyFactor * 0.005 * timeStep / 3600;
  }

  private applyHybridModel(progress: number, timeStep: number): void {
    const weights = { vacuum: 0.4, distillation: 0.35, ultrasonic: 0.25 };
    const saved = { ...this.currentState };
    this.applyVacuumDrying(progress, timeStep); const vacuum = { ...this.currentState };
    this.currentState = { ...saved }; this.applyVacuumDistillation(progress, timeStep); const distillation = { ...this.currentState };
    this.currentState = { ...saved }; this.applyUltrasonicExtraction(progress, timeStep); const ultrasonic = { ...this.currentState };
    this.currentState = {
      pressure: vacuum.pressure * weights.vacuum + distillation.pressure * weights.distillation + ultrasonic.pressure * weights.ultrasonic,
      temperature: vacuum.temperature * weights.vacuum + distillation.temperature * weights.distillation + ultrasonic.temperature * weights.ultrasonic,
      waterRemoved: vacuum.waterRemoved * weights.vacuum + distillation.waterRemoved * weights.distillation + ultrasonic.waterRemoved * weights.ultrasonic,
      oilRecovered: vacuum.oilRecovered * weights.vacuum + distillation.oilRecovered * weights.distillation + ultrasonic.oilRecovered * weights.ultrasonic,
      energyConsumed: vacuum.energyConsumed * weights.vacuum + distillation.energyConsumed * weights.distillation + ultrasonic.energyConsumed * weights.ultrasonic,
    };
  }

  /** Antoine constants for water; equation returns mmHg, then converts mmHg -> mbar. */
  private calculateVaporPressure(tempCelsius: number): number {
    const A = 8.07131, B = 1730.63, C = 233.426;
    const logPmmHg = A - B / (C + tempCelsius);
    const pressureMmHg = Math.pow(10, logPmmHg);
    return pressureMmHg * MMHG_TO_MBAR;
  }

  private calculateMoleculeMovement(progress: number) {
    const totalMolecules = 1_000_000;
    return {
      water: Math.round(totalMolecules * (this.params.waterContent / 100) * (1 - Math.min(progress * 1.2, 1))),
      patchouliAlcohol: Math.round(totalMolecules * (this.params.oilContent / 100) * 0.6 * Math.min(progress * 1.5, 1)),
      terpenes: Math.round(totalMolecules * (this.params.oilContent / 100) * 0.4 * Math.min(progress * 1.3, 1)),
    };
  }

  /** Recovery efficiency is deliberately bounded to the theoretical oil recovery, not divided by energy. */
  private calculateEfficiency(): number {
    if (this.theoreticalMaxOil <= 0) return 0;
    return Math.max(0, Math.min(100, this.currentState.oilRecovered / this.theoreticalMaxOil * 100));
  }

  private calculateFinalResults(): FinalResults {
    const finalYield = this.calculateEfficiency();
    const oilComposition = { patchouliAlcohol: 60, terpenes: 30, other: 10 };
    const residualMaterial = Math.max(0, this.params.materialWeight - this.currentState.waterRemoved - this.currentState.oilRecovered);
    const wasteComposition = { residualMaterial, water: this.currentState.waterRemoved, impurities: 0 };
    const massBalance = {
      inputMaterial: this.params.materialWeight,
      inputWater: this.theoreticalWater,
      outputOil: this.currentState.oilRecovered,
      outputWater: this.currentState.waterRemoved,
      outputWaste: residualMaterial,
      totalMass: this.currentState.oilRecovered + this.currentState.waterRemoved + residualMaterial,
    };
    const energyInOil = this.currentState.oilRecovered * 45;
    const inputEnergyMJ = this.currentState.energyConsumed * 3.6;
    const energyBalance = {
      inputEnergy: inputEnergyMJ,
      heatingEnergy: Math.max(0, this.currentState.temperature - 25) * 0.01,
      vacuumPumpEnergy: Math.max(0, ATM_PRESSURE_MBAR - this.currentState.pressure) * 0.001,
      ultrasonicEnergy: (Math.max(0, this.params.ultrasonicFrequency) / 100) * 0.1,
      coolingEnergy: 0.5,
      totalEnergy: inputEnergyMJ,
      energyInOil,
      efficiency: inputEnergyMJ > 0 ? (energyInOil / inputEnergyMJ) * 100 : 0,
    };
    return {
      finalYield,
      oilComposition,
      energyConsumed: this.currentState.energyConsumed,
      efficiency: finalYield,
      wasteComposition,
      realTimeData: this.results,
      massBalance,
      energyBalance,
    };
  }
}
