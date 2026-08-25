import type { ClosedLoopSimulationConfig, ClosedLoopSnapshot, CausalFrame } from "./closedLoopSimulation";

export interface ExperimentInputParameters { materialWeight:number; waterContent:number; oilContent:number; targetPressure:number; targetTemperature:number; coolingTemperature?:number; dtSeconds?:number; maxSteps?:number; hardwareProfileId?:string; ultrasonicFrequency?:number; ultrasonicPowerW?:number; ultrasonicDutyCyclePercent?:number; ultrasonicMaxPowerW?:number; duration?:number; materialWaterRatio?:string; processModel?:string; }

export interface ClosedLoopWiringReport {
  engineDrivers:readonly string[];
  metadataOnly:readonly string[];
  frameOutputs:readonly string[];
  reportOutputs:readonly string[];
  uiOutputs:readonly string[];
  dataProvenance:readonly string[];
}

export const CLOSED_LOOP_ENGINE_DRIVERS=["materialWeight","waterContent","oilContent","targetPressure","targetTemperature","coolingTemperature","dtSeconds","maxSteps","hardwareProfileId","ultrasonicFrequency","ultrasonicPowerW","ultrasonicDutyCyclePercent","ultrasonicMaxPowerW"] as const;
export const CLOSED_LOOP_METADATA_ONLY=["materialWaterRatio","processModel"] as const;
export const CLOSED_LOOP_FRAME_OUTPUTS=["sensorBefore","controller","controlOutput","intendedCommands","effectiveCommands","physicalSensorAfter","sensorAfter","materialInventory","safety","ultrasonic","hardwareDiagnostics","timestampSeconds","step"] as const;
export const CLOSED_LOOP_REPORT_OUTPUTS=["processMetrics","massBalance","energyBalance","vacuumDiagnostics","ultrasonicDiagnostics","coldTrapDiagnostics","safetyEvents","causalTrace","hardwareSnapshot","dataProvenance"] as const;
export const CLOSED_LOOP_UI_OUTPUTS=["realtimeMetrics","trendSeries","processTimeline","resultsTerminal","researchRecord","exportJson","printSavePdf"] as const;
export const CLOSED_LOOP_PROVENANCE_OUTPUTS=["experimentId","hardwareProfileId","datasetId","provenanceId","eventCount","eventHash","datasetSha256","dataSource","qualityStatus"] as const;

export function mapExperimentInputsToEngine(input:ExperimentInputParameters):ClosedLoopSimulationConfig{return {targetPressureMbar:input.targetPressure,targetTemperatureC:input.targetTemperature,coolingTemperatureC:input.coolingTemperature??35,materialWeightKg:input.materialWeight,waterContentPercent:input.waterContent,oilContentPercent:input.oilContent,dtSeconds:input.dtSeconds??1,maxSteps:input.maxSteps??10000,hardwareProfileId:input.hardwareProfileId,ultrasonic:{frequencyKHz:input.ultrasonicFrequency,requestedPowerW:input.ultrasonicPowerW,dutyCyclePercent:input.ultrasonicDutyCyclePercent,maxElectricalPowerW:input.ultrasonicMaxPowerW}};}

export function getClosedLoopWiringReport():ClosedLoopWiringReport{return {engineDrivers:CLOSED_LOOP_ENGINE_DRIVERS,metadataOnly:CLOSED_LOOP_METADATA_ONLY,frameOutputs:CLOSED_LOOP_FRAME_OUTPUTS,reportOutputs:CLOSED_LOOP_REPORT_OUTPUTS,uiOutputs:CLOSED_LOOP_UI_OUTPUTS,dataProvenance:CLOSED_LOOP_PROVENANCE_OUTPUTS};}

export interface ClosedLoopWiringSnapshot { experimentId?:string; frameCount:number; hasFinalSensors:boolean; hasHardwareDiagnostics:boolean; hasUltrasonic:boolean; hasSafety:boolean; hasMaterialInventory:boolean; reportReady:boolean; printReady:boolean; jsonExportReady:boolean; provenanceReady:boolean; }

export function inspectClosedLoopWiring(snapshot:Pick<ClosedLoopSnapshot,'frames'|'sensors'>,experimentId?:string):ClosedLoopWiringSnapshot{
 const frames=snapshot.frames as CausalFrame[];
 const latest=frames.at(-1);
 const hasFinalSensors=Boolean(snapshot.sensors);
 const hasHardwareDiagnostics=Boolean(latest?.hardwareDiagnostics);
 const hasUltrasonic=Boolean(latest?.ultrasonic);
 const hasSafety=Boolean(latest?.safety);
 const hasMaterialInventory=Boolean(latest?.materialInventory);
 const reportReady=hasFinalSensors&&hasHardwareDiagnostics&&hasUltrasonic&&hasSafety&&hasMaterialInventory;
 return {experimentId,frameCount:frames.length,hasFinalSensors,hasHardwareDiagnostics,hasUltrasonic,hasSafety,hasMaterialInventory,reportReady,printReady:reportReady,jsonExportReady:reportReady,provenanceReady:Boolean(experimentId)};
}
