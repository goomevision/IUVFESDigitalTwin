import { describe, expect, it } from 'vitest';
import { IUVFES_VMMES_BASELINE } from './hardwareSpecification';
import { buildHardwareEngineeringProfile } from './hardwareEngineering';
describe('hardware engineering profile',()=>{
 it('maps baseline hardware into simulation inputs without fabricating geometry',()=>{const profile=buildHardwareEngineeringProfile(IUVFES_VMMES_BASELINE);expect(profile.hardwareId).toBe('IUVFES-VMMES-001');expect(profile.dynamics.connectedVolumeL).toBe(250);expect(profile.dynamics.pumpCapacityM3PerHour).toBe(200);expect(profile.geometryStatus).toBe('DATASHEET_REQUIRED');expect(profile.dataGaps.length).toBeGreaterThan(0);});
});
