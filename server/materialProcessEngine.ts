/**
 * Causal material inventory kernel for the closed-loop simulator.
 *
 * Engineering simulation model. Coefficients are simulation defaults and must
 * be calibrated against experiment data before scientific or production claims.
 */
import { classifyVacuumFlowRegime } from './vacuumFlowRegime';

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
  vacuumLineDiameterM?: number;
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
  latentHeatLoadKW: number;
  latentHeatEnergyKWh: number;
  waterPhase: 'LIQUID' | 'ICE' | 'VAPOR' | 'TWO_PHASE' | 'UNKNOWN';
  waterStateStatus: 'READY_FOR_SIMULATION' | 'DATA_GAP' | 'OUT_OF_DOMAIN';
  flowRegime: 'VISCOUS' | 'TRANSITIONAL' | 'MOLECULAR' | 'UNKNOWN';
  knudsenNumber?: number;
  meanFreePathM?: number;
  flowRegimeProvenance?: 'KINETIC_THEORY_SCREENING';
  massBalanceResidualKg: number;
  energyBalanceResidualKWh: number;
}

export interface MaterialProcessConfig {
  referencePressureMbar?: number;
  waterBoilingReferenceC?: number;
  evaporationCoefficient?: number;
  extractionCoefficient?: number;
  condenserEfficiency?: number;
  coolingCoefficient?: number;
  volatileLossFraction?: number;
  latentHeatKJPerKg?: number;
  vacuumLineDiameterM?: number;
  massBalanceToleranceKg?: number;
  energyBalanceToleranceKWh?: number;
}

const DEFAULTS: Required<MaterialProcessConfig> = {
  referencePressureMbar: 1013.25,
  waterBoilingReferenceC: 100,
  evaporationCoefficient: 0.018,
  extractionCoefficient: 0.010,
  condenserEfficiency: 0.92,
  coolingCoefficient: 0.015,
  volatileLossFraction: 0.01,
  latentHeatKJPerKg: 2257,
  vacuumLineDiameterM: 0.02,
  massBalanceToleranceKg: 1e-9,
  energyBalanceToleranceKWh: 1e-9,
};

export class MaterialProcessEngine {
  private readonly config: Required<MaterialProcessConfig>;
  private inventory: MaterialInventory;
  private readonly materialMassKg: number;
  private readonly initialWaterFraction: number;
  private readonly initialOilFraction: number;
  private cumulativeInputLatentEnergyKWh = 0;

  constructor(inputs: Pick<MaterialProcessInputs, 'materialMassKg' | 'initialWaterFraction' | 'initialOilFraction'>, config: MaterialProcessConfig = {}) {
    this.config = { ...DEFAULTS, ...config };
    this.materialMassKg = Math.max(0, inputs.materialMassKg);
    this.initialWaterFraction = Math.max(0, inputs.initialWaterFraction);
    this.initialOilFraction = Math.max(0, inputs.initialOilFraction);
    this.inventory = this.initialInventory();
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

    const flow = this.resolveFlowRegime(inputs);
    const regimeFactor = flow.regime === 'UNKNOWN' ? 1 : ({ VISCOUS: 1, TRANSITIONAL: 0.65, MOLECULAR: 0.35 } as const)[flow.regime];
    const evaporationPotential = this.inventory.moistureKg * this.config.evaporationCoefficient * pressureFactor * thermalFactor * regimeFactor * (0.35 + 0.65 * heaterFactor) * (0.25 + 0.75 * vacuumFactor);
    const evaporationKg = Math.min(this.inventory.moistureKg, Math.max(0, evaporationPotential * dtHours));
    this.inventory.moistureKg -= evaporationKg;
    this.inventory.vaporKg += evaporationKg;

    const extractionPotential = this.inventory.oilInMatrixKg * this.config.extractionCoefficient * thermalFactor * regimeFactor * (0.20 + 0.80 * extractorFactor) * (0.35 + 0.65 * vacuumFactor);
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
    this.inventory.latentHeatLoadKW = evaporationKg > 0 && dtHours > 0 ? (evaporationKg / dtHours) * this.config.latentHeatKJPerKg / 3600 : 0;
    const latentStepKWh = evaporationKg * this.config.latentHeatKJPerKg / 3600;
    this.cumulativeInputLatentEnergyKWh += latentStepKWh;
    this.inventory.latentHeatEnergyKWh += latentStepKWh;
    this.inventory.totalTrackedMassKg = this.totalMass();
    this.inventory.moistureFraction = this.inventory.moistureKg / Math.max(this.inventory.totalTrackedMassKg, 1e-9);
    const initialOil = Math.max(this.materialMassKg * this.initialOilFraction, 1e-9);
    this.inventory.oilRecoveryFraction = this.inventory.recoveredOilKg / initialOil;
    this.inventory.flowRegime = flow.regime;
    this.inventory.knudsenNumber = flow.knudsenNumber;
    this.inventory.meanFreePathM = flow.meanFreePathM;
    this.inventory.flowRegimeProvenance = flow.provenance;
    this.inventory.massBalanceResidualKg = this.inventory.totalTrackedMassKg - this.materialMassKg;
    this.inventory.energyBalanceResidualKWh = this.inventory.latentHeatEnergyKWh - this.cumulativeInputLatentEnergyKWh;
    if (Math.abs(this.inventory.massBalanceResidualKg) > this.config.massBalanceToleranceKg) throw new Error('Material mass balance residual exceeds configured tolerance.');
    if (Math.abs(this.inventory.energyBalanceResidualKWh) > this.config.energyBalanceToleranceKWh) throw new Error('Material latent-energy balance residual exceeds configured tolerance.');
    return { ...this.inventory };
  }

  snapshot(): MaterialInventory { return { ...this.inventory }; }
  restore(snapshot: MaterialInventory): void {
    this.inventory = { ...snapshot };
    this.cumulativeInputLatentEnergyKWh = snapshot.latentHeatEnergyKWh;
  }

  private initialInventory(): MaterialInventory {
    const water = Math.max(0, this.materialMassKg * this.initialWaterFraction);
    const oil = Math.max(0, this.materialMassKg * this.initialOilFraction);
    const solid = Math.max(0, this.materialMassKg - water - oil);
    return {
      solidKg: solid, moistureKg: water, vaporKg: 0, condensateWaterKg: 0, oilInMatrixKg: oil, oilVaporKg: 0, recoveredOilKg: 0, volatileLossKg: 0,
      totalTrackedMassKg: this.materialMassKg, evaporationRateKgPerHour: 0, oilRecoveryRateKgPerHour: 0, vaporFlowKgPerHour: 0,
      moistureFraction: water / Math.max(this.materialMassKg, 1e-9), oilRecoveryFraction: 0, latentHeatLoadKW: 0, latentHeatEnergyKWh: 0,
      waterPhase: 'LIQUID', waterStateStatus: 'READY_FOR_SIMULATION', flowRegime: 'UNKNOWN', massBalanceResidualKg: 0, energyBalanceResidualKWh: 0,
    };
  }

  private totalMass(): number {
    const i = this.inventory;
    return i.solidKg + i.moistureKg + i.vaporKg + i.condensateWaterKg + i.oilInMatrixKg + i.oilVaporKg + i.recoveredOilKg + i.volatileLossKg;
  }

  private resolveFlowRegime(inputs: MaterialProcessInputs) {
    const absolutePressurePa = Math.max(1, inputs.chamberPressureMbar * 100);
    const gasTemperatureK = Math.max(1, inputs.materialTemperatureC + 273.15);
    const characteristicDiameterM = inputs.vacuumLineDiameterM ?? this.config.vacuumLineDiameterM;
    try {
      return classifyVacuumFlowRegime({ absolutePressurePa, gasTemperatureK, characteristicDiameterM });
    } catch {
      return { regime: 'UNKNOWN' as const, meanFreePathM: undefined, knudsenNumber: undefined, provenance: undefined };
    }
  }

  private pressureFactor(pressureMbar: number): number { return Math.max(0.05, Math.min(1, 1 - pressureMbar / this.config.referencePressureMbar)); }

  private thermalFactor(temperatureC: number, pressureMbar: number): number {
    const pressureShift = (this.config.referencePressureMbar - Math.max(1, pressureMbar)) / this.config.referencePressureMbar * 25;
    const effectiveBoilingPoint = this.config.waterBoilingReferenceC - pressureShift;
    return Math.max(0, Math.min(1.5, (temperatureC - 25) / Math.max(10, effectiveBoilingPoint - 25)));
  }
}
