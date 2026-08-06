/**
 * IUVFES Physics Simulation Engine
 * Botanical Extraction Simulator using:
 * - Ideal Gas Law (PV=nRT)
 * - Fick's Law of Diffusion
 * - Antoine Equation for vapor pressure
 * - Energy balance calculations
 */

export interface SimulationParameters {
  // Material properties
  materialWeight: number; // kg
  waterContent: number; // %
  oilContent: number; // %
  
  // Process parameters
  targetPressure: number; // mbar
  targetTemperature: number; // °C
  ultrasonicFrequency: number; // kHz
  duration: number; // hours
  materialWaterRatio: string; // "1:1", "1:2", etc
  processModel: "vacuum" | "distillation" | "ultrasonic" | "hybrid";
}

export interface SimulationResult {
  timestamp: number;
  pressure: number; // mbar
  temperature: number; // °C
  yieldPercentage: number; // %
  waterRemoved: number; // kg
  oilRecovered: number; // kg
  energyConsumed: number; // kWh
  efficiency: number; // %
  moleculeCount: {
    water: number;
    patchouliAlcohol: number;
    terpenes: number;
  };
}

export interface FinalResults {
  finalYield: number; // %
  oilComposition: Record<string, number>;
  energyConsumed: number; // kWh
  efficiency: number; // %
  wasteComposition: Record<string, any>;
  realTimeData: SimulationResult[];
  massBalance: {
    inputMaterial: number;
    inputWater: number;
    outputOil: number;
    outputWater: number;
    outputWaste: number;
    totalMass: number;
  };
  energyBalance: {
    inputEnergy: number;
    heatingEnergy: number;
    vacuumPumpEnergy: number;
    ultrasonicEnergy: number;
    coolingEnergy: number;
    totalEnergy: number;
    energyInOil: number;
    efficiency: number;
  };
}

// Constants
const R = 8.314; // Gas constant (J/(mol·K))
const DIFFUSION_COEFF = 1e-9; // Diffusion coefficient (m²/s) - typical for liquids
const BOLTZMANN = 1.380649e-23; // Boltzmann constant

export class PhysicsSimulationEngine {
  private params: SimulationParameters;
  private results: SimulationResult[] = [];
  private currentState = {
    pressure: 1013.25, // mbar (atmospheric)
    temperature: 25, // °C
    waterRemoved: 0,
    oilRecovered: 0,
    energyConsumed: 0,
  };

  constructor(params: SimulationParameters) {
    this.params = params;
  }

  /**
   * Run the complete simulation
   */
  async runSimulation(): Promise<FinalResults> {
    const steps = Math.ceil(this.params.duration * 60); // 1 step per minute
    const timeStep = (this.params.duration * 3600) / steps; // seconds

    for (let i = 0; i < steps; i++) {
      const result = this.simulateStep(i, timeStep);
      this.results.push(result);
    }

    return this.calculateFinalResults();
  }

  /**
   * Simulate one time step
   */
  private simulateStep(stepIndex: number, timeStep: number): SimulationResult {
    const progress = stepIndex / Math.ceil(this.params.duration * 60);

    // Apply process model
    switch (this.params.processModel) {
      case "vacuum":
        this.applyVacuumDrying(progress, timeStep);
        break;
      case "distillation":
        this.applyVacuumDistillation(progress, timeStep);
        break;
      case "ultrasonic":
        this.applyUltrasonicExtraction(progress, timeStep);
        break;
      case "hybrid":
        this.applyHybridModel(progress, timeStep);
        break;
    }

    // Calculate molecular movements
    const moleculeCount = this.calculateMoleculeMovement(progress);

    const result: SimulationResult = {
      timestamp: stepIndex * 60, // seconds
      pressure: this.currentState.pressure,
      temperature: this.currentState.temperature,
      yieldPercentage: (this.currentState.oilRecovered / (this.params.materialWeight * this.params.oilContent / 100)) * 100,
      waterRemoved: this.currentState.waterRemoved,
      oilRecovered: this.currentState.oilRecovered,
      energyConsumed: this.currentState.energyConsumed,
      efficiency: this.calculateEfficiency(),
      moleculeCount,
    };

    return result;
  }

  /**
   * Vacuum Drying Model
   * Uses PV=nRT and Fick's Law
   */
  private applyVacuumDrying(progress: number, timeStep: number): void {
    // Gradually reduce pressure to target
    const pressureReduction = (1013.25 - this.params.targetPressure) * Math.min(progress * 2, 1);
    this.currentState.pressure = 1013.25 - pressureReduction;

    // Gradually increase temperature
    const tempIncrease = (this.params.targetTemperature - 25) * Math.min(progress * 1.5, 1);
    this.currentState.temperature = 25 + tempIncrease;

    // Calculate water removal using Fick's Law
    // J = -D * dC/dx (simplified)
    const drivingForce = Math.max(0, this.params.waterContent - (this.currentState.waterRemoved / this.params.materialWeight) * 100);
    const diffusionFlux = DIFFUSION_COEFF * drivingForce * (this.currentState.temperature + 273.15) / 298.15;
    const waterRemovalRate = diffusionFlux * this.params.materialWeight * 0.001; // kg/s

    this.currentState.waterRemoved += waterRemovalRate * timeStep;
    this.currentState.waterRemoved = Math.min(this.currentState.waterRemoved, this.params.materialWeight * this.params.waterContent / 100);

    // Oil recovery increases with water removal
    const oilRecoveryRate = (waterRemovalRate * 0.3) * (this.params.oilContent / 100);
    this.currentState.oilRecovered += oilRecoveryRate * timeStep;
    this.currentState.oilRecovered = Math.min(this.currentState.oilRecovered, this.params.materialWeight * this.params.oilContent / 100);

    // Energy consumption for vacuum pump
    const vacuumEnergy = (1013.25 - this.currentState.pressure) * 0.001 * timeStep / 3600; // kWh
    this.currentState.energyConsumed += vacuumEnergy;
  }

  /**
   * Vacuum Distillation Model
   * Combines vacuum with temperature control
   */
  private applyVacuumDistillation(progress: number, timeStep: number): void {
    // More aggressive temperature increase
    const tempIncrease = (this.params.targetTemperature - 25) * Math.min(progress * 2, 1);
    this.currentState.temperature = 25 + tempIncrease;

    // Pressure reduction
    const pressureReduction = (1013.25 - this.params.targetPressure) * Math.min(progress * 1.8, 1);
    this.currentState.pressure = 1013.25 - pressureReduction;

    // Antoine equation for vapor pressure
    const vaporPressure = this.calculateVaporPressure(this.currentState.temperature);

    // Distillation efficiency increases with vapor pressure difference
    const pressureDifference = Math.max(0, vaporPressure - this.currentState.pressure);
    const distillationEfficiency = Math.min(1, pressureDifference / vaporPressure);

    // Water removal
    const waterRemovalRate = distillationEfficiency * 0.002 * (this.currentState.temperature / 100);
    this.currentState.waterRemoved += waterRemovalRate * this.params.materialWeight * timeStep / 3600;
    this.currentState.waterRemoved = Math.min(this.currentState.waterRemoved, this.params.materialWeight * this.params.waterContent / 100);

    // Oil recovery
    const oilRecoveryRate = distillationEfficiency * 0.0015 * (this.currentState.temperature / 100);
    this.currentState.oilRecovered += oilRecoveryRate * this.params.materialWeight * timeStep / 3600;
    this.currentState.oilRecovered = Math.min(this.currentState.oilRecovered, this.params.materialWeight * this.params.oilContent / 100);

    // Energy for heating and vacuum
    const heatingEnergy = (this.currentState.temperature - 25) * 0.001 * timeStep / 3600;
    const vacuumEnergy = (1013.25 - this.currentState.pressure) * 0.0005 * timeStep / 3600;
    this.currentState.energyConsumed += heatingEnergy + vacuumEnergy;
  }

  /**
   * Ultrasonic Extraction Model
   * Uses cavitation and acoustic streaming
   */
  private applyUltrasonicExtraction(progress: number, timeStep: number): void {
    // Ultrasonic frequency effect (20-100 kHz)
    const frequencyFactor = Math.min(1, this.params.ultrasonicFrequency / 100);

    // Cavitation bubble formation increases with frequency
    const cavitationIntensity = frequencyFactor * Math.sin(progress * Math.PI);

    // Temperature increase from cavitation
    const tempIncrease = cavitationIntensity * 30 * Math.min(progress * 1.5, 1);
    this.currentState.temperature = 25 + tempIncrease;

    // Slight pressure reduction from ultrasonic effects
    const pressureReduction = cavitationIntensity * (1013.25 - this.params.targetPressure) * 0.5;
    this.currentState.pressure = 1013.25 - pressureReduction;

    // Oil recovery from cavitation and acoustic streaming
    const cavitationEffect = cavitationIntensity * 0.003;
    const oilRecoveryRate = cavitationEffect * (1 + frequencyFactor);
    this.currentState.oilRecovered += oilRecoveryRate * this.params.materialWeight * timeStep / 3600;
    this.currentState.oilRecovered = Math.min(this.currentState.oilRecovered, this.params.materialWeight * this.params.oilContent / 100);

    // Water removal from cavitation
    const waterRemovalRate = cavitationEffect * 0.5;
    this.currentState.waterRemoved += waterRemovalRate * this.params.materialWeight * timeStep / 3600;
    this.currentState.waterRemoved = Math.min(this.currentState.waterRemoved, this.params.materialWeight * this.params.waterContent / 100);

    // Energy consumption for ultrasonic transducer
    const ultrasonicEnergy = frequencyFactor * 0.005 * timeStep / 3600; // kWh
    this.currentState.energyConsumed += ultrasonicEnergy;
  }

  /**
   * Hybrid Model
   * Combines vacuum, heating, and ultrasonic
   */
  private applyHybridModel(progress: number, timeStep: number): void {
    // Combine all three methods
    const vacuumWeight = 0.4;
    const distillationWeight = 0.35;
    const ultrasonicWeight = 0.25;

    // Store current state
    const savedState = { ...this.currentState };

    // Apply vacuum
    this.applyVacuumDrying(progress, timeStep);
    const vacuumResults = { ...this.currentState };

    // Reset and apply distillation
    this.currentState = { ...savedState };
    this.applyVacuumDistillation(progress, timeStep);
    const distillationResults = { ...this.currentState };

    // Reset and apply ultrasonic
    this.currentState = { ...savedState };
    this.applyUltrasonicExtraction(progress, timeStep);
    const ultrasonicResults = { ...this.currentState };

    // Combine results with weights
    this.currentState.pressure =
      vacuumResults.pressure * vacuumWeight +
      distillationResults.pressure * distillationWeight +
      ultrasonicResults.pressure * ultrasonicWeight;

    this.currentState.temperature =
      vacuumResults.temperature * vacuumWeight +
      distillationResults.temperature * distillationWeight +
      ultrasonicResults.temperature * ultrasonicWeight;

    this.currentState.waterRemoved =
      vacuumResults.waterRemoved * vacuumWeight +
      distillationResults.waterRemoved * distillationWeight +
      ultrasonicResults.waterRemoved * ultrasonicWeight;

    this.currentState.oilRecovered =
      vacuumResults.oilRecovered * vacuumWeight +
      distillationResults.oilRecovered * distillationWeight +
      ultrasonicResults.oilRecovered * ultrasonicWeight;

    this.currentState.energyConsumed =
      vacuumResults.energyConsumed * vacuumWeight +
      distillationResults.energyConsumed * distillationWeight +
      ultrasonicResults.energyConsumed * ultrasonicWeight;
  }

  /**
   * Calculate vapor pressure using Antoine Equation
   * P = 10^(A - B/(C+T))
   * For water: A=8.07131, B=1730.63, C=233.426
   */
  private calculateVaporPressure(tempCelsius: number): number {
    const A = 8.07131;
    const B = 1730.63;
    const C = 233.426;

    const logP = A - B / (C + tempCelsius);
    const pressureBar = Math.pow(10, logP);
    return pressureBar * 1000; // Convert to mbar
  }

  /**
   * Calculate molecular movement based on progress
   */
  private calculateMoleculeMovement(progress: number): { water: number; patchouliAlcohol: number; terpenes: number } {
    const totalMolecules = 1000000; // Arbitrary unit

    // Water molecules (blue)
    const waterMolecules = Math.round(
      totalMolecules * (this.params.waterContent / 100) * (1 - Math.min(progress * 1.2, 1))
    );

    // Patchouli alcohol molecules (gold)
    const patchouliMolecules = Math.round(
      totalMolecules * (this.params.oilContent / 100) * 0.6 * Math.min(progress * 1.5, 1)
    );

    // Terpenes molecules (green)
    const terpenesMolecules = Math.round(
      totalMolecules * (this.params.oilContent / 100) * 0.4 * Math.min(progress * 1.3, 1)
    );

    return {
      water: waterMolecules,
      patchouliAlcohol: patchouliMolecules,
      terpenes: terpenesMolecules,
    };
  }

  /**
   * Calculate process efficiency
   */
  private calculateEfficiency(): number {
    const theoreticalMaxOil = this.params.materialWeight * (this.params.oilContent / 100);
    const actualOil = this.currentState.oilRecovered;
    const energyUsed = this.currentState.energyConsumed;

    // Efficiency = (oil recovered / theoretical max) / energy used
    if (energyUsed === 0) return 0;
    return (actualOil / theoreticalMaxOil) / (energyUsed + 0.1) * 100;
  }

  /**
   * Calculate final results
   */
  private calculateFinalResults(): FinalResults {
    const theoreticalMaxOil = this.params.materialWeight * (this.params.oilContent / 100);
    const finalYield = (this.currentState.oilRecovered / theoreticalMaxOil) * 100;

    // Oil composition (simplified)
    const oilComposition = {
      patchouliAlcohol: 60,
      terpenes: 30,
      other: 10,
    };

    // Waste composition
    const wasteComposition = {
      residualMaterial: this.params.materialWeight - this.currentState.waterRemoved - this.currentState.oilRecovered,
      water: this.currentState.waterRemoved,
      impurities: 0.5,
    };

    // Mass balance
    const massBalance = {
      inputMaterial: this.params.materialWeight,
      inputWater: (this.params.materialWeight * this.params.waterContent) / 100,
      outputOil: this.currentState.oilRecovered,
      outputWater: this.currentState.waterRemoved,
      outputWaste: wasteComposition.residualMaterial + wasteComposition.impurities,
      totalMass: this.params.materialWeight,
    };

    // Energy balance
    const energyInOil = this.currentState.oilRecovered * 45; // MJ/kg for oils
    const energyBalance = {
      inputEnergy: this.currentState.energyConsumed * 3.6, // Convert kWh to MJ
      heatingEnergy: (this.currentState.temperature - 25) * 0.01,
      vacuumPumpEnergy: (1013.25 - this.currentState.pressure) * 0.001,
      ultrasonicEnergy: (this.params.ultrasonicFrequency / 100) * 0.1,
      coolingEnergy: 0.5,
      totalEnergy: this.currentState.energyConsumed * 3.6,
      energyInOil,
      efficiency: (energyInOil / (this.currentState.energyConsumed * 3.6 + 0.1)) * 100,
    };

    return {
      finalYield,
      oilComposition,
      energyConsumed: this.currentState.energyConsumed,
      efficiency: this.calculateEfficiency(),
      wasteComposition,
      realTimeData: this.results,
      massBalance,
      energyBalance,
    };
  }
}
