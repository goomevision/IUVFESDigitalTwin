export type MaterialEvidenceValidationStatus = 'STANDARD' | 'MEASURED' | 'CALIBRATED' | 'DATA_GAP';

export interface ScientificSource { sourceId: string; title?: string; citation?: string; evidenceGrade: 'A' | 'B' | 'C'; }

export interface MaterialEvidence { evidenceId: string; sourceId?: string; property: string; value?: number; min?: number; max?: number; unit?: string; temperatureC?: number; pressureKPa?: number; uncertainty?: number; validationStatus: MaterialEvidenceValidationStatus; }

export interface MaterialRecord { materialId: string; name?: string; properties: MaterialEvidence[]; }
