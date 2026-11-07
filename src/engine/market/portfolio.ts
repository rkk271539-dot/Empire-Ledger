import { Holding, Company, Person } from '../core/types';
import { Rng } from '../dynamics/rng';

export interface HoldingSummary {
  companyId: string;
  symbol: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dailyPnL: number;
  dailyPnLPercent: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  totalPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  holdings: HoldingSummary[];
}

export function calculateHoldingMetrics(holding: Holding, company: Company): HoldingSummary {
  const currentPrice = company.price;
  const investedValue = Math.round(holding.shares * holding.avgCost);
  const currentValue = Math.round(holding.shares * currentPrice);
  const unrealizedPnL = currentValue - investedValue;
  const unrealizedPnLPercent = investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : 0;

  const prevPrice = company.priceHistory.length >= 2
    ? company.priceHistory[company.priceHistory.length - 2]
    : currentPrice;
  const dayPriceChange = currentPrice - prevPrice;
  const dailyPnL = Math.round(holding.shares * dayPriceChange);
  const dailyPnLPercent = prevPrice > 0 ? (dayPriceChange / prevPrice) * 100 : 0;

  return {
    companyId: holding.companyId,
    symbol: company.symbol || company.id,
    name: company.name,
    sector: company.sector,
    shares: holding.shares,
    avgCost: holding.avgCost,
    currentPrice,
    investedValue,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    dailyPnL,
    dailyPnLPercent,
  };
}

export function calculatePortfolioSummary(
  holdings: Holding[],
  companies: Record<string, Company>
): PortfolioSummary {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let todayPnL = 0;
  const summaries: HoldingSummary[] = [];

  for (const h of holdings) {
    const company = companies[h.companyId];
    if (!company) continue;
    const metric = calculateHoldingMetrics(h, company);
    summaries.push(metric);
    totalInvested += metric.investedValue;
    totalCurrentValue += metric.currentValue;
    todayPnL += metric.dailyPnL;
  }

  const totalUnrealizedPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
  const prevPortfolioValue = totalCurrentValue - todayPnL;
  const todayPnLPercent = prevPortfolioValue > 0 ? (todayPnL / prevPortfolioValue) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalUnrealizedPnL,
    totalPnLPercent,
    todayPnL,
    todayPnLPercent,
    holdings: summaries,
  };
}

export function stepWifeHoldings(
  wife: Person,
  companies: Record<string, Company>,
  day: number,
  rng: Rng
): Person {
  // If wife has no holdings yet, initialize with blue chip pharma / FMCG
  const holdings = [...(wife.holdings ?? [])];
  let cash = wife.cash;

  if (holdings.length === 0 && cash >= 10000000) {
    const pharmaComp = Object.values(companies).find(c => c.listed && c.sector === 'pharma');
    const fmcgComp = Object.values(companies).find(c => c.listed && c.sector === 'fmcg');
    
    if (pharmaComp) {
      const alloc = Math.round(cash * 0.25);
      const shares = Math.floor(alloc / pharmaComp.price);
      if (shares > 0) {
        holdings.push({
          companyId: pharmaComp.id,
          shares,
          avgCost: pharmaComp.price,
          boughtOnDay: day,
        });
        cash -= shares * pharmaComp.price;
      }
    }

    if (fmcgComp) {
      const alloc = Math.round(cash * 0.25);
      const shares = Math.floor(alloc / fmcgComp.price);
      if (shares > 0) {
        holdings.push({
          companyId: fmcgComp.id,
          shares,
          avgCost: fmcgComp.price,
          boughtOnDay: day,
        });
        cash -= shares * fmcgComp.price;
      }
    }
  } else if (cash > 25000000 && rng.next() < 0.05) {
    // Occasional selective dividend reinvestment by wife into highest quality company
    const blueChips = Object.values(companies).filter(c => c.listed && c.quality.moat > 0.8);
    if (blueChips.length > 0) {
      const pick = blueChips[Math.floor(rng.next() * blueChips.length)];
      const investAmount = 2000000;
      const buyShares = Math.floor(investAmount / pick.price);
      if (buyShares > 0) {
        const exist = holdings.find(h => h.companyId === pick.id);
        if (exist) {
          exist.shares += buyShares;
        } else {
          holdings.push({
            companyId: pick.id,
            shares: buyShares,
            avgCost: pick.price,
            boughtOnDay: day,
          });
        }
        cash -= buyShares * pick.price;
      }
    }
  }

  // Calculate wife total net worth
  const portfolioSummary = calculatePortfolioSummary(holdings, companies);
  const netWorth = cash + portfolioSummary.totalCurrentValue;

  return {
    ...wife,
    cash,
    holdings,
    netWorth,
    history: [...wife.history, { day, netWorth }].slice(-100),
  };
}
