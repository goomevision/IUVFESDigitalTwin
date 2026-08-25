import { describe, expect, it } from 'vitest';
import { cloneHardwareSpecification, IUVFES_VMMES_BASELINE } from './hardwareSpecification';
describe('IUVFES VMMES hardware specification',()=>{
 it('keeps baseline provenance explicit',()=>{expect(IUVFES_VMMES_BASELINE.systemId).toBe('IUVFES-VMMES-001');expect(IUVFES_VMMES_BASELINE.designStatus).toBe('SIMULATION_BASELINE');expect(IUVFES_VMMES_BASELINE.reactor.material.status).toBe('BASELINE');expect(IUVFES_VMMES_BASELINE.reactor.wallThickness.status).toBe('DATASHEET_REQUIRED');expect(IUVFES_VMMES_BASELINE.vacuumPump.pumpCurve.status).toBe('DATASHEET_REQUIRED');expect(IUVFES_VMMES_BASELINE.coldTraps).toHaveLength(4);});
 it('clones without mutating baseline',()=>{const revision=cloneHardwareSpecification();revision.reactor.workingVolume.value=500;revision.reactor.workingVolume.status='ASSUMED';expect(IUVFES_VMMES_BASELINE.reactor.workingVolume.value).toBe(250);expect(IUVFES_VMMES_BASELINE.reactor.workingVolume.status).toBe('BASELINE');});
});
