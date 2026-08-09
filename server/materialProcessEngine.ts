/**
 * IUVFES Digital Twin — material/process layer.
 *
 * Converts machine telemetry into a causal material inventory for the
 * simulator UI. This is an engineering simulation model, not a calibrated
 * production process model.
 */

export interface MaterialProcessInputs {
  materialMassKg: number;
  initialWaterFraction: number;
  initialOilFraction: number;
  chamberPressureMbar: number;
  materialTemperatureC: number;
  heaterPowerFraction: number;
  vacuumPowerFraction: number;
  extractorPowerFraction: number;
  condenserPowerFraction: number;
  coolingPowerFraction: number;
  dtSeconds: number;
}

export interface MaterialInventory {
  solidKg: number;
  moistureKg: number;
  vaporKg: number;
  condensateWaterKg: number;
  oilInMatrixKg: number;
  oilVaporKg: number;
  recoveredOilKg: number;
  volatileLossKg: number;
  totalTrackedMassKg: number;
  evaporationRateKgPerHour: number;
  oilRecoveryRateKgPerHour: number;
  vaporFlowKgPerHour: number;
  moistureFraction: number;
  oilRecoveryFraction: number;
}

export interface MaterialProcessConfig {
  referencePressureMbar?: number;
  waterBoilingReferenceC?: number;
  evaporationCoefficient?: number;
  extractionCoefficient?: number;
  condenserEfficiency?: number;
  coolingCoefficient?: number;
  volatileLossFraction?: number;
}

const DEFAULTS = {
  referencePressureMbar: 1013.25,
  waterBoilingReferenceC: 100,
  evaporationCoefficient: 0.018,
  extractionCoefficient: 0.010,
  condenserEfficiency: 0.92,
  coolingCoefficient: 0.015,
  volatileLossFraction: 0.01,
};

export class MaterialProcessEngine {
  private readonly config: Required<MaterialProcessConfig>;
  private inventory: MaterialInventory;

  constructor(inputs: Pick<MaterialProcessInputs, 'materialMassKg' | 'initialWaterFraction' | 'initialOilFraction'>, config: MaterialProcessConfig = {}) {
    this.config = { ...DEFAULTS, ...config };
    const water = Math.max(0, inputs.materialMassKg * inputs.initialWaterFraction);
    const oil = Math.max(0, inputs.materialMassKg * inputs.initialOilFraction);
    const solid = Math.max(0, inputs.materialMassKg - water - oil);
    this.inventory = {
      solidKg: solid,
      moistureKg: water,
      vaporKg: 0,
      condensateWaterKg: 0,
      oilInMatrixKg: oil,
      oilVaporKg: 0,
      recoveredOilKg: 0,
      volatileLossKg: 0,
      totalTrackedMassKg: inputs.materialMassKg,
      evaporationRateKgPerHour: 0,
      oilRecoveryRateKgPerHour: 0,
      vaporFlowKgPerHour: 0,
      moistureFraction: water / Math.max(inputs.materialMassKg, 1e-9),
      oilRecoveryFraction: 0,
    };
  }

  step(inputs: MaterialProcessInputs): MaterialInventory {
    const dtHours = Math.max(0, inputs.dtSeconds) / 3600;
    const pressureFactor = this.pressureFactor(inputs.chamberPressureMbar);
    const thermalFactor = this.thermalFactor(inputs.materialTemperatureC, inputs.chamberPressureMbar);
    const vacuumFactor = Math.max(0, Math.min(1, inputs.vacuumPowerFraction));
    const heaterFactor = Math.max(0, Math.min(1, inputs.heaterPowerFraction));
    const extractorFactor = Math.max(0, Math.min(1, inputs.extractorPowerFraction));
    const condenserFactor = Math.max(0, Math.min(1, inputs.condenserPowerFraction));
    const coolingFactor = Math.max(0, Math.min(1, inputs.coolingPowerFraction));

    const evaporationPotential = this.inventory.moistureKg
      * this.config.evaporationCoefficient
      * pressureFactor
      * thermalFactor
      * (0.35 + 0.65 * heaterFactor)
      * (0.25 + 0.75 * vacuumFactor);
    const evaporationKg = Math.min(this.inventory.moistureKg, Math.max(0, evaporationPotential * dtHours));

    this.inventory.moistureKg -= evaporationKg;
    this.inventory.vaporKg += evaporationKg;

    const extractionPotential = this.inventory.oilInMatrixKg
      * this.config.extractionCoefficient
      * thermalFactor
      * (0.20 + 0.80 * extractorFactor)
      * (0.35 + 0.65 * vacuumFactor);
    const extractedOilKg = Math.min(this.inventory.oilInMatrixKg, Math.max(0, extractionPotential * dtHours));
    this.inventory.oilInMatrixKg -= extractedOilKg;
    this.inventory.oilVaporKg += extractedOilKg;

    const availableVapor = this.inventory.vaporKg + this.inventory.oilVaporKg;
    const condensingFraction = Math.min(1, condenserFactor * this.config.condenserEfficiency + coolingFactor * this.config.coolingCoefficient);
    const condensedWater = Math.min(this.inventory.vaporKg, this.inventory.vaporKg * condensingFraction);
    const condensedOil = Math.min(this.inventory.oilVaporKg, this.inventory.oilVaporKg * condensingFraction);
    this.inventory.vaporKg -= condensedWater;
    this.inventory.oilVaporKg -= condensedOil;
    this.inventory.condensateWaterKg += condensedWater;
    this.inventory.recoveredOilKg += condensedOil;

    const uncondensedOilLoss = Math.min(this.inventory.oilVaporKg, this.inventory.oilVaporKg * this.config.volatileLossFraction * dtHours);
    this.inventory.oilVaporKg -= uncondensedOilLoss;
    this.inventory.volatileLossKg += uncondensedOilLoss;

    this.inventory.evaporationRateKgPerHour = dtHours > 0 ? evaporationKg / dtHours : 0;
    this.inventory.oilRecoveryRateKgPerHour = dtHours > 0 ? condensedOil / dtHours : 0;
    this.inventory.vaporFlowKgPerHour = dtHours > 0 ? availableVapor / dtHours : 0;
    const totalMass = this.inventory.solidKg + this.inventory.moistureKg + this.inventory.vaporKg + this.inventory.condensateWaterKg + this.inventory.oilInMatrixKg + this.inventory.oilVaporKg + this.inventory.recoveredOilKg + this.inventory.volatileLossKg;
    this.inventory.totalTrackedMassKg = totalMass;
    this.inventory.moistureFraction = this.inventory.moistureKg / Math.max(totalMass, 1e-9);
    const initialOil = Math.max(inputs.materialMassKg * inputs.initialOilFraction, 1e-9);
    this.inventory.oilRecoveryFraction = this.inventory.recoveredOilKg / initialOil;

    return { ...this.inventory };
  }

  snapshot(): MaterialInventory { return { ...this.inventory }; }

  private pressureFactor(pressureMbar: number): number {
    return Math.max(0.05, Math.min(1, 1 - pressureMbar / this.config.referencePressureMbar));
  }

  private thermalFactor(temperatureC: number, pressureMbar: number): number {
    const pressureShift = (this.config.referencePressureMbar - Math.max(1, pressureMbar)) / this.config.referencePressureMbar * 25;
    const effectiveBoilingPoint = this.config.waterBoilingReferenceC - pressureShift;
    return Math.max(0, Math.min(1.5, (temperatureC - 25) / Math.max(10, effectiveBoilingPoint - 25)));
  }
}
