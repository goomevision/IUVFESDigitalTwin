/**
 * IUVFES Virtual Hardware Engineering baseline.
 *
 * Values here are simulation baselines from the VMMES concept, not certified
 * manufacturing or safety values. Unverified physical parameters remain explicit
 * engineering inputs until backed by drawings, datasheets, certificates or tests.
 */

export type HardwareParameterStatus = 'BASELINE' | 'ASSUMED' | 'DATASHEET_REQUIRED' | 'CALCULATED' | 'MEASURED' | 'VALIDATED';

export interface HardwareParameter<T = number | string | boolean> {
  value: T;
  unit?: string;
  status: HardwareParameterStatus;
  source?: string;
  note?: string;
}

export interface ReactorHardwareSpecification {
  id: string; type: 'VACUUM_REACTOR'; material: HardwareParameter<string>; workingVolume: HardwareParameter<number>;
  operatingPressure: HardwareParameter<{ min: number; max: number }>;
  operatingTemperature: HardwareParameter<{ min: number; max: number }>;
  internalDiameter: HardwareParameter<number>; shellLength: HardwareParameter<number>; wallThickness: HardwareParameter<number>;
  designExternalPressure: HardwareParameter<number>; designTemperature: HardwareParameter<number>; note: string;
}
export interface HeatingHardwareSpecification { id: string; type: 'HEATING_JACKET'; power: HardwareParameter<{ min: number; max: number }>; heatingArea: HardwareParameter<number>; medium: HardwareParameter<string>; note: string; }
export interface UltrasonicHardwareSpecification { id: string; type: 'ULTRASONIC_TRANSDUCER'; frequency: HardwareParameter<{ min: number; max: number }>; power: HardwareParameter<{ min: number; max: number }>; amplitude: HardwareParameter<number>; dutyCycle: HardwareParameter<number>; note: string; }
export interface VacuumPumpHardwareSpecification { id: string; type: 'VACUUM_PUMP'; nominalCapacity: HardwareParameter<{ min: number; max: number }>; ultimatePressure: HardwareParameter<number>; motorPower: HardwareParameter<number>; pumpCurve: HardwareParameter<string>; liquidCarryoverProtection: HardwareParameter<boolean>; note: string; }
export interface VacuumPipingHardwareSpecification { id: string; type: 'VACUUM_PIPING'; internalDiameter: HardwareParameter<number>; length: HardwareParameter<number>; effectiveLengthFactor: HardwareParameter<number>; outletPressure: HardwareParameter<number>; gasViscosity: HardwareParameter<number>; material: HardwareParameter<string>; note: string; }
export interface ColdTrapHardwareSpecification { id: string; type: 'COLD_TRAP'; temperature: HardwareParameter<number>; volume: HardwareParameter<number>; heatTransferArea: HardwareParameter<number>; overallHeatTransferCoefficient: HardwareParameter<number>; condensateCapacity: HardwareParameter<number>; note: string; }
export interface SensorHardwareSpecification { id: string; type: 'PRESSURE' | 'TEMPERATURE' | 'LEVEL' | 'FLOW' | 'MASS'; range: HardwareParameter<{ min: number; max: number }>; accuracy: HardwareParameter<number>; responseTime: HardwareParameter<number>; calibrationId: HardwareParameter<string>; location: HardwareParameter<string>; }
export interface ValveHardwareSpecification { id: string; type: 'ISOLATION' | 'CONTROL' | 'VENT' | 'VACUUM_BREAKER'; cv: HardwareParameter<number>; responseTime: HardwareParameter<number>; failPosition: HardwareParameter<'OPEN' | 'CLOSED' | 'HOLD'>; pressureRating: HardwareParameter<number>; temperatureRating: HardwareParameter<number>; }
export interface IuvfesHardwareSpecification {
  version: string; systemId: string; designStatus: 'SIMULATION_BASELINE' | 'ENGINEERING_REVIEW' | 'VALIDATED';
  reactor: ReactorHardwareSpecification; heating: HeatingHardwareSpecification; ultrasonic: UltrasonicHardwareSpecification;
  vacuumPump: VacuumPumpHardwareSpecification; vacuumPiping: VacuumPipingHardwareSpecification;
  coldTraps: ColdTrapHardwareSpecification[]; sensors: SensorHardwareSpecification[]; valves: ValveHardwareSpecification[];
}

const baseline = <T>(value: T, unit?: string, note?: string): HardwareParameter<T> => ({ value, unit, status: 'BASELINE', note });
const required = <T>(value: T, unit?: string, note?: string): HardwareParameter<T> => ({ value, unit, status: 'DATASHEET_REQUIRED', note });

export const IUVFES_VMMES_BASELINE: IuvfesHardwareSpecification = {
  version: '0.1.0', systemId: 'IUVFES-VMMES-001', designStatus: 'SIMULATION_BASELINE',
  reactor: {
    id: 'VR-001', type: 'VACUUM_REACTOR', material: baseline('SS316L'), workingVolume: baseline(250, 'L', 'Concept range 200–250 L; nominal baseline 250 L.'),
    operatingPressure: baseline({ min: 10, max: 200 }, 'mbar_abs'), operatingTemperature: baseline({ min: 30, max: 60 }, '°C'),
    internalDiameter: required(0, 'mm', 'Engineering drawing required.'), shellLength: required(0, 'mm', 'Engineering drawing required.'),
    wallThickness: required(0, 'mm', 'External-pressure/vacuum engineering check required.'), designExternalPressure: required(0, 'bar', 'Pressure-vessel engineering input required.'),
    designTemperature: required(0, '°C', 'Design-condition input required.'), note: 'Vacuum shell stability must not be reduced to a simple internal-pressure thickness formula.',
  },
  heating: { id: 'HJ-001', type: 'HEATING_JACKET', power: baseline({ min: 6, max: 12 }, 'kW'), heatingArea: required(0, 'm²'), medium: required('', undefined, 'Heating medium and thermal circuit required.'), note: 'Use energy balance, heat-transfer coefficient, thermal inertia and heat loss.' },
  ultrasonic: { id: 'US-001', type: 'ULTRASONIC_TRANSDUCER', frequency: baseline({ min: 20, max: 40 }, 'kHz'), power: baseline({ min: 3, max: 6 }, 'kW'), amplitude: required(0, 'µm'), dutyCycle: required(0, '%'), note: 'Transducer count, amplitude, mounting and coupling require equipment data.' },
  vacuumPump: { id: 'VP-001', type: 'VACUUM_PUMP', nominalCapacity: baseline({ min: 100, max: 300 }, 'm³/h'), ultimatePressure: required(0, 'mbar_abs'), motorPower: required(0, 'kW'), pumpCurve: required('', undefined, 'Vendor pump curve required.'), liquidCarryoverProtection: baseline(true), note: 'Evacuation dynamics depend on pump curve, chamber volume, piping, valves, vapor load and leak rate.' },
  vacuumPiping: { id: 'PS-001', type: 'VACUUM_PIPING', internalDiameter: required(0, 'mm', 'P&ID/isometric drawing required.'), length: required(0, 'm', 'Piping isometric required.'), effectiveLengthFactor: baseline(1, '×', 'Increase for bends/fittings only after engineering review.'), outletPressure: required(0, 'mbar_abs', 'Pump operating condition required.'), gasViscosity: baseline(1.81e-5, 'Pa·s', 'Air-like screening value at approximately room temperature.'), material: required('', undefined, 'Piping material/datasheet required.'), note: 'Conductance is regime-dependent; use reduced-order screening only.' },
  coldTraps: [
    { id: 'CT-001', type: 'COLD_TRAP', temperature: baseline(0, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), overallHeatTransferCoefficient: required(0, 'W/m²/K'), condensateCapacity: required(0, 'kg'), note: 'Stage 1 nominal +5 to 0 °C.' },
    { id: 'CT-002', type: 'COLD_TRAP', temperature: baseline(-20, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), overallHeatTransferCoefficient: required(0, 'W/m²/K'), condensateCapacity: required(0, 'kg'), note: 'Stage 2 nominal −20 °C.' },
    { id: 'CT-003', type: 'COLD_TRAP', temperature: baseline(-40, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), overallHeatTransferCoefficient: required(0, 'W/m²/K'), condensateCapacity: required(0, 'kg'), note: 'Stage 3 nominal −40 °C.' },
    { id: 'CT-004', type: 'COLD_TRAP', temperature: baseline(-80, '°C'), volume: required(0, 'L'), heatTransferArea: required(0, 'm²'), overallHeatTransferCoefficient: required(0, 'W/m²/K'), condensateCapacity: required(0, 'kg'), note: 'Stage 4 nominal −70 to −80 °C.' },
  ],
  sensors: [
    { id: 'PT-001', type: 'PRESSURE', range: required({ min: 0, max: 0 }, 'mbar_abs'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required(''), location: baseline('Reactor') },
    { id: 'TT-001', type: 'TEMPERATURE', range: required({ min: 0, max: 0 }, '°C'), accuracy: required(0, '°C'), responseTime: required(0, 's'), calibrationId: required(''), location: baseline('Reactor') },
    { id: 'LT-001', type: 'LEVEL', range: required({ min: 0, max: 0 }, '%'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required(''), location: baseline('Cold Trap 1') },
    { id: 'FT-001', type: 'FLOW', range: required({ min: 0, max: 0 }, 'm³/h'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required(''), location: baseline('Cooling circuit') },
    { id: 'WT-001', type: 'MASS', range: required({ min: 0, max: 0 }, 'kg'), accuracy: required(0, '%FS'), responseTime: required(0, 's'), calibrationId: required(''), location: baseline('Reactor support') },
  ],
  valves: [
    { id: 'XV-001', type: 'ISOLATION', cv: required(0), responseTime: required(0, 's'), failPosition: required('CLOSED'), pressureRating: required(0, 'bar'), temperatureRating: required(0, '°C') },
    { id: 'XV-002', type: 'VACUUM_BREAKER', cv: required(0), responseTime: required(0, 's'), failPosition: required('OPEN'), pressureRating: required(0, 'bar'), temperatureRating: required(0, '°C') },
    { id: 'XV-003', type: 'VENT', cv: required(0), responseTime: required(0, 's'), failPosition: required('CLOSED'), pressureRating: required(0, 'bar'), temperatureRating: required(0, '°C') },
  ],
};

export function cloneHardwareSpecification(): IuvfesHardwareSpecification {
  return JSON.parse(JSON.stringify(IUVFES_VMMES_BASELINE)) as IuvfesHardwareSpecification;
}
