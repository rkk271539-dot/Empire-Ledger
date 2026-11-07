import { Rng } from './rng';

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

// Ornstein-Uhlenbeck (mean-reverting) with EXACT discretisation, stable for any dt.
// Use for: growth rates, sentiment, volatility targets, trust drivers, macro variables.
export function ouStep(x: number, mean: number, kappa: number, sigma: number, dt: number, z: number): number {
  const e = Math.exp(-kappa * dt);
  return mean + (x - mean) * e + sigma * Math.sqrt((1 - e * e) / (2 * kappa)) * z;
}

// Markov regime switching: 0 = calm, 1 = normal, 2 = stressed.
// 'stress' (0..1) from the macro layer tilts transition probabilities, so crashes cluster and regimes persist.
export type Regime = 0 | 1 | 2;

export function nextRegime(r: Regime, stress: number, rng: Rng): Regime {
  const base = [
    [0.970, 0.028, 0.002],
    [0.020, 0.950, 0.030],
    [0.010, 0.070, 0.920],
  ];
  const row = base[r].slice();
  row[2] *= 1 + 6 * stress;   // stress makes the stressed regime likelier and stickier
  row[0] *= 1 - 0.7 * stress; // and calm less likely
  const sum = row[0] + row[1] + row[2];
  const u = rng.next() * sum;
  return u < row[0] ? 0 : u < row[0] + row[1] ? 1 : 2;
}

// Correlated normals via Cholesky. Correlations RISE with stress (diversification fails in crashes).
export function stressedCorr(base: number[][], stress: number): number[][] {
  return base.map((row, i) => row.map((c, j) => (i === j ? 1 : c + (1 - c) * 0.6 * stress)));
}

export function cholesky(A: number[][]): number[][] {
  const n = A.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(A[i][i] - sum, 1e-12)) : (A[i][j] - sum) / L[j][j];
    }
  }
  return L;
}

export function correlatedNormals(L: number[][], rng: Rng): number[] {
  const z = L.map(() => rng.normal());
  return L.map((row, i) => row.reduce((s, l, j) => s + (j <= i ? l * z[j] : 0), 0));
}

// Example: parameters drift too. Long-run variance target rises with market stress and wanders on its own.
export function driftTheta(thetaV: number, baseTheta: number, stress: number, rng: Rng): number {
  return Math.max(1e-6, ouStep(thetaV, baseTheta * (1 + 2 * stress), 0.03, baseTheta * 0.05, 1, rng.normal()));
}
