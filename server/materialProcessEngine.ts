/**
 * Causal material inventory kernel for the closed-loop simulator.
 *
 * Engineering simulation model. Kinetic coefficients remain calibration
 * parameters; phase classification and water properties are resolved through
 * the IAPWS-IF97 water/steam state engine rather than invented constants.
 */

import { resolveWaterSteamState, type WaterSteamState } from './waterSteamStateEngine';

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
  waterPhase: 'LIQUID' | 'VAPOR' | 'TWO_PHASE' | 'ICE' | 'UNKNOWN';
  waterStateStatus: WaterSteamState['status'];
  saturationPressureMbar: number | null;
  waterStateProvenance: WaterSteamState['provenance'];
}

export interface MaterialProcessConfig {
  referencePressureMbar?: number;
  waterBoilingReferenceC?: number;
  evaporationCoefficient?: number;
  extractionCoefficient?: number;
  condenserEfficiency?: number;
  coolingCoefficient?: number;
  volatileLossFraction?: number;
  minimumEvaporationDrive?: number;
}

const DEFAULTS: Required<MaterialProcessConfig> = {
  referencePressureMbar: 1013.25,
  waterBoilingReferenceC: 100,
  evaporationCoefficient: 0.018,
  extractionCoefficient: 0.010,
  condenserEfficiency: 0.92,
  coolingCoefficient: 0.015,
  volatileLossFraction: 0.01,
  minimumEvaporationDrive: 0.01,
};

export class MaterialProcessEngine {
  private readonly config: Required<MaterialProcessConfig>;
  private inventory: MaterialInventory;
  private readonly materialMassKg: number;
  private readonly initialWaterFraction: number;
  private readonly initialOilFraction: number;

  constructor(
    inputs: Pick<MaterialProcessInputs, 'materialMassKg' | 'initialWaterFraction' | 'initialOilFraction'>,
    config: MaterialProcessConfig = {},
  ) {
    this.config = { ...DEFAULTS, ...config };
    this.materialMassKg = Math.max(0, inputs.materialMassKg);
    this.initialWaterFraction = Math.max(0, inputs.initialWaterFraction);
    this.initialOilFraction = Math.max(0, inputs.initialOilFraction);
    this.inventory = this.initialInventory();
  }

  step(inputs: MaterialProcessInputs): MaterialInventory {
    const dtHours = Math.max(0, inputs.dtSeconds) / 3600;
    const waterState = this.resolveWaterState(inputs.materialTemperatureC, inputs.chamberPressureMbar);
    const evaporationDrive = this.evaporationDrive(waterState, inputs.chamberPressureMbar);
    const thermalFactor = this.thermalFactor(inputs.materialTemperatureC, inputs.chamberPressureMbar);
    const vacuumFactor = Math.max(0, Math.min(1, inputs.vacuumPowerFraction));
    const heaterFactor = Math.max(0, Math.min(1, inputs.heaterPowerFraction));
    const extractorFactor = Math.max(0, Math.min(1, inputs.extractorPowerFraction));
    const condenserFactor = Math.max(0, Math.min(1, inputs.condenserPowerFraction));
    const coolingFactor = Math.max(0, Math.min(1, inputs.coolingPowerFraction));

    // Evaporation kinetics remain an explicit calibration parameter, while
    // phase/state and saturation pressure come from the IF97 state resolver.
    const evaporationPotential = this.inventory.moistureKg * this.config.evaporationCoefficient
      * evaporationDrive * thermalFactor
      * (0.35 + 0.65 * heaterFactor) * (0.25 + 0.75 * vacuumFactor);
    const evaporationKg = Math.min(this.inventory.moistureKg, Math.max(0, evaporationPotential * dtHours));
    this.inventory.moistureKg -= evaporationKg;
    this.inventory.vaporKg += evaporationKg;

    const extractionPotential = this.inventory.oilInMatrixKg * this.config.extractionCoefficient * thermalFactor
      * (0.20 + 0.80 * extractorFactor) * (0.35 + 0.65 * vacuumFactor);
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
    this.inventory.totalTrackedMassKg = this.totalMass();
    this.inventory.moistureFraction = this.inventory.moistureKg / Math.max(this.inventory.totalTrackedMassKg, 1e-9);
    const initialOil = Math.max(this.materialMassKg * this.initialOilFraction, 1e-9);
    this.inventory.oilRecoveryFraction = this.inventory.recoveredOilKg / initialOil;
    this.inventory.waterPhase = waterState.phase === 'LIQUID' || waterState.phase === 'VAPOR' || waterState.phase === 'TWO_PHASE'
      ? waterState.phase : (inputs.materialTemperatureC < 0 ? 'ICE' : 'UNKNOWN');
    this.inventory.waterStateStatus = waterState.status;
    this.inventory.saturationPressureMbar = waterState.properties.saturationPressureMPa !== undefined
      ? waterState.properties.saturationPressureMPa * 1000 : null;
    this.inventory.waterStateProvenance = waterState.provenance;
    return { ...this.inventory };
  }

  snapshot(): MaterialInventory { return { ...this.inventory }; }

  restore(snapshot: MaterialInventory): void { this.inventory = { ...snapshot }; }

  private initialInventory(): MaterialInventory {
    const water = Math.max(0, this.materialMassKg * this.initialWaterFraction);
    const oil = Math.max(0, this.materialMassKg * this.initialOilFraction);
    const solid = Math.max(0, this.materialMassKg - water - oil);
    const initialState = this.resolveWaterState(25, this.config.referencePressureMbar);
    return {
      solidKg: solid, moistureKg: water, vaporKg: 0, condensateWaterKg: 0,
      oilInMatrixKg: oil, oilVaporKg: 0, recoveredOilKg: 0, volatileLossKg: 0,
      totalTrackedMassKg: this.materialMassKg, evaporationRateKgPerHour: 0,
      oilRecoveryRateKgPerHour: 0, vaporFlowKgPerHour: 0,
      moistureFraction: water / Math.max(this.materialMassKg, 1e-9), oilRecoveryFraction: 0,
      waterPhase: initialState.phase === 'LIQUID' ? 'LIQUID' : 'UNKNOWN',
      waterStateStatus: initialState.status,
      saturationPressureMbar: initialState.properties.saturationPressureMPa !== undefined ? initialState.properties.saturationPressureMPa * 1000 : null,
      waterStateProvenance: initialState.provenance,
    };
  }

  private totalMass(): number {
    const i = this.inventory;
    return i.solidKg + i.moistureKg + i.vaporKg + i.condensateWaterKg + i.oilInMatrixKg + i.oilVaporKg + i.recoveredOilKg + i.volatileLossKg;
  }

  private resolveWaterState(temperatureC: number, pressureMbar: number): WaterSteamState {
    // IF97 is used only inside its supported water/steam domain. Ice handling
    // remains explicit DATA_GAP rather than inventing an ice correlation.
    if (temperatureC < 0) {
      return {
        status: 'DATA_GAP', phase: 'UNKNOWN', region: null,
        temperatureK: temperatureC + 273.15, pressureMPa: pressureMbar / 1000,
        properties: {},
        provenance: {
          standard: 'IAPWS_IF97', selector: 'if97RegionSelector',
          propertyAdapter: 'direct-region-solver', equationPath: 'ICE correlation not implemented',
        },
        notes: ['Frozen material requires an ice/sublimation model; no liquid-water correlation is substituted.'],
      };
    }
    return resolveWaterSteamState(temperatureC + 273.15, Math.max(0.001, pressureMbar / 1000));
  }

  private evaporationDrive(state: WaterSteamState, pressureMbar: number): number {
    const saturationMbar = state.properties.saturationPressureMPa !== undefined
      ? state.properties.saturationPressureMPa * 1000
      : null;
    if (saturationMbar === null || state.status !== 'READY_FOR_SIMULATION' && state.status !== 'DATA_GAP') return 0;
    // The drive is based on the saturation-pressure margin. Kinetics remain
    // empirical; this does not claim a complete activity-coefficient model.
    const margin = (saturationMbar - Math.max(1, pressureMbar)) / Math.max(saturationMbar, 1);
    return Math.max(this.config.minimumEvaporationDrive, Math.min(1.5, Math.max(0, margin)));
  }

  private pressureFactor(pressureMbar: number): number {
    return Math.max(0.05, Math.min(1, 1 - pressureMbar / this.config.referencePressureMbar));
  }

  private thermalFactor(temperatureC: number, pressureMbar: number): number {
    const pressureShift = (this.config.referencePressureMbar - Math.max(1, pressureMbar)) / this.config.referencePressureMbar * 25;
    const effectiveBoilingPoint = this.config.waterBoilingReferenceC - pressureShift;
    return Math.max(0, Math.min(1.5, (temperatureC - 25) / Math.max(10, effectiveBoilingPoint - 25)));
  }
}
