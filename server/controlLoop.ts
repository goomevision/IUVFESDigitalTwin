/** Closed-loop control primitives used by the digital-twin simulator. */

export interface PIDConfig { kp: number; ki: number; kd: number; minOutput?: number; maxOutput?: number; }
export interface PIDSnapshot { integral: number; previousError: number; initialized: boolean; }

export class PIDController {
  private integral = 0;
  private previousError = 0;
  private initialized = false;

  constructor(private readonly config: Required<PIDConfig>) {}

  public update(setpoint: number, measurement: number, dtSeconds: number): number {
    const dt = Math.max(dtSeconds, 0.001);
    const error = setpoint - measurement;
    if (!this.initialized) this.previousError = error;
    this.integral += error * dt;
    const derivative = (error - this.previousError) / dt;
    let output = this.config.kp * error + this.config.ki * this.integral + this.config.kd * derivative;
    const clamped = Math.max(this.config.minOutput, Math.min(this.config.maxOutput, output));
    if (clamped !== output && Math.sign(error) === Math.sign(output)) this.integral -= error * dt;
    this.previousError = error;
    this.initialized = true;
    output = clamped;
    return output;
  }

  public reset(): void { this.integral = 0; this.previousError = 0; this.initialized = false; }
  public snapshot(): PIDSnapshot { return { integral: this.integral, previousError: this.previousError, initialized: this.initialized }; }
  public restore(snapshot: PIDSnapshot): void { this.integral = snapshot.integral; this.previousError = snapshot.previousError; this.initialized = snapshot.initialized; }
}

export interface ValveCommand { vacuumIsolation: number; vaporToCondenser: number; coolingWater: number; }
export interface ControlOutput { heaterPower: number; vacuumPumpPower: number; valve: ValveCommand; }
export interface ProcessControlSnapshot { heater: PIDSnapshot; vacuum: PIDSnapshot; }

export class ProcessControlLoop {
  private readonly heater = new PIDController({ kp: 0.025, ki: 0.0015, kd: 0.01, minOutput: 0, maxOutput: 1 });
  private readonly vacuum = new PIDController({ kp: 0.003, ki: 0.0004, kd: 0.001, minOutput: 0, maxOutput: 1 });

  public update(input: { targetTemperatureC: number; targetPressureMbar: number; temperatureC: number; pressureMbar: number; stage: string; dtSeconds: number }): ControlOutput {
    const activeHeat = ['HEAT_UP', 'EXTRACTION'].includes(input.stage);
    const activeVacuum = ['VACUUM', 'HEAT_UP', 'EXTRACTION', 'CONDENSATION'].includes(input.stage);
    const heaterPower = activeHeat ? this.heater.update(input.targetTemperatureC, input.temperatureC, input.dtSeconds) : 0;
    const vacuumPumpPower = activeVacuum ? this.vacuum.update(input.pressureMbar, input.targetPressureMbar, input.dtSeconds) : 0;
    return { heaterPower, vacuumPumpPower, valve: { vacuumIsolation: activeVacuum ? 1 : 0, vaporToCondenser: ['EXTRACTION', 'CONDENSATION'].includes(input.stage) ? 1 : 0, coolingWater: ['CONDENSATION', 'COOL_DOWN'].includes(input.stage) ? 1 : 0 } };
  }

  public reset(): void { this.heater.reset(); this.vacuum.reset(); }
  public snapshot(): ProcessControlSnapshot { return { heater: this.heater.snapshot(), vacuum: this.vacuum.snapshot() }; }
  public restore(snapshot: ProcessControlSnapshot): void { this.heater.restore(snapshot.heater); this.vacuum.restore(snapshot.vacuum); }
}
