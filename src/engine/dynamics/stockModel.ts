import { Rng } from './rng';
import { clamp, nextRegime, Regime } from './stochastic';

export interface StockState {
  logP: number;        // ln(price)
  v: number;           // instantaneous DAILY variance (e.g. 3.2e-4 => 1.8% daily vol)
  regime: Regime;
  sentiment: number;   // AR(1) in about [-1,1]
  tempImpact: number;  // temporary price impact still to revert
}

export interface StockParams {
  sector: string;
  betaMkt: number;
  betaSector: number;  // loadings on common factors
  kappaV: number;      // variance mean-reversion per day (~0.05)
  thetaV: number;      // long-run daily variance (~3e-4)
  xi: number;          // vol-of-vol in daily-variance units (~0.0025)
  rho: number;         // price/vol correlation (leverage) (~-0.6)
  kappaP: number;      // pull toward fundamental value /day (~0.015, half-life ~45 days)
  jumpBase: number;    // base jump intensity per day (~0.01)
  impactY: number;     // impact coefficient (~0.8)
  adv: number;         // average daily volume in shares
}

export interface StockEnv {
  marketShock: number;
  sectorShock: Record<string, number>;
  marketStress: number;
  newsTone: number;        // -1..1 net tone of today's company news
  newsIntensity: number;   // 0..3 how much company news today
  netFlowShares: number;   // signed net order flow today
  fundamentalValue: number;
}

export function stepStock(s: StockState, p: StockParams, env: StockEnv, rng: Rng) {
  // 1) Regime and variance (Heston with full truncation, correlated shocks)
  const regime = nextRegime(s.regime, env.marketStress, rng);
  const volMult = [0.75, 1.0, 2.3][regime];
  const zP = rng.normal();
  const zV = p.rho * zP + Math.sqrt(1 - p.rho * p.rho) * rng.normal();
  const vPos = Math.max(s.v, 1e-8);
  const v = Math.max(1e-8, s.v + p.kappaV * (p.thetaV * volMult - vPos) + p.xi * Math.sqrt(vPos) * zV);
  const sigma = Math.sqrt(vPos);

  // 2) Common factors (creates correlation across stocks) + own diffusion
  const common = p.betaMkt * env.marketShock + p.betaSector * (env.sectorShock[p.sector] ?? 0);
  const idio = sigma * zP;

  // 3) Mean reversion toward fundamentals (slower in stressed regimes, markets overshoot)
  const gap = Math.log(env.fundamentalValue) - s.logP;
  const pull = p.kappaP * (regime === 2 ? 0.4 : 1) * clamp(gap, -0.7, 0.7);

  // 4) Jumps: intensity grows with news; sizes are fat-tailed and tone-biased
  const lambda = p.jumpBase + 0.12 * env.newsIntensity + 0.05 * env.marketStress;
  let jump = 0;
  const n = rng.poisson(lambda);
  for (let i = 0; i < n; i++) jump += rng.laplace(0.02) + 0.015 * env.newsTone;

  // 5) Order-flow impact (square-root law): permanent + temporary part that reverts later
  const q = env.netFlowShares;
  const impact = p.impactY * sigma * Math.sign(q) * Math.sqrt(Math.abs(q) / Math.max(p.adv, 1));
  const permanent = 0.65 * impact;
  const temp = 0.35 * impact;

  // 6) Sentiment momentum (AR(1), driven by news and by its own past)
  const sentiment = clamp(0.9 * s.sentiment + 0.1 * env.newsTone + 0.02 * rng.normal(), -1, 1);

  // 7) Total log return, with circuit breaker (+/-10%)
  let r = pull + common + idio + jump + permanent + temp - 0.5 * s.tempImpact + 0.0015 * sentiment - 0.5 * vPos;
  r = clamp(r, Math.log(0.9), Math.log(1.1));

  return {
    next: { logP: s.logP + r, v, regime, sentiment, tempImpact: 0.5 * s.tempImpact + temp } as StockState,
    logReturn: r,
  };
}

export function fundamentalPerShare(
  eps: number,
  growth: number,
  risk: { rf: number; erp: number; leverage: number; quality: number },
  opts = { terminalG: 0.045, years: 8, fcfConv: 0.7 }
): number {
  const r = Math.max(0.06, risk.rf + risk.erp * (1 + 0.35 * risk.leverage) - 0.015 * risk.quality);
  const gT = Math.min(opts.terminalG, r - 0.02);
  let e = Math.max(eps, 0.02);
  let pv = 0;
  for (let t = 1; t <= opts.years; t++) {
    const g = gT + (growth - gT) * (1 - (t - 1) / opts.years);
    e *= 1 + g;
    pv += (opts.fcfConv * e) / Math.pow(1 + r, t);
  }
  const tv = (opts.fcfConv * e * (1 + gT)) / (r - gT) / Math.pow(1 + r, opts.years);
  return pv + tv;
}
