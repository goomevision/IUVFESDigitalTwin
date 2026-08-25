import { describe, expect, it } from 'vitest';
import { MachineDynamicsEngine } from './machineDynamics';
import type { MachineCommand, MachineSensors } from './processStateEngine';
const initial:MachineSensors={chamberSealed:true,pressureMbar:1013.25,temperatureC:25,yieldPercent:0,waterRemovedKg:0,oilRecoveredKg:0,energyKwh:0};
const target:MachineSensors={...initial,pressureMbar:50,temperatureC:60,yieldPercent:100};
const vacuum:MachineCommand={vacuumPump:true,heater:false,extractor:false,condenser:false,cooling:false};
describe('virtual hardware coupling',()=>{
 it('changes vacuum response with connected volume',()=>{const compact=new MachineDynamicsEngine(initial,{hardware:{connectedVolumeL:100,pumpCapacityM3PerHour:200,thermalMassKjPerK:250,heatingPowerKw:9,coolingPowerKw:3,leakRateMbarPerSecond:0}});const large=new MachineDynamicsEngine(initial,{hardware:{connectedVolumeL:500,pumpCapacityM3PerHour:200,thermalMassKjPerK:250,heatingPowerKw:9,coolingPowerKw:3,leakRateMbarPerSecond:0}});expect(compact.step(target,vacuum,1).pressureMbar).toBeLessThan(large.step(target,vacuum,1).pressureMbar);});
 it('changes thermal response with heating power and thermal mass',()=>{const fast=new MachineDynamicsEngine(initial,{hardware:{connectedVolumeL:250,pumpCapacityM3PerHour:200,thermalMassKjPerK:125,heatingPowerKw:12,coolingPowerKw:3,leakRateMbarPerSecond:0}});const slow=new MachineDynamicsEngine(initial,{hardware:{connectedVolumeL:250,pumpCapacityM3PerHour:200,thermalMassKjPerK:500,heatingPowerKw:6,coolingPowerKw:3,leakRateMbarPerSecond:0}});const command={...vacuum,vacuumPump:false,heater:true};expect(fast.step(target,command,1).temperatureC).toBeGreaterThan(slow.step(target,command,1).temperatureC);});
 it('reports hardware diagnostics',()=>{const engine=new MachineDynamicsEngine(initial,{hardware:{connectedVolumeL:300,pumpCapacityM3PerHour:150,thermalMassKjPerK:350,heatingPowerKw:8,coolingPowerKw:2,leakRateMbarPerSecond:.1}});engine.step(target,vacuum,1);const d=engine.getHardwareDiagnostics();expect(d.connectedVolumeL).toBe(300);expect(d.effectivePumpCapacityM3h).toBe(150);expect(d.leakRateMbarPerSecond).toBe(.1);});
});
