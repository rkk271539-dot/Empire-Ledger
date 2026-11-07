import { Rng } from './rng';
import { clamp } from './stochastic';

export function chooseLean(
  scores: Record<string, number>,
  current: string | null,
  pers: { patience: number; loyalty: number; temp: number },
  bondToCurrent: number,
  rng: Rng
): string {
  const hysteresis = 0.15 + 0.5 * pers.loyalty + 0.3 * pers.patience + 0.4 * (bondToCurrent / 100);
  const adj = Object.entries(scores).map(([k, v]) => [k, v + (k === current ? hysteresis : 0)] as const);
  const m = Math.max(...adj.map(a => a[1]));
  const w = adj.map(([k, v]) => [k, Math.exp((v - m) / pers.temp)] as const);
  const total = w.reduce((a, b) => a + b[1], 0);
  let u = rng.next() * total;
  for (const [k, x] of w) {
    u -= x;
    if (u <= 0) return k;
  }
  return current ?? adj[0][0];
}

export function flowStep(excite: number, mu: number, eventImpulse: number, alpha = 0.8, decay = 0.25) {
  const next = excite * Math.exp(-decay) + alpha * eventImpulse;
  return { excite: next, intensity: mu + next };
}

export function targetWeight(muHat: number, rf: number, sigma: number, gamma: number, confidence: number, maxW: number) {
  const f = (muHat - rf) / (gamma * sigma * sigma);
  return clamp(f * confidence * 0.5, 0, maxW);
}
