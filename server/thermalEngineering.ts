/** Reduced-order lumped thermal model; not a thermal qualification or safety certification. */
export interface ThermalEngineeringInput { initialTemperatureC:number; ambientTemperatureC:number; targetTemperatureC:number; thermalMassKJPerC:number; heaterPowerKW:number; coolingPowerKW:number; effectiveHeatLossKWPerC:number; heaterEfficiency?:number; coolingEfficiency?:number; }
export interface ThermalStepResult { temperatureC:number; netHeatKW:number; energyAddedKWh:number; heatLossKWh:number; coolingRemovedKWh:number; reachedTarget:boolean; warning?:string; }
export interface ThermalTimeEstimate { reachable:boolean; estimatedSeconds:number|null; netPowerKW:number; limitingFactor?:string; }
function valid(i:ThermalEngineeringInput){return Number.isFinite(i.initialTemperatureC)&&Number.isFinite(i.ambientTemperatureC)&&Number.isFinite(i.targetTemperatureC)&&Number.isFinite(i.thermalMassKJPerC)&&i.thermalMassKJPerC>0&&Number.isFinite(i.heaterPowerKW)&&i.heaterPowerKW>=0&&Number.isFinite(i.coolingPowerKW)&&i.coolingPowerKW>=0&&Number.isFinite(i.effectiveHeatLossKWPerC)&&i.effectiveHeatLossKWPerC>=0;}
export function estimateHeatingTime(input:ThermalEngineeringInput):ThermalTimeEstimate {
  if(!valid(input)) return {reachable:false,estimatedSeconds:null,netPowerKW:0,limitingFactor:'Invalid thermal engineering input.'};
  const efficiency=Math.min(1,Math.max(0,input.heaterEfficiency??1)); const netPowerKW=input.heaterPowerKW*efficiency; const deltaT=input.targetTemperatureC-input.initialTemperatureC;
  if(deltaT<=0)return {reachable:true,estimatedSeconds:0,netPowerKW};
  const lossAtTarget=input.effectiveHeatLossKWPerC*Math.max(0,input.targetTemperatureC-input.ambientTemperatureC); const available=netPowerKW-lossAtTarget;
  if(available<=0)return {reachable:false,estimatedSeconds:null,netPowerKW:available,limitingFactor:'Heating power cannot overcome modeled heat loss at target.'};
  const k=input.effectiveHeatLossKWPerC; if(k===0)return {reachable:true,estimatedSeconds:(input.thermalMassKJPerC*deltaT)/netPowerKW,netPowerKW};
  const eq=netPowerKW/k,start=input.initialTemperatureC-input.ambientTemperatureC,target=input.targetTemperatureC-input.ambientTemperatureC; const ratio=(eq-target)/Math.max(eq-start,Number.EPSILON);
  if(ratio<=0||ratio>=1)return {reachable:false,estimatedSeconds:null,netPowerKW:available,limitingFactor:'Target is outside modeled thermal equilibrium.'};
  const seconds=-(input.thermalMassKJPerC/k)*Math.log(ratio); return {reachable:Number.isFinite(seconds),estimatedSeconds:Number.isFinite(seconds)?seconds:null,netPowerKW:available};
}
export function stepThermalModel(input:ThermalEngineeringInput,dtSeconds:number):ThermalStepResult {
  if(!valid(input)||!Number.isFinite(dtSeconds)||dtSeconds<0)return {temperatureC:input.initialTemperatureC,netHeatKW:0,energyAddedKWh:0,heatLossKWh:0,coolingRemovedKWh:0,reachedTarget:false,warning:'Invalid thermal input or time step.'};
  const he=Math.min(1,Math.max(0,input.heaterEfficiency??1)), ce=Math.min(1,Math.max(0,input.coolingEfficiency??1)); const energyAddedKWh=input.heaterPowerKW*he*dtSeconds/3600; const coolingRemovedKWh=input.coolingPowerKW*ce*dtSeconds/3600; const loss=input.effectiveHeatLossKWPerC*Math.max(0,input.initialTemperatureC-input.ambientTemperatureC); const heatLossKWh=loss*dtSeconds/3600; const netHeatKW=input.heaterPowerKW*he-input.coolingPowerKW*ce-loss; const temperatureC=input.initialTemperatureC+(netHeatKW*dtSeconds)/input.thermalMassKJPerC; const reachedTarget=input.targetTemperatureC>=input.initialTemperatureC?temperatureC>=input.targetTemperatureC:temperatureC<=input.targetTemperatureC; return {temperatureC,netHeatKW,energyAddedKWh,heatLossKWh,coolingRemovedKWh,reachedTarget};
}
