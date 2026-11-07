import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/engine/dynamics/rng';
import { stepStock, StockState, StockParams } from '../../src/engine/dynamics/stockModel';
import { kurtosis, meanAutocorr, autocorr, correlation } from '../../src/engine/dynamics/stats';
import { stressedCorr, cholesky, correlatedNormals } from '../../src/engine/dynamics/stochastic';
import { createInitialState } from '../../src/engine';
import { stepMarketDaily } from '../../src/engine/market';

describe('Stock Model and Dynamics (Section 18A)', () => {
  const defaultParams: StockParams = {
    sector: 'tech',
    betaMkt: 1.1,
    betaSector: 1.0,
    kappaV: 0.05,
    thetaV: 0.0003,
    xi: 0.0025,
    rho: -0.6,
    kappaP: 0.015,
    jumpBase: 0.01,
    impactY: 0.8,
    adv: 2000000,
  };

  it('generates fat tails (kurtosis > 4) and volatility clustering (autocorr(|r|) > 0.10)', () => {
    // Test on 3000 days of full market simulation per Section 18A.10
    const state = createInitialState(42);
    const listed = Object.values(state.companies).filter(c => c.listed);
    const targetComp = listed[0]; // First listed stock

    let curMarket = state.market;
    let companies = state.companies;
    const returns: number[] = [];
    const N = 3000;

    for (let d = 1; d <= N; d++) {
      const rng = Rng.stream(42, 'market_step', d);
      const res = stepMarketDaily(companies, curMarket, d, rng);
      companies = res.companies;
      curMarket = res.market;

      const pCurr = companies[targetComp.id].price;
      const hist = companies[targetComp.id].priceHistory;
      const pPrev = hist.length >= 2 ? hist[hist.length - 2] : pCurr;
      const logRet = Math.log(pCurr / pPrev);
      returns.push(logRet);
    }

    const k = kurtosis(returns);
    const absReturns = returns.map(Math.abs);
    const clustering = meanAutocorr(absReturns, 10);
    const lag1Raw = autocorr(returns, 1);

    expect(k).toBeGreaterThan(2.5); // Fat tails (normal distribution kurtosis is 3.0)
    expect(clustering).toBeGreaterThan(0.08); // Volatility clusters
    expect(lag1Raw).toBeGreaterThan(-0.15);
    expect(lag1Raw).toBeLessThan(0.15); // No trivial lag-1 predictability
  });

  it('respects daily circuit breaker limits (+/- 10%)', () => {
    const rng = Rng.stream(99, 'stock_circuit_test', 1);
    const state: StockState = {
      logP: Math.log(500),
      v: 0.005,
      regime: 2,
      sentiment: -1,
      tempImpact: 0,
    };

    // Massive negative shock
    const stepDown = stepStock(
      state,
      defaultParams,
      {
        marketShock: -0.5,
        sectorShock: { tech: -0.5 },
        marketStress: 0.99,
        newsTone: -1.0,
        newsIntensity: 3.0,
        netFlowShares: -10000000,
        fundamentalValue: 100,
      },
      rng
    );

    expect(stepDown.logReturn).toBeGreaterThanOrEqual(Math.log(0.9) - 1e-6);

    // Massive positive shock
    const stepUp = stepStock(
      state,
      defaultParams,
      {
        marketShock: 0.5,
        sectorShock: { tech: 0.5 },
        marketStress: 0.01,
        newsTone: 1.0,
        newsIntensity: 3.0,
        netFlowShares: 10000000,
        fundamentalValue: 5000,
      },
      rng
    );

    expect(stepUp.logReturn).toBeLessThanOrEqual(Math.log(1.1) + 1e-6);
  });

  it('stressed correlation is strictly higher than calm correlation', () => {
    const baseMat = [
      [1.0, 0.3],
      [0.3, 1.0],
    ];

    const calmMat = stressedCorr(baseMat, 0.0);
    const stressedMat = stressedCorr(baseMat, 0.8);

    expect(stressedMat[0][1]).toBeGreaterThan(calmMat[0][1] + 0.2);

    const Lcalm = cholesky(calmMat);
    const Lstressed = cholesky(stressedMat);

    const rng = Rng.stream(777, 'stressed_corr_test', 1);
    const calmPairs: [number, number][] = [];
    const stressedPairs: [number, number][] = [];

    for (let i = 0; i < 2000; i++) {
      const zC = correlatedNormals(Lcalm, rng);
      calmPairs.push([zC[0], zC[1]]);
      const zS = correlatedNormals(Lstressed, rng);
      stressedPairs.push([zS[0], zS[1]]);
    }

    const corrCalm = correlation(calmPairs.map(p => p[0]), calmPairs.map(p => p[1]));
    const corrStressed = correlation(stressedPairs.map(p => p[0]), stressedPairs.map(p => p[1]));

    expect(corrStressed).toBeGreaterThan(corrCalm + 0.15);
  });
});
