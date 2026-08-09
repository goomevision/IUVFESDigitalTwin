/**
 * IUVFES Virtual Hardware Engineering baseline.
 *
 * These values are simulation baselines derived from the current VMMES concept.
 * They are NOT manufacturing or safety-certified design values. Physical values
 * must be replaced by verified drawings, vendor datasheets, material
 * certificates, inspection records and competent engineering calculations.
 */

export type HardwareParameterStatus =
  | 'BASELINE'
  | 'ASSUMED'
  | 'DATASHEET_REQUIRED'
  | 'CALCULATED'
  | 'MEASURED'
  | 'VALIDATED';

export interface HardwareParameter<T = number | string | boolean> {
  value: T;
  unit?: string;
  status: HardwareParameterStatus;
  source?: string;
  note?: string;
}

export interface ReactorHardwareSpecification {
  id: string;
  type: 'VACUUM_REACTOR';
  material: HardwareParameter<string>;
  workingVolume: HardwareParameter<number>;
  operatingPressure: HardwareParameter<{ min: number; max: number }>;
  operatingTemperature: HardwareParameter<{ min: number; max: number }>;
  internalDiameter: HardwareParameter<number>;
  shellLength: HardwareParameter<number>;
  wallThickness: HardwareParameter<number>;
  designExternalPressure: HardwareParameter<number>;
  designTemperature: HardwareParameter<number>;
  note: string;
}

export interface HeatingHardwareSpecification {
  id: string;
  type: 'HEATING_JACKET';
  power: HardwareParameter<{ min: number; max: number }>;
  heatingArea: HardwareParameter<number>;
  medium: HardwareParameter<string>;
  note: string;
}

export interface UltrasonicHardwareSpecification {
  id: string;
  type: 'ULTRASONIC_TRANSDUCER';
  frequency: HardwareParameter<{ min: number; max: number }>;
  power: HardwareParameter<{ min: number; max: number }>;
  amplitude: HardwareParameter<number>;
  dutyCycle: HardwareParameter<number>;
  note: string;
}

export interface VacuumPumpHardwareSpecification {
  id: string;
  type: 'VACUUM_PUMP';
  nominalCapacity: HardwareParameter<{ min: number; max: number }>;
  ultimatePressure: HardwareParameter<number>;
  motorPower: HardwareParameter<number>;
  pumpCurve: HardwareParameter<string>;
  liquidCarryoverProtection: HardwareParameter<boolean>;
  note: string;
}

export interface ColdTrapHardwareSpecification {
  id: string;
  type: 'COLD_TRAP';
  temperature: HardwareParameter<number>;
  volume: HardwareParameter<number>;
  heatTransferArea: HardwareParameter<number>;
  condensateCapacity: HardwareParameter<number>;
  note: string;
}

export interface SensorHardwareSpecification {
  id: string;
  type: 'PRESSURE' | 'TEMPERATURE' | 'LEVEL' | 'FLOW' | 'MASS';
  range: HardwareParameter<{ min: number; max: number }>;
  accuracy: HardwareParameter<number>;
  responseTime: HardwareParameter<number>;
  calibrationId: HardwareParameter<string>;
  location: HardwareParameter<string>;
}

export interface ValveHardwareSpecification {
  id: string;
  type: 'ISOLATION' | 'CONTROL' | 'VENT' | 'VACUUM_BREAKER';
  cv: HardwareParameter<number>;
  responseTime: HardwareParameter<number>;
  failPosition: HardwareParameter<'OPEN' | 'CLOSED' | 'HOLD'>;
  pressureRating: HardwareParameter<number>;
  temperatureRating: HardwareParameter<number>;
}

export interface IuvfesHardwareSpecification {
  version: string;
  systemId: string;
  designStatus: 'SIMULATION_BASELINE' | 'ENGINEERING_REVIEW' | 'VALIDATED';
  reactor: ReactorHardwareSpecification;
  heating: HeatingHardwareSpecification;
  ultrasonic: UltrasonicHardwareSpecification;
  vacuumPump: VacuumPumpHardwareSpecification;
  coldTraps: ColdTrapHardwareSpecification[];
  sensors: SensorHardwareSpecification[];
  valves: ValveHardwareSpecification[];
}

const baseline = <T>(value: T, unit?: string, note?: string): HardwareParameter<T> => ({
  value,
  unit,
  status: 'BASELINE',
  note,
});

const required = <T>(value: T, unit?: string, note?: string): HardwareParameter<T> => ({
  value,
  unit,
  status: 'DATASHEET_REQUIRED',
  note,
});

/**
 * Current VMMES baseline from the project concept.
 * Geometry and structural values are deliberately left as engineering inputs.
 */
export const IUVFES_VMMES_BASELINE: IuvfesHardwareSpecification = {
  version: '0.1.0',
  systemId: 'IUVFES-VMMES-001',
  designStatus: 'SIMULATION_BASELINE',
  reactor: {
    id: 'VR-001',
    type: 'VACUUM_REACTOR',
    material: baseline('SS316L'),
    workingVolume: baseline(250, 'L', 'Concept range 200–250 L; nominal baseline is 250 L.'),
    operatingPressure: baseline({ min: 10, max: 200 }, 'mbar_abs'),
    operatingTemperature: baseline({ min: 30, max: 60 }, '°C'),
    internalDiameter: required(0, 'mm', 'Must come from engineering drawing.'),
    shellLength: required(0, 'mm', 'Must come from engineering drawing.'),
    wallThickness: required(0, 'mm', 'Must be calculated and verified for external-pressure/vacuum loading.'),
    designExternalPressure: required(0, 'bar', 'Must be established by pressure-vessel engineering.'),
    designTemperature: required(0, '°C', 'Must be established by design conditions.'),
    note: 'Do not infer manufacturing thickness from a simple internal-pressure formula; vacuum shell stability requires external-pressure/buckling assessment.',
  },
  heating: {
    id: 'HJ-001',
    type: 'HEATING_JACKET',
    power: baseline({ min: 6, max: 12 }, 'kW'),
    heatingArea: required(0, 'm²'),
    medium: required('', undefined, 'Heating medium and thermal circuit must be specified.'),
    note: 'Thermal model must include jacket area, heat-transfer coefficient, thermal inertia and heat loss.',
  },
  ultrasonic: {
    id: 'US-001',
    type: 'ULTRASONIC_TRANSDUCER',
    frequency: baseline({ min: 20, max: 40 }, 'kHz'),
    power: baseline({ min: 3, max: 6 }, 'kW'),
    amplitude: required(0, 'µm'),
    dutyCycle: required(0, '%'),
    note: 'Frequency and power are conceptual baselines; transducer count, amplitude, mounting and coupling require equipment data.',
  },
  vacuumPump: {
    id: 'VP-001',
    type: 'VACUUM_PUMP',
    nominalCapacity: baseline({ min: 100, max: 300 }, 'm³/h'),
    ultimatePressure: required(0, 'mbar_abs'),
    motorPower: required(0, 'kW'),
    pumpCurve: required('', undefined, 'Use the vendor pump curve rather than nominal free-air capacity alone.'),
    liquidCarryoverProtection: baseline(true),
    note: 'Actual evacuation dynamics depend on pump curve, chamber volume, piping, valve position, vapor load and leak rate.',
  },
  coldTraps: [
    { id: 'CT-001', type: 'COLD_TRAP', temperature: baseline(0, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), condensateCapacity: required(0, 'kg'), note: 'Stage 1 nominal range +5 to 0 °C.' },
    { id: 'CT-002', type: 'COLD_TRAP', temperature: baseline(-20, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), condensateCapacity: required(0, 'kg'), note: 'Stage 2 nominal target −20 °C.' },
    { id: 'CT-003', type: 'COLD_TRAP', temperature: baseline(-40, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), condensateCapacity: required(0, 'kg'), note: 'Stage 3 nominal target −40 °C.' },
    { id: 'CT-004', type: 'COLD_TRAP', temperature: baseline(-80, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), condensateCapacity: required(0, 'kg'), note: 'Stage 4 nominal range −70 to −80 °C.' },
  ],
  sensors: [
    { id: 'PT-001', type: 'PRESSURE', range: required({ min: 0, max: 0 }, 'mbar_abs'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required('', undefined), location: baseline('Reactor') },
    { id: 'TT-001', type: 'TEMPERATURE', range: required({ min: 0, max: 0 }, '°C'), accuracy: required(0, '°C'), responseTime: required(0, 's'), calibrationId: required('', undefined), location: baseline('Reactor') },
    { id: 'LT-001', type: 'LEVEL', range: required({ min: 0, max: 0 }, '%'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required('', undefined), location: baseline('Cold Trap 1') },
    { id: 'FT-001', type: 'FLOW', range: required({ min: 0, max: 0 }, 'm³/h'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required('', undefined), location: baseline('Cooling circuit') },
    { id: 'WT-001', type: 'MASS', range: required({ min: 0, max: 0 }, 'kg'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required('', undefined), location: baseline('Reactor support') },
  ],
  valves: [
    { id: 'XV-001', type: 'ISOLATION', cv: required(0), responseTime: required(0, 's'), failPosition: required('CLOSED'), pressureRating: required(0, 'bar'), temperatureRating: required(0, '°C') },
    { id: 'XV-002', type: 'VACUUM_BREAKER', cv: required(0), responseTime: required(0, 's'), failPosition: required('OPEN'), pressureRating: required(0, 'bar'), temperatureRating: required(0, '°C') },
    { id: 'XV-003', type: 'VENT', cv: required(0), responseTime: required(0, 's'), failPosition: required('CLOSED'), pressureRating: required(0, 'bar'), temperatureRating: required(0, '°C') },
  ],
};

export function cloneHardwareSpecification(): IuvfesHardwareSpecification {
  return structuredClone(IUVFES_VMMES_BASELINE);
}
