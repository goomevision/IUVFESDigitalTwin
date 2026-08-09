export type Region2State = {
  temperatureK: number;
  pressureMPa: number;
  specificVolumeM3PerKg: number;
  enthalpyKJPerKg: number;
  internalEnergyKJPerKg: number;
  entropyKJPerKgK: number;
  cpKJPerKgK: number;
};

const R = 0.461526; // kJ/(kg K)
const T_STAR = 540;
const P_STAR = 1;

const J0 = [0, 1, -5, -4, -3, -2, -1, 2, 3] as const;
const N0 = [-9.6927686500217, 10.086655968018, -0.005608791128302, 0.071452738081455, -0.40710498223928, 1.4240819171444, -4.383951131945, -0.28408632460772, 0.021268463753307] as const;

const I = [1,1,1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,5,6,6,6,7,7,7,8,8,9,10,10,10,16,16,18,20,20,20,21,22,23,24,24,24] as const;
const J = [0,1,2,3,6,1,2,4,7,36,0,1,3,6,35,1,2,3,7,3,16,35,0,11,25,8,36,13,4,10,14,29,50,57,20,35,48,21,53,39,26,40,58] as const;
const N = [-1.7731742473213e-3,-0.017834862292358,-0.045996013696365,-0.057581259083432,-0.05032527872793,-3.3032641670203e-5,-1.8948987516315e-4,-3.9392777243355e-3,-0.043797295650573,-2.6674547914087e-5,2.0481737692309e-8,4.3870667284435e-7,-3.227767723857e-5,-1.5033924542148e-3,-0.040668253562649,-7.8847309559367e-10,1.2790717852285e-8,4.8225372718507e-7,2.2922076337661e-6,-1.6714766451061e-11,-2.1171472321355e-3,-23.895741934104,-5.905956432427e-18,-1.2621808899101e-6,-0.038946842435739,1.1256211360459e-11,-8.2311340897998,1.9809712802088e-8,1.0406965210174e-19,-1.0234747095929e-13,-1.0018179379511e-9,-8.0882908646985e-11,0.10693031879409,-0.33662250574171,8.9185845355421e-25,3.0629316876232e-13,-4.2002467698208e-6,-5.9056029685639e-26,3.7826947613457e-6,-1.2768608934681e-15,7.3087610595061e-29,5.5414715350778e-17,-9.436970724121e-7] as const;

function sumTerms<T>(items: readonly T[], fn: (item: T, index: number) => number): number {
  let total = 0;
  for (let index = 0; index < items.length; index += 1) total += fn(items[index], index);
  return total;
}

/** IAPWS-IF97 Region 2 basic equation (Eq. 15-17). */
export function region2Properties(pressureMPa: number, temperatureK: number): Region2State {
  if (!Number.isFinite(pressureMPa) || !Number.isFinite(temperatureK) || pressureMPa <= 0 || temperatureK < 273.15 || temperatureK > 1073.15) {
    throw new Error("Region 2 state is outside the supported numeric domain");
  }

  const pi = pressureMPa / P_STAR;
  const tau = T_STAR / temperatureK;
  const x = tau - 0.5;

  const gamma0 = Math.log(pi) + sumTerms(J0, (j, k) => N0[k] * Math.pow(tau, j));
  const gamma0Pi = 1 / pi;
  const gamma0Tau = sumTerms(J0, (j, k) => j === 0 ? 0 : N0[k] * j * Math.pow(tau, j - 1));
  const gamma0TauTau = sumTerms(J0, (j, k) => (j === 0 || j === 1) ? 0 : N0[k] * j * (j - 1) * Math.pow(tau, j - 2));

  const gammaR = sumTerms(I, (i, k) => N[k] * Math.pow(pi, i) * Math.pow(x, J[k]));
  const gammaRPi = sumTerms(I, (i, k) => N[k] * i * Math.pow(pi, i - 1) * Math.pow(x, J[k]));
  const gammaRTau = sumTerms(I, (i, k) => J[k] === 0 ? 0 : N[k] * Math.pow(pi, i) * J[k] * Math.pow(x, J[k] - 1));
  const gammaRTauTau = sumTerms(I, (i, k) => (J[k] === 0 || J[k] === 1) ? 0 : N[k] * Math.pow(pi, i) * J[k] * (J[k] - 1) * Math.pow(x, J[k] - 2));

  const gamma = gamma0 + gammaR;
  const gammaPi = gamma0Pi + gammaRPi;
  const gammaTau = gamma0Tau + gammaRTau;

  const specificVolumeM3PerKg = R * temperatureK / pressureMPa * pi * gammaPi / 1000;
  const enthalpyKJPerKg = R * temperatureK * tau * gammaTau;
  const entropyKJPerKgK = R * (tau * gammaTau - gamma);
  const internalEnergyKJPerKg = R * temperatureK * (tau * gammaTau - pi * gammaPi);
  const cpKJPerKgK = -R * tau * tau * (gamma0TauTau + gammaRTauTau);

  return {
    temperatureK,
    pressureMPa,
    specificVolumeM3PerKg,
    enthalpyKJPerKg,
    internalEnergyKJPerKg,
    entropyKJPerKgK,
    cpKJPerKgK,
  };
}
