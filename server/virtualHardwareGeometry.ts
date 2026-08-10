/** Geometry-derived quantities for the VMMES virtual hardware model. */
export interface CylindricalChamberGeometry { innerDiameterM: number; cylindricalLengthM: number; wallThicknessM: number; }
export interface GeometryDerivedParameters { internalVolumeM3: number; internalVolumeL: number; internalSurfaceAreaM2: number; shellMetalVolumeM3: number; shellMetalMassKg?: number; geometricAspectRatio: number; }
export interface GeometryValidation { valid: boolean; errors: string[]; warnings: string[]; }
export function deriveCylindricalChamber(geometry: CylindricalChamberGeometry, materialDensityKgPerM3?: number): GeometryDerivedParameters {
  const radius = geometry.innerDiameterM / 2;
  const internalVolumeM3 = Math.PI * radius ** 2 * geometry.cylindricalLengthM;
  const outerRadius = radius + geometry.wallThicknessM;
  const shellMetalVolumeM3 = Math.max(0, Math.PI * (outerRadius ** 2 - radius ** 2) * geometry.cylindricalLengthM);
  const internalSurfaceAreaM2 = 2 * Math.PI * radius * geometry.cylindricalLengthM + 2 * Math.PI * radius ** 2;
  return { internalVolumeM3, internalVolumeL: internalVolumeM3 * 1000, internalSurfaceAreaM2, shellMetalVolumeM3, shellMetalMassKg: materialDensityKgPerM3 === undefined ? undefined : shellMetalVolumeM3 * materialDensityKgPerM3, geometricAspectRatio: geometry.cylindricalLengthM / Math.max(geometry.innerDiameterM, Number.EPSILON) };
}
export function validateCylindricalChamberGeometry(geometry: CylindricalChamberGeometry): GeometryValidation {
  const errors: string[] = []; const warnings: string[] = [];
  if (!Number.isFinite(geometry.innerDiameterM) || geometry.innerDiameterM <= 0) errors.push('innerDiameterM must be greater than zero.');
  if (!Number.isFinite(geometry.cylindricalLengthM) || geometry.cylindricalLengthM <= 0) errors.push('cylindricalLengthM must be greater than zero.');
  if (!Number.isFinite(geometry.wallThicknessM) || geometry.wallThicknessM <= 0) errors.push('wallThicknessM must be greater than zero.');
  if (Number.isFinite(geometry.innerDiameterM) && Number.isFinite(geometry.wallThicknessM) && geometry.wallThicknessM >= geometry.innerDiameterM / 2) errors.push('wallThicknessM must remain below the inner radius for this simple cylindrical model.');
  if (Number.isFinite(geometry.innerDiameterM) && Number.isFinite(geometry.cylindricalLengthM) && geometry.cylindricalLengthM / geometry.innerDiameterM > 10) warnings.push('High aspect ratio: unsupported length and structural stability require engineering review.');
  return { valid: errors.length === 0, errors, warnings };
}
