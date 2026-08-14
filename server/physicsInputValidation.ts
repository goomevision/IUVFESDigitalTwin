/** Deterministic validation for physically meaningful closed-loop simulation inputs. */

export interface PhysicsInputShape {
  targetPressureMbar:number;
  targetTemperatureC:number;
  materialWeightKg:number;
  waterContentPercent:number;
  oilContentPercent:number;
  dtSeconds?:number;
  maxSteps?:number;
}

const finite = (value:number, name:string):void => {
  if (!Number.isFinite(value)) throw new Error(`Invalid physics input: ${name} must be finite`);
};

export function validatePhysicsInput(config:PhysicsInputShape):void {
  finite(config.targetPressureMbar,'targetPressureMbar');
  finite(config.targetTemperatureC,'targetTemperatureC');
  finite(config.materialWeightKg,'materialWeightKg');
  finite(config.waterContentPercent,'waterContentPercent');
  finite(config.oilContentPercent,'oilContentPercent');

  if(config.targetPressureMbar<=0 || config.targetPressureMbar>1000) throw new Error('Invalid physics input: targetPressureMbar must be > 0 and <= 1000 mbar');
  if(config.targetTemperatureC<25 || config.targetTemperatureC>150) throw new Error('Invalid physics input: targetTemperatureC must be between 25 and 150 C');
  if(config.materialWeightKg<0) throw new Error('Invalid physics input: materialWeightKg must be >= 0 kg');
  if(config.waterContentPercent<0 || config.waterContentPercent>100) throw new Error('Invalid physics input: waterContentPercent must be between 0 and 100%');
  if(config.oilContentPercent<0 || config.oilContentPercent>100) throw new Error('Invalid physics input: oilContentPercent must be between 0 and 100%');
  if(config.waterContentPercent+config.oilContentPercent>100) throw new Error('Invalid physics input: waterContentPercent + oilContentPercent must be <= 100%');

  if(config.dtSeconds!==undefined){
    finite(config.dtSeconds,'dtSeconds');
    if(config.dtSeconds<=0) throw new Error('Invalid physics input: dtSeconds must be > 0 seconds');
  }
  if(config.maxSteps!==undefined){
    finite(config.maxSteps,'maxSteps');
    if(config.maxSteps<1 || !Number.isInteger(config.maxSteps)) throw new Error('Invalid physics input: maxSteps must be a positive integer');
  }
}
