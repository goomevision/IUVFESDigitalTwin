/** Closed-loop control primitives used by the digital-twin simulator. */

export interface PIDConfig { kp: number; ki: number; kd: number; minOutput?: number; maxOutput?: number; }

export class PIDController {
  private integral = 0;
  private previousError = 0;
  private initialized = false;
  constructor(private readonly config: Required<PIDConfig>) {}
  public update(setpoint: number, measurement: number, dtSeconds: number): number {
    const dt = Math.max(dtSeconds, 0.001); const error = setpoint - measurement;
    if (!this.initialized) this.previousError = error;
    this.integral += error * dt;
    const derivative = (error - this.previousError) / dt;
    let output = this.config.kp * error + this.config.ki * this.integral + this.config.kd * derivative;
    const clamped = Math.max(this.config.minOutput, Math.min(this.config.maxOutput, output));
    if (clamped !== output && Math.sign(error) === Math.sign(output)) this.integral -= error * dt;
    this.previousError = error; this.initialized = true; output = clamped; return output;
  }
  public reset(): void { this.integral = 0; this.previousError = 0; this.initialized = false; }
}

export interface ValveCommand { vacuumIsolation: number; vaporToCondenser: number; coolingWater: number; }
export interface ControlOutput { heaterPower: number; vacuumPumpPower: number; valve: ValveCommand; }
export interface OperatorActuatorLimits { heaterMax: number; vacuumPumpMax: number; condenserMax: number; coolingMax: number; }
const DEFAULT_LIMITS: OperatorActuatorLimits = { heaterMax: 1, vacuumPumpMax: 1, condenserMax: 1, coolingMax: 1 };

export class ProcessControlLoop {
  private readonly heater = new PIDController({ kp: 0.025, ki: 0.0015, kd: 0.01, minOutput: 0, maxOutput: 1 });
  private readonly vacuum = new PIDController({ kp: 0.003, ki: 0.0004, kd: 0.001, minOutput: 0, maxOutput: 1 });

  public update(input: { targetTemperatureC: number; targetPressureMbar: number; temperatureC: number; pressureMbar: number; stage: string; dtSeconds: number }, limits: Partial<OperatorActuatorLimits> = {}): ControlOutput {
    const l = { ...DEFAULT_LIMITS, ...limits };
    const activeHeat = ['HEAT_UP', 'EXTRACTION'].includes(input.stage);
    const activeVacuum = ['VACUUM', 'HEAT_UP', 'EXTRACTION', 'CONDENSATION'].includes(input.stage);
    const heaterPower = activeHeat ? this.heater.update(input.targetTemperatureC, input.temperatureC, input.dtSeconds) * l.heaterMax : 0;
    const vacuumPumpPower = activeVacuum ? this.vacuum.update(input.pressureMbar, input.targetPressureMbar, input.dtSeconds) * l.vacuumPumpMax : 0;
    return {
      heaterPower,
      vacuumPumpPower,
      valve: {
        vacuumIsolation: activeVacuum ? 1 : 0,
        vaporToCondenser: ['EXTRACTION', 'CONDENSATION'].includes(input.stage) ? l.condenserMax : 0,
        coolingWater: ['CONDENSATION', 'COOL_DOWN'].includes(input.stage) ? l.coolingMax : 0,
      },
    };
  }

  public reset(): void { this.heater.reset(); this.vacuum.reset(); }
}