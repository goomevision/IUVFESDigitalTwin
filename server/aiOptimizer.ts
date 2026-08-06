/**
 * AI Optimizer Engine for IUVFES Digital Twin Laboratory
 * Rule-based intelligent analysis: trend detection, anomaly detection,
 * yield prediction, and optimization suggestion generation.
 */

export interface SimulationDataPoint {
  time: number; // hours
  pressure: number; // mbar
  temperature: number; // °C
  yieldAccumulated: number; // mL
  energyConsumed: number; // kWh
  waterRemoved: number; // kg
}

export interface AISuggestion {
  id: string;
  type: "optimization" | "warning" | "info";
  title: string;
  description: string;
  parameter?: "pressure" | "temperature" | "frequency" | "duration";
  suggestedValue?: number;
  impact: string;
  confidence: number; // 0-100
}

export interface AIPrediction {
  predictedYield: number; // mL
  confidenceLevel: number; // 0-100
  errorRange: number; // ± mL
  timeToCompletion: number; // hours
  efficiency: number; // %
  recommendations: string[];
}

export interface AIAnalysis {
  status: "analyzing" | "optimal" | "suboptimal" | "warning";
  statusMessage: string;
  trends: {
    yieldRate: "increasing" | "stable" | "decreasing";
    energyEfficiency: "good" | "moderate" | "poor";
    temperatureStability: "stable" | "fluctuating";
  };
  anomalies: string[];
  suggestions: AISuggestion[];
  prediction: AIPrediction;
}

interface ProcessParams {
  targetPressure: number;
  targetTemperature: number;
  ultrasonicFrequency: number;
  duration: number;
  materialWeight: number;
  oilContent: number;
  processModel: string;
}

export class AIOptimizer {
  private params: ProcessParams;

  constructor(params: ProcessParams) {
    this.params = params;
  }

  /**
   * Analyze simulation data and generate a full AI analysis report.
   */
  analyze(data: SimulationDataPoint[]): AIAnalysis {
    if (!data || data.length < 2) {
      return this.emptyAnalysis();
    }

    const trends = this.detectTrends(data);
    const anomalies = this.detectAnomalies(data);
    const suggestions = this.generateSuggestions(data, trends, anomalies);
    const prediction = this.predictYield(data);

    let status: AIAnalysis["status"] = "optimal";
    let statusMessage = "Process running at optimal parameters";
    if (anomalies.length > 0) {
      status = "warning";
      statusMessage = `${anomalies.length} anomaly(s) detected — review suggestions`;
    } else if (suggestions.filter(s => s.type === "optimization").length >= 2) {
      status = "suboptimal";
      statusMessage = "Process can be optimized — see suggestions";
    }

    return { status, statusMessage, trends, anomalies, suggestions, prediction };
  }

  private emptyAnalysis(): AIAnalysis {
    return {
      status: "analyzing",
      statusMessage: "Collecting data for analysis...",
      trends: {
        yieldRate: "stable",
        energyEfficiency: "moderate",
        temperatureStability: "stable",
      },
      anomalies: [],
      suggestions: [],
      prediction: {
        predictedYield: 0,
        confidenceLevel: 0,
        errorRange: 0,
        timeToCompletion: this.params.duration,
        efficiency: 0,
        recommendations: ["Insufficient data — continue running the simulation"],
      },
    };
  }

  private detectTrends(data: SimulationDataPoint[]) {
    const n = data.length;
    const third = Math.max(1, Math.floor(n / 3));
    const early = data.slice(0, third);
    const late = data.slice(n - third);

    const earlyRate = this.avgRate(early, "yieldAccumulated");
    const lateRate = this.avgRate(late, "yieldAccumulated");

    let yieldRate: "increasing" | "stable" | "decreasing" = "stable";
    if (lateRate > earlyRate * 1.15) yieldRate = "increasing";
    else if (lateRate < earlyRate * 0.85) yieldRate = "decreasing";

    const totalEnergy = data[n - 1].energyConsumed;
    const totalYield = data[n - 1].yieldAccumulated;
    const energyPerMl = totalYield > 0 ? totalEnergy / totalYield : Infinity;
    let energyEfficiency: "good" | "moderate" | "poor" = "moderate";
    if (energyPerMl < 0.05) energyEfficiency = "good";
    else if (energyPerMl > 0.2) energyEfficiency = "poor";

    const temps = data.map(d => d.temperature);
    const tMean = temps.reduce((a, b) => a + b, 0) / temps.length;
    const tStd = Math.sqrt(temps.reduce((a, b) => a + (b - tMean) ** 2, 0) / temps.length);
    const temperatureStability = tStd > 5 ? "fluctuating" as const : "stable" as const;

    return { yieldRate, energyEfficiency, temperatureStability };
  }

  private avgRate(points: SimulationDataPoint[], key: "yieldAccumulated"): number {
    if (points.length < 2) return 0;
    const dt = points[points.length - 1].time - points[0].time;
    if (dt <= 0) return 0;
    return (points[points.length - 1][key] - points[0][key]) / dt;
  }

  private detectAnomalies(data: SimulationDataPoint[]): string[] {
    const anomalies: string[] = [];
    const last = data[data.length - 1];

    if (last.temperature > this.params.targetTemperature + 8) {
      anomalies.push(`Temperature overshoot: ${last.temperature.toFixed(1)}°C exceeds target by more than 8°C`);
    }
    if (last.pressure > this.params.targetPressure * 1.5) {
      anomalies.push(`Pressure deviation: ${last.pressure.toFixed(0)} mbar is 50% above target`);
    }

    // Yield stagnation in the last quarter
    const quarter = Math.max(2, Math.floor(data.length / 4));
    const recent = data.slice(-quarter);
    const recentGain = recent[recent.length - 1].yieldAccumulated - recent[0].yieldAccumulated;
    const totalYield = last.yieldAccumulated;
    if (totalYield > 0 && recentGain / totalYield < 0.02 && data.length > 10) {
      anomalies.push("Yield stagnation detected — extraction rate has nearly stopped");
    }

    return anomalies;
  }

  private generateSuggestions(
    data: SimulationDataPoint[],
    trends: ReturnType<AIOptimizer["detectTrends"]>,
    anomalies: string[],
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const p = this.params;

    // Pressure optimization
    if (p.targetPressure > 150) {
      suggestions.push({
        id: "sug-pressure",
        type: "optimization",
        title: "Lower vacuum pressure",
        description: `Reducing pressure from ${p.targetPressure} to ~100 mbar lowers the boiling point and accelerates extraction at lower temperature.`,
        parameter: "pressure",
        suggestedValue: 100,
        impact: "+8-12% yield rate",
        confidence: 87,
      });
    }

    // Temperature optimization
    if (p.targetTemperature > 70) {
      suggestions.push({
        id: "sug-temp",
        type: "warning",
        title: "Reduce temperature to protect volatile compounds",
        description: `${p.targetTemperature}°C risks degrading thermolabile aromatic compounds. 55-65°C preserves oil quality under vacuum.`,
        parameter: "temperature",
        suggestedValue: 60,
        impact: "Higher oil quality (less degradation)",
        confidence: 92,
      });
    } else if (p.targetTemperature < 45) {
      suggestions.push({
        id: "sug-temp-low",
        type: "optimization",
        title: "Increase temperature slightly",
        description: `${p.targetTemperature}°C is below the effective extraction band. 55-60°C improves diffusion without degradation.`,
        parameter: "temperature",
        suggestedValue: 55,
        impact: "+15% extraction rate",
        confidence: 84,
      });
    }

    // Ultrasonic frequency
    if (p.processModel === "ultrasonic" || p.processModel === "hybrid") {
      if (p.ultrasonicFrequency < 35 || p.ultrasonicFrequency > 45) {
        suggestions.push({
          id: "sug-freq",
          type: "optimization",
          title: "Tune ultrasonic frequency to 40 kHz",
          description: "40 kHz maximizes cavitation for cell-wall disruption in botanical matrices.",
          parameter: "frequency",
          suggestedValue: 40,
          impact: "+5-10% cell disruption efficiency",
          confidence: 78,
        });
      }
    }

    // Trend-based
    if (trends.yieldRate === "decreasing" && data.length > 5) {
      suggestions.push({
        id: "sug-duration",
        type: "info",
        title: "Diminishing returns detected",
        description: "Yield rate is declining — most extractable oil has been recovered. Consider ending the run early to save energy.",
        parameter: "duration",
        suggestedValue: Math.max(0.5, Math.round(data[data.length - 1].time * 10) / 10),
        impact: "-10-20% energy consumption",
        confidence: 81,
      });
    }

    if (trends.energyEfficiency === "poor") {
      suggestions.push({
        id: "sug-energy",
        type: "warning",
        title: "High energy consumption per mL",
        description: "Energy per unit yield is above optimal range. Lower pressure setpoint or shorten duration.",
        impact: "Improved process economics",
        confidence: 75,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        id: "sug-optimal",
        type: "info",
        title: "Parameters are near optimal",
        description: "Current configuration is within the recommended operating envelope for this material.",
        impact: "Maintain current settings",
        confidence: 90,
      });
    }

    return suggestions;
  }

  private predictYield(data: SimulationDataPoint[]): AIPrediction {
    const last = data[data.length - 1];
    const maxOil = this.params.materialWeight * (this.params.oilContent / 100) * 1000 * 0.92; // mL, assume density ~0.92

    // First-order extraction model: y(t) = ymax * (1 - e^-kt)
    // Estimate k from current progress
    const progress = maxOil > 0 ? Math.min(0.99, last.yieldAccumulated / maxOil) : 0;
    const k = last.time > 0 && progress > 0 ? -Math.log(1 - progress) / last.time : 0.5;
    const predictedYield = maxOil * (1 - Math.exp(-k * this.params.duration));

    const dataFraction = Math.min(1, last.time / this.params.duration);
    const confidenceLevel = Math.round(40 + dataFraction * 55);
    const errorRange = predictedYield * (0.25 - dataFraction * 0.18);

    const efficiency = maxOil > 0 ? (predictedYield / maxOil) * 100 : 0;

    const recommendations: string[] = [];
    if (efficiency < 70) {
      recommendations.push("Extend duration or increase ultrasonic intensity to improve recovery");
    }
    if (this.params.targetTemperature > 65) {
      recommendations.push("Consider lowering temperature to preserve top-note aromatics");
    }
    if (recommendations.length === 0) {
      recommendations.push("Process trajectory is on track for high recovery");
    }

    return {
      predictedYield: Math.round(predictedYield * 100) / 100,
      confidenceLevel,
      errorRange: Math.round(errorRange * 100) / 100,
      timeToCompletion: Math.max(0, this.params.duration - last.time),
      efficiency: Math.round(efficiency * 10) / 10,
      recommendations,
    };
  }
}
