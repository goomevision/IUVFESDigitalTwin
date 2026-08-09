import {
  deriveCylindricalChamber,
  validateCylindricalChamberGeometry,
  type CylindricalChamberGeometry,
} from './virtualHardwareGeometry';
import {
  screenVacuumShell,
  type VacuumShellScreeningInput,
} from './vacuumStructuralScreening';

export interface HardwareDesignCandidate {
  id: string;
  geometry: CylindricalChamberGeometry;
  materialDensityKgPerM3?: number;
  structural?: Omit<VacuumShellScreeningInput, keyof CylindricalChamberGeometry>;
}

export interface HardwareDesignComparison {
  id: string;
  geometryValid: boolean;
  volumeL: number | null;
  surfaceAreaM2: number | null;
  shellMassKg: number | null;
  structuralStatus: 'PASS_SCREENING' | 'REVIEW_REQUIRED' | 'INVALID_INPUT' | 'NOT_EVALUATED';
  structuralUtilization: number | null;
  warnings: string[];
}

/**
 * Compares virtual hardware candidates using deterministic geometry and an
 * explicitly preliminary vacuum-shell screening. It does not rank designs as
 * safe/unsafe and must not replace detailed engineering review.
 */
export function compareHardwareDesigns(
  candidates: HardwareDesignCandidate[],
): HardwareDesignComparison[] {
  return candidates.map((candidate) => {
    const validation = validateCylindricalChamberGeometry(candidate.geometry);
    if (!validation.valid) {
      return {
        id: candidate.id,
        geometryValid: false,
        volumeL: null,
        surfaceAreaM2: null,
        shellMassKg: null,
        structuralStatus: 'INVALID_INPUT',
        structuralUtilization: null,
        warnings: [...validation.errors, ...validation.warnings],
      };
    }

    const derived = deriveCylindricalChamber(
      candidate.geometry,
      candidate.materialDensityKgPerM3,
    );

    if (!candidate.structural) {
      return {
        id: candidate.id,
        geometryValid: true,
        volumeL: derived.internalVolumeL,
        surfaceAreaM2: derived.internalSurfaceAreaM2,
        shellMassKg: derived.shellMetalMassKg ?? null,
        structuralStatus: 'NOT_EVALUATED',
        structuralUtilization: null,
        warnings: [...validation.warnings, 'Structural screening was not supplied for this candidate.'],
      };
    }

    const screening = screenVacuumShell({
      ...candidate.geometry,
      ...candidate.structural,
    });

    return {
      id: candidate.id,
      geometryValid: true,
      volumeL: derived.internalVolumeL,
      surfaceAreaM2: derived.internalSurfaceAreaM2,
      shellMassKg: derived.shellMetalMassKg ?? null,
      structuralStatus: screening.status,
      structuralUtilization: screening.utilization,
      warnings: [...validation.warnings, ...screening.warnings],
    };
  });
}
