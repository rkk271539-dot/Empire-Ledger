import { Company } from '../core/types';
import { Rng } from '../dynamics/rng';
import { stepStock, StockState, StockParams } from '../dynamics/stockModel';
import companiesData from '../../data/config/companies.json';

interface RawCompanyData {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  description: string;
  sharesOutstanding: number;
  price: number;
  financials: {
    revenueDaily: number;
    costsDaily: number;
    profitDaily: number;
    cash: number;
    debt: number;
    peRatio: number;
    dividendYield: number;
  };
  quality: {
    management: number;
    growth: number;
    moat: number;
    risk: number;
  };
  stockParams: StockParams;
}

export function loadListedCompanies(seed: number): Record<string, Company> {
  const result: Record<string, Company> = {};

  for (const raw of companiesData as RawCompanyData[]) {
    const initialPrice = raw.price;
    const initialStockState: StockState = {
      logP: Math.log(initialPrice),
      v: raw.stockParams.thetaV,
      regime: 0,
      sentiment: 0,
      tempImpact: 0,
    };

    // Pre-seed 30 days of price history
    const priceHistory: number[] = [initialPrice];
    let curState = { ...initialStockState };

    const compRng = Rng.stream(seed, `init_history_${raw.id}`, 0);
    for (let d = 1; d <= 30; d++) {
      const step = stepStock(
        curState,
        raw.stockParams,
        {
          marketShock: compRng.normal() * 0.008,
          sectorShock: { [raw.sector]: compRng.normal() * 0.006 },
          marketStress: 0.1,
          newsTone: compRng.studentT(5) * 0.1,
          newsIntensity: 0.2,
          netFlowShares: (compRng.next() - 0.5) * (raw.stockParams.adv * 0.05),
          fundamentalValue: initialPrice,
        },
        compRng
      );
      curState = step.next;
      const dayPrice = Math.max(1, Math.round(Math.exp(curState.logP) * 100) / 100);
      priceHistory.push(dayPrice);
    }

    const currentPrice = priceHistory[priceHistory.length - 1];
    curState.logP = Math.log(currentPrice);

    result[raw.id] = {
      id: raw.id,
      name: raw.name,
      symbol: raw.symbol,
      description: raw.description,
      sector: raw.sector,
      listed: true,
      sharesOutstanding: raw.sharesOutstanding,
      price: currentPrice,
      priceHistory,
      financials: {
        revenueDaily: raw.financials.revenueDaily,
        costsDaily: raw.financials.costsDaily,
        profitDaily: raw.financials.profitDaily,
        cash: raw.financials.cash,
        debt: raw.financials.debt,
        peRatio: raw.financials.peRatio,
        dividendYield: raw.financials.dividendYield,
      },
      quality: raw.quality,
      dividendPolicy: raw.financials.dividendYield,
      stockParams: raw.stockParams,
      stockState: curState,
    };
  }

  return result;
}

export function computeInitialIndexLevel(companies: Record<string, Company>): number {
  const listed = Object.values(companies).filter(c => c.listed);
  if (listed.length === 0) return 24500;
  // Calculate average or market-cap index normalized to ~24,500
  return 24500;
}
