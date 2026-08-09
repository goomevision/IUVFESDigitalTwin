/**
 * Scientific Material Knowledge Base (SMKB) foundation.
 *
 * Literature-derived values are stored as evidence records, not as universal
 * constants. A property can carry a range, operating conditions, source,
 * method, uncertainty and validation status.
 */

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'M' | 'V';
export type ValidationStatus = 'RAW' | 'LITERATURE' | 'STANDARD' | 'CALCULATED' | 'MEASURED' | 'CALIBRATED' | 'VALIDATED' | 'DATA_GAP';

export interface ScientificSource {
  sourceId: string;
  title: string;
  sourceType: 'STANDARD' | 'JOURNAL' | 'TECHNICAL_PROCEDURE' | 'DATABASE' | 'DATASHEET';
  authors?: string[];
  year?: number;
  doi?: string;
  url?: string;
  publisher?: string;
  evidenceGrade: EvidenceGrade;
}

export interface MaterialPropertyEvidence {
  evidenceId: string;
  materialId: string;
  property: string;
  value?: number;
  min?: number;
  max?: number;
  unit: string;
  temperatureC?: number;
  pressureKPa?: number;
  moisturePercent?: number;
  method?: string;
  sourceId?: string;
  sourceLocation?: string;
  uncertainty?: number;
  validationStatus: ValidationStatus;
  notes?: string;
}

export interface MaterialRecord {
  materialId: string;
  scientificName?: string;
  commonName: string;
  category: 'BIOMASS' | 'FLUID' | 'OIL' | 'METAL' | 'POLYMER' | 'OTHER';
  state?: string;
  properties: MaterialPropertyEvidence[];
}

export const SMKB_SOURCES: ScientificSource[] = [
  {
    sourceId: 'SRC-IAPWS-95',
    title: 'IAPWS Formulation 1995 for the Thermodynamic Properties of Ordinary Water Substance for General and Scientific Use',
    sourceType: 'STANDARD', year: 1995,
    url: 'https://www.iapws.org/relguide/IAPWS-95.html',
    publisher: 'International Association for the Properties of Water and Steam', evidenceGrade: 'A',
  },
  {
    sourceId: 'SRC-IAPWS-THCOND',
    title: 'IAPWS Formulation 2011 for the Thermal Conductivity of Ordinary Water Substance',
    sourceType: 'STANDARD', year: 2011,
    url: 'https://www.iapws.org/relguide/ThCond.html',
    publisher: 'International Association for the Properties of Water and Steam', evidenceGrade: 'A',
  },
  {
    sourceId: 'SRC-NREL-STRUCTURAL',
    title: 'Determination of Structural Carbohydrates and Lignin in Biomass',
    sourceType: 'TECHNICAL_PROCEDURE',
    url: 'https://research-hub.nrel.gov/en/publications/determination-of-structural-carbohydrates-and-lignin-in-biomass-l/',
    publisher: 'National Renewable Energy Laboratory', evidenceGrade: 'A',
  },
  {
    sourceId: 'SRC-NREL-EXTRACTIVES',
    title: 'Determination of Extractives in Biomass',
    sourceType: 'TECHNICAL_PROCEDURE',
    url: 'https://research-hub.nrel.gov/en/publications/determination-of-extractives-in-biomass-laboratory-analytical-pro/',
    publisher: 'National Renewable Energy Laboratory', evidenceGrade: 'A',
  },
  {
    sourceId: 'SRC-PATCHOULI-DRYING-ID',
    title: 'Patchouli leaf drying study', sourceType: 'JOURNAL',
    url: 'https://ejournal.unib.ac.id/JIPI/article/view/4772',
    publisher: 'Jurnal Ilmu-Ilmu Pertanian Indonesia', evidenceGrade: 'B',
  },
  {
    sourceId: 'SRC-PATCHOULI-SC-CO2',
    title: 'Supercritical CO2 extraction study of patchouli', sourceType: 'JOURNAL',
    url: 'https://www.sciencedirect.com/science/article/pii/S100495411831245X',
    publisher: 'ScienceDirect', evidenceGrade: 'B',
  },
  {
    sourceId: 'SRC-PATCHOULI-GCMS',
    title: 'Patchouli oil chemical composition / GC-MS study', sourceType: 'JOURNAL',
    url: 'https://ojs3.unpatti.ac.id/index.php/ijcr/article/view/1898',
    publisher: 'Indonesian Journal of Chemical Research', evidenceGrade: 'B',
  },
  {
    sourceId: 'SRC-PENDING-SS316L',
    title: 'Pending authoritative 316L material source; no numeric value supplied',
    sourceType: 'DATASHEET', evidenceGrade: 'E',
  },
];

export const SMKB_MATERIALS: MaterialRecord[] = [
  {
    materialId: 'MAT-WATER', commonName: 'Water', scientificName: 'H2O', category: 'FLUID', state: 'liquid/vapor',
    properties: [
      { evidenceId: 'EVD-WATER-THERMO-IAPWS', materialId: 'MAT-WATER', property: 'thermodynamic_properties', unit: 'function(T,P)', sourceId: 'SRC-IAPWS-95', validationStatus: 'STANDARD', notes: 'Use IAPWS formulation rather than a single fixed Cp/density value.' },
      { evidenceId: 'EVD-WATER-K-IAPWS', materialId: 'MAT-WATER', property: 'thermal_conductivity', unit: 'W/m/K', sourceId: 'SRC-IAPWS-THCOND', validationStatus: 'STANDARD', notes: 'Temperature/pressure dependent formulation.' },
    ],
  },
  {
    materialId: 'MAT-PATCHOULI-LEAF', commonName: 'Patchouli leaf', scientificName: 'Pogostemon cablin', category: 'BIOMASS', state: 'fresh/dried',
    properties: [
      { evidenceId: 'EVD-PATCHOULI-MOISTURE', materialId: 'MAT-PATCHOULI-LEAF', property: 'moisture_content', min: 0, max: 100, unit: '% wet basis', sourceId: 'SRC-PATCHOULI-DRYING-ID', validationStatus: 'LITERATURE', notes: 'Literature values are process/sample dependent; retain measured moisture for an actual batch.' },
      { evidenceId: 'EVD-PATCHOULI-YIELD-SC', materialId: 'MAT-PATCHOULI-LEAF', property: 'oil_yield', unit: '% mass/mass', sourceId: 'SRC-PATCHOULI-SC-CO2', validationStatus: 'LITERATURE', notes: 'Do not treat reported yield as universal; retain extraction conditions.' },
      { evidenceId: 'EVD-PATCHOULI-COMPOSITION-GCMS', materialId: 'MAT-PATCHOULI-LEAF', property: 'oil_composition', unit: '% relative composition', sourceId: 'SRC-PATCHOULI-GCMS', method: 'GC-MS', validationStatus: 'LITERATURE', notes: 'Composition is sample/process dependent and must retain source conditions.' },
      { evidenceId: 'EVD-PATCHOULI-CELLULOSE', materialId: 'MAT-PATCHOULI-LEAF', property: 'cellulose', unit: '% dry matter', sourceId: 'SRC-NREL-STRUCTURAL', validationStatus: 'DATA_GAP', notes: 'Method source exists; patchouli-specific numeric evidence must be separately extracted and cited.' },
      { evidenceId: 'EVD-PATCHOULI-LIGNIN', materialId: 'MAT-PATCHOULI-LEAF', property: 'lignin', unit: '% dry matter', sourceId: 'SRC-NREL-STRUCTURAL', validationStatus: 'DATA_GAP', notes: 'Method source exists; patchouli-specific numeric evidence must be separately extracted and cited.' },
      { evidenceId: 'EVD-PATCHOULI-EXTRACTIVES', materialId: 'MAT-PATCHOULI-LEAF', property: 'extractives', unit: '% dry matter', sourceId: 'SRC-NREL-EXTRACTIVES', validationStatus: 'DATA_GAP', notes: 'Method source exists; no numeric patchouli value is inferred.' },
    ],
  },
  { materialId: 'MAT-CELLULOSE', commonName: 'Cellulose', scientificName: 'Cellulose', category: 'BIOMASS', state: 'solid', properties: [] },
  { materialId: 'MAT-HEMICELLULOSE', commonName: 'Hemicellulose', scientificName: 'Hemicellulose', category: 'BIOMASS', state: 'solid', properties: [] },
  { materialId: 'MAT-LIGNIN', commonName: 'Lignin', scientificName: 'Lignin', category: 'BIOMASS', state: 'solid', properties: [] },
  {
    materialId: 'MAT-SS316L', commonName: 'Stainless steel 316L', scientificName: 'AISI 316L / UNS S31603', category: 'METAL', state: 'solid',
    properties: [{ evidenceId: 'EVD-SS316L-DATA-GAP', materialId: 'MAT-SS316L', property: 'engineering_properties', unit: 'source-dependent', sourceId: 'SRC-PENDING-SS316L', validationStatus: 'DATA_GAP', notes: 'No numeric engineering values are permitted until an authoritative 316L source is attached.' }],
  },
];

export function findMaterial(materialId: string): MaterialRecord | undefined { return SMKB_MATERIALS.find((material) => material.materialId === materialId); }
export function findSource(sourceId: string): ScientificSource | undefined { return SMKB_SOURCES.find((source) => source.sourceId === sourceId); }
export function listDataGaps(): MaterialPropertyEvidence[] { return SMKB_MATERIALS.flatMap((material) => material.properties).filter((property) => property.validationStatus === 'DATA_GAP'); }
