import {
  evaluateTransformedGibbs,
  gibbsProperties,
  type GibbsCoefficient,
  type GibbsPropertyState,
} from "./if97GibbsDerivativeKernel";

/** IAPWS-IF97 Region 1 coefficients, Table 3 / Eq. (7). */
export const REGION1_COEFFICIENTS: readonly GibbsCoefficient[] = [
  [0, -2, 0.14632971213167], [0, -1, -0.84548187169114], [0, 0, -0.37563603672040e1],
  [0, 1, 0.33855169168385e1], [0, 2, -0.95791963387872], [0, 3, 0.15772038513228],
  [0, 4, -0.16616417199501e-1], [0, 5, 0.81214629983568e-3], [1, -9, 0.28319080123804e-3],
  [1, -7, -0.60706301565874e-3], [1, -1, -0.18990068218419e-1], [1, 0, -0.32529748770505e-1],
  [1, 1, -0.21841717175414e-1], [1, 3, -0.52838357969930e-4], [2, -3, -0.47184321073267e-3],
  [2, 0, -0.30001780793026e-3], [2, 1, 0.47661393906987e-4], [2, 3, -0.44141845330846e-5],
  [2, 17, -0.72694996297594e-15], [3, -4, -0.31679644845054e-4], [3, 0, -0.28270797985312e-5],
  [3, 6, -0.85205128120103e-9], [4, -5, -0.22425281908000e-5], [4, -2, -0.65171222895601e-6],
  [4, 10, -0.14341729937924e-12], [5, -8, -0.40516996860117e-6], [8, -11, -0.12734301741641e-8],
  [8, -6, -0.17424871230634e-9], [21, -29, -0.68762131295531e-18], [23, -31, 0.14478307828521e-19],
  [29, -38, 0.26335781662795e-22], [30, -39, -0.11947622640071e-22], [31, -40, 0.18228094581404e-23],
  [32, -41, -0.93537087292458e-25],
].map(([I, J, n]) => ({ I, J, n }));

export const REGION1_CONSTANTS = {
  pressureScaleMPa: 16.53,
  temperatureScaleK: 1386,
  gasConstantJPerKgK: 461.526,
} as const;

export function region1Properties(temperatureK: number, pressureMPa: number): GibbsPropertyState {
  if (temperatureK < 273.15 || temperatureK > 623.15 || pressureMPa <= 0 || pressureMPa > 100) {
    throw new Error("IF97 Region 1 state is outside its basic T-p envelope");
  }

  const pi = pressureMPa / REGION1_CONSTANTS.pressureScaleMPa;
  const tau = REGION1_CONSTANTS.temperatureScaleK / temperatureK;
  const evaluation = evaluateTransformedGibbs(
    pi,
    tau,
    REGION1_COEFFICIENTS,
    7.1,
    -1.222,
    -1,
    1,
  );

  return gibbsProperties(
    evaluation,
    temperatureK,
    REGION1_CONSTANTS.pressureScaleMPa,
    REGION1_CONSTANTS.gasConstantJPerKgK,
    pressureMPa,
    REGION1_CONSTANTS.temperatureScaleK,
  );
}
