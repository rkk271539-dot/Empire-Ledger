import { Company, MarketState } from '../core/types';
import { GameEvent } from '../core/events';
import { Rng } from '../dynamics/rng';
import { nextRegime, stressedCorr, cholesky, correlatedNormals, Regime, ouStep, clamp } from '../dynamics/stochastic';
import { stepStock, StockState, StockParams } from '../dynamics/stockModel';
import balanceConfig from '../../data/config/balance.json';

const SECTORS = ['tech', 'pharma', 'banking', 'energy', 'realestate', 'fmcg', 'manufacturing', 'media'];

// 9x9 base correlation matrix (0: market factor, 1..8: sectors)
function buildBaseCorrelationMatrix(): number[][] {
  const n = 1 + SECTORS.length;
  const mat: number[][] = Array.from({ length: n }, () => Array(n).fill(0.25));
  for (let i = 0; i < n; i++) {
    mat[i][i] = 1.0;
    // Market factor (index 0) has higher correlation (~0.55) with every sector
    if (i > 0) {
      mat[0][i] = 0.55;
      mat[i][0] = 0.55;
    }
  }
  return mat;
}

const BASE_CORR = buildBaseCorrelationMatrix();

export interface StepMarketResult {
  companies: Record<string, Company>;
  market: MarketState;
  events: GameEvent[];
}

export function stepMarketDaily(
  companies: Record<string, Company>,
  prevMarket: MarketState,
  day: number,
  rng: Rng
): StepMarketResult {
  const events: GameEvent[] = [];
  const prevRegime = (prevMarket.regime ?? 1) as Regime;
  let stress = prevMarket.stress ?? 0.15;

  // 1) Stress dynamics: mean-reverting OU process with occasional spikes
  const stressShock = rng.normal();
  stress = clamp(ouStep(stress, 0.15, 0.04, 0.03, 1, stressShock), 0.02, 0.95);

  // 2) Regime transition
  const regime = nextRegime(prevRegime, stress, rng);

  // 3) Stressed correlation & Cholesky decomposition
  const currentCorr = stressedCorr(BASE_CORR, stress);
  const L = cholesky(currentCorr);
  const z = correlatedNormals(L, rng);

  const volMult = [0.75, 1.0, 2.2][regime];
  const sigmaMkt = balanceConfig.defaultStockDailyVol * 0.65 * volMult;
  const marketShock = sigmaMkt * z[0];

  const sectorShock: Record<string, number> = {};
  SECTORS.forEach((sec, idx) => {
    const sigmaSector = balanceConfig.defaultStockDailyVol * 0.85 * volMult;
    sectorShock[sec] = sigmaSector * z[idx + 1];
  });

  // 4) Step each listed company
  const updatedCompanies = { ...companies };
  let weightedReturnSum = 0;
  let totalMarketCap = 0;

  for (const [compId, comp] of Object.entries(companies)) {
    if (!comp.listed || !comp.stockParams) {
      continue;
    }

    const params: StockParams = comp.stockParams;
    const curStockState: StockState = comp.stockState ?? {
      logP: Math.log(comp.price),
      v: params.thetaV,
      regime,
      sentiment: 0,
      tempImpact: 0,
    };

    // Calculate company EPS and fundamental value
    const annualProfit = comp.financials.profitDaily * 365;
    const eps = Math.max(0.1, annualProfit / comp.sharesOutstanding);
    const targetPE = comp.financials.peRatio || 25;
    const fundamentalVal = Math.max(1, eps * targetPE);

    // Random company news tone and intensity
    const hasNews = rng.next() < 0.20;
    const newsTone = hasNews ? rng.studentT(4) * 0.3 : 0;
    const newsIntensity = hasNews ? 1.0 + rng.next() : 0.2;

    // Background institutional/retail trading volume
    const backgroundFlow = rng.studentT(3) * (params.adv * 0.08);

    const compRng = Rng.stream(rng.next() * 1000000, `stock_${compId}`, day);
    const step = stepStock(
      curStockState,
      params,
      {
        marketShock,
        sectorShock,
        marketStress: stress,
        newsTone,
        newsIntensity,
        netFlowShares: backgroundFlow,
        fundamentalValue: fundamentalVal,
      },
      compRng
    );

    const prevPrice = comp.price;
    // Clamp price to avoid negative or runaway pricing
    const rawPrice = Math.exp(step.next.logP);
    const newPrice = Math.max(1, Math.round(rawPrice * 100) / 100);
    const stockReturn = (newPrice - prevPrice) / prevPrice;

    // Check circuit breaker alert (+/- 10%)
    if (Math.abs(stockReturn) >= 0.098) {
      events.push({
        id: `ev_circuit_${compId}_${day}`,
        day,
        type: stockReturn > 0 ? 'CIRCUIT_UP' : 'CIRCUIT_DOWN',
        title: `${comp.symbol || comp.name} Hit Circuit Limit`,
        message: `${comp.symbol || comp.name} locked at ${stockReturn > 0 ? '+10% upper circuit' : '-10% lower circuit'} (₹${newPrice.toFixed(2)}).`,
        importance: 2,
      });
    }

    const priceHist = [...comp.priceHistory, newPrice].slice(-60);
    const mCap = newPrice * comp.sharesOutstanding;
    totalMarketCap += mCap;
    weightedReturnSum += stockReturn * mCap;

    const updatedPE = Math.max(1, Math.round((newPrice / eps) * 10) / 10);

    updatedCompanies[compId] = {
      ...comp,
      price: newPrice,
      priceHistory: priceHist,
      financials: {
        ...comp.financials,
        peRatio: updatedPE,
      },
      stockState: step.next,
    };
  }

  // 5) Market Index Calculation
  const marketIndexReturn = totalMarketCap > 0 ? weightedReturnSum / totalMarketCap : marketShock;
  const prevIndex = prevMarket.indexLevel || 24500;
  const nextIndex = Math.round(prevIndex * (1 + marketIndexReturn));

  const indexHistory = [...(prevMarket.indexHistory ?? [24500]), nextIndex].slice(-100);

  // Sector return summary
  const sectorReturns: Record<string, number> = {};
  for (const sec of SECTORS) {
    const secComps = Object.values(updatedCompanies).filter(c => c.listed && c.sector === sec);
    if (secComps.length > 0) {
      const avgRet = secComps.reduce((acc, c) => {
        const hist = c.priceHistory;
        const p0 = hist.length >= 2 ? hist[hist.length - 2] : c.price;
        return acc + (c.price - p0) / p0;
      }, 0) / secComps.length;
      sectorReturns[sec] = Math.round(avgRet * 10000) / 10000;
    }
  }

  const nextMarketState: MarketState = {
    ...prevMarket,
    indexLevel: nextIndex,
    dailyReturn: marketIndexReturn,
    regime,
    stress,
    sectorReturns,
    indexHistory,
  };

  return {
    companies: updatedCompanies,
    market: nextMarketState,
    events,
  };
}
