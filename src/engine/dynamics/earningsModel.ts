import { Rng } from './rng';
import { clamp, ouStep } from './stochastic';

export interface BizState {
  trendRev: number;     // trend daily revenue
  g: number;            // annualised growth rate (a state, not a constant)
  share: number;        // market share (0..1)
  attract: number;      // product attractiveness index
  quality: number;      // 0..1
  morale: number;       // 0..1
  headcount: number;
  wage: number;
  fixedCost: number;
  cumUnits: number;     // cumulative output (experience curve)
}

export interface BizParams {
  baseGrowth: number;   // ~0.10 / yr
  kappaG: number;       // ~2.5 / yr
  sigmaG: number;       // ~0.08
  sigmaR: number;       // ~0.15 per sqrt(year)
  vcRate: number;       // variable cost ratio (0.25..0.65)
  revPerHead: number;   // revenue capacity per employee per day
  learnExp: number;     // experience-curve exponent (~0.15)
  attritionBase: number;// yearly attrition at morale 0.5 (~0.12)
  seasonAmp: [number, number];
  seasonPhase: [number, number];
}

export interface BizEnv {
  sectorBoom: number;
  rate: number;
  inflation: number;
  competition: number;
  rivalAttract: number;
  demandShock: number;
}

export function stepBusiness(b: BizState, p: BizParams, env: BizEnv, rng: Rng, day: number) {
  const dt = 1 / 365;

  // 1) Growth target depends on the world; growth rate follows OU toward it
  const gT = p.baseGrowth + 0.9 * (b.quality - 0.5) + 0.7 * env.sectorBoom
           - 0.5 * env.competition - 0.4 * Math.max(0, env.rate - 0.06) + 0.3 * (b.morale - 0.5);
  const g = ouStep(b.g, gT, p.kappaG, p.sigmaG, dt, rng.normal());

  // 2) Market-share dynamics (logistic): attractiveness gap vs rivals moves share, with inertia and noise
  const edge = b.attract - env.rivalAttract;
  const share = clamp(b.share + 0.02 * b.share * (1 - b.share) * edge + 0.0008 * rng.normal(), 0.001, 0.95);
  const shareAdj = Math.sqrt(share / b.share);

  // 3) Trend revenue: fat-tailed shocks + demand shocks
  const shock = p.sigmaR * Math.sqrt(dt) * rng.studentT(5) + env.demandShock * 0.01;
  const trendRev = b.trendRev * Math.exp((g - 0.5 * p.sigmaR * p.sigmaR) * dt + shock) * shareAdj;

  // 4) Seasonality (two harmonics, company-specific phase)
  const t = 2 * Math.PI * (day / 365);
  const season = 1 + p.seasonAmp[0] * Math.sin(t + p.seasonPhase[0]) + p.seasonAmp[1] * Math.sin(2 * t + p.seasonPhase[1]);
  const revenue = trendRev * season;

  // 5) Capacity, overtime, morale, attrition
  const productivity = (1 + b.cumUnits / 1e4) ** p.learnExp * (0.8 + 0.4 * b.morale);
  const capacity = b.headcount * p.revPerHead * productivity;
  const utilisation = revenue / Math.max(capacity, 1);
  const wage = b.wage * (1 + env.inflation * dt + 0.0002 * rng.normal());
  const labour = b.headcount * wage;
  const overtime = Math.max(0, utilisation - 1) * labour * 0.5;
  const moraleTarget = 0.5 + 0.5 * Math.tanh(2 * (1 - utilisation));
  const morale = clamp(b.morale + 0.02 * (moraleTarget - b.morale) + 0.004 * rng.normal(), 0, 1);
  const hazard = p.attritionBase * Math.exp(-3 * (morale - 0.5));
  const leavers = Math.min(b.headcount, rng.poisson(b.headcount * hazard * dt));

  // 6) Costs and earnings
  const variable = p.vcRate * revenue * (1 + 0.5 * Math.max(0, env.inflation - 0.05));
  const fixed = b.fixedCost * (1 + env.inflation * dt);
  const ebitda = revenue - labour - overtime - variable - fixed;

  return {
    next: {
      ...b,
      g,
      share,
      trendRev,
      morale,
      headcount: b.headcount - leavers,
      wage,
      fixedCost: fixed,
      cumUnits: b.cumUnits + revenue / 1000,
    } as BizState,
    daily: { revenue, labour, overtime, variable, fixed, ebitda, utilisation, leavers },
  };
}

export function analystConsensus(trendEps: number, analystBias: number, analystNoise: number, rng: Rng) {
  const forecasts = Array.from({ length: 8 }, () => trendEps * (1 + analystBias + analystNoise * rng.normal()));
  const mean = forecasts.reduce((a, b) => a + b, 0) / forecasts.length;
  const sd = Math.sqrt(forecasts.reduce((a, b) => a + (b - mean) ** 2, 0) / (forecasts.length - 1));
  return { mean, dispersion: Math.max(sd, 0.02 * Math.abs(mean)) };
}

export const standardisedSurprise = (actual: number, mean: number, disp: number) => (actual - mean) / disp;

export function announcementReaction(sue: number, charm: number, guidanceTone: number) {
  const immediate = 0.06 * Math.tanh(0.8 * sue) * (1 + 0.3 * (charm - 50) / 50) + 0.02 * guidanceTone;
  const drift = Array.from({ length: 10 }, (_, k) => 0.35 * immediate * Math.pow(0.8, k));
  return { immediate, drift };
}
