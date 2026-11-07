import { Company, PlayerState } from '../core/types';
import { GameEvent } from '../core/events';
import balanceConfig from '../../data/config/balance.json';

export interface TradeResult {
  player: PlayerState;
  company: Company;
  event: GameEvent;
  executionPrice: number;
  totalAmount: number;
  fee: number;
  priceImpact: number;
}

export function executeBuyOrder(
  player: PlayerState,
  company: Company,
  shares: number,
  day: number
): { success: true; result: TradeResult } | { success: false; error: string } {
  if (shares <= 0 || !Number.isInteger(shares)) {
    return { success: false, error: 'Share quantity must be a positive integer.' };
  }
  if (!company.listed || !company.stockParams) {
    return { success: false, error: 'Cannot trade unlisted company shares.' };
  }

  const p = company.stockParams;
  const currentPrice = company.price;
  const sigma = Math.sqrt(Math.max(company.stockState?.v ?? p.thetaV, 1e-8));
  const adv = Math.max(p.adv, 1);

  // Square-root law price impact (Section 18A.4)
  const impact = p.impactY * sigma * Math.sqrt(shares / adv);
  const permanent = 0.65 * impact;
  const temp = 0.35 * impact;

  // Execution price with half of immediate impact
  const executionPrice = Math.round(currentPrice * Math.exp(0.5 * impact) * 100) / 100;
  const grossAmount = Math.round(shares * executionPrice);
  const feeRate = balanceConfig.tradingFeeRate || 0.001;
  const fee = Math.max(1, Math.round(grossAmount * feeRate));
  const totalCost = grossAmount + fee;

  if (player.cash < totalCost) {
    return {
      success: false,
      error: `Insufficient cash. Need ₹${(totalCost / 100000).toFixed(2)} Lakh, but available is ₹${(player.cash / 100000).toFixed(2)} Lakh.`,
    };
  }

  // Update player cash & holdings
  const nextCash = player.cash - totalCost;
  const holdings = [...player.holdings];
  const existingIndex = holdings.findIndex(h => h.companyId === company.id);

  if (existingIndex >= 0) {
    const existing = holdings[existingIndex];
    const newShares = existing.shares + shares;
    const newAvgCost = Math.round(((existing.shares * existing.avgCost) + (shares * executionPrice)) / newShares * 100) / 100;
    holdings[existingIndex] = {
      ...existing,
      shares: newShares,
      avgCost: newAvgCost,
    };
  } else {
    holdings.push({
      companyId: company.id,
      shares,
      avgCost: executionPrice,
      boughtOnDay: day,
    });
  }

  // Update company stock state and price
  const curLogP = company.stockState?.logP ?? Math.log(currentPrice);
  const curTemp = company.stockState?.tempImpact ?? 0;
  const newLogP = curLogP + permanent;
  const newPrice = Math.max(1, Math.round(Math.exp(newLogP) * 100) / 100);

  const updatedPriceHistory = [...company.priceHistory];
  if (updatedPriceHistory.length > 0) {
    updatedPriceHistory[updatedPriceHistory.length - 1] = newPrice;
  } else {
    updatedPriceHistory.push(newPrice);
  }

  const updatedCompany: Company = {
    ...company,
    price: newPrice,
    priceHistory: updatedPriceHistory,
    stockState: company.stockState
      ? {
          ...company.stockState,
          logP: newLogP,
          tempImpact: curTemp + temp,
        }
      : undefined,
  };

  const updatedPlayer: PlayerState = {
    ...player,
    cash: nextCash,
    holdings,
  };

  const event: GameEvent = {
    id: `ev_buy_${company.id}_${day}_${shares}`,
    day,
    type: 'SHARES_BOUGHT',
    title: `Bought ${shares.toLocaleString()} Shares of ${company.symbol || company.name}`,
    message: `Filled ${shares.toLocaleString()} shares @ ₹${executionPrice.toFixed(2)} (Total: ₹${(totalCost / 100000).toFixed(2)} Lakh, Fee: ₹${fee.toLocaleString()}). Price impact: +${(impact * 100).toFixed(2)}%.`,
    importance: 2,
    data: { companyId: company.id, shares, executionPrice, totalCost, fee },
  };

  return {
    success: true,
    result: {
      player: updatedPlayer,
      company: updatedCompany,
      event,
      executionPrice,
      totalAmount: totalCost,
      fee,
      priceImpact: impact,
    },
  };
}

export function executeSellOrder(
  player: PlayerState,
  company: Company,
  shares: number,
  day: number
): { success: true; result: TradeResult } | { success: false; error: string } {
  if (shares <= 0 || !Number.isInteger(shares)) {
    return { success: false, error: 'Share quantity must be a positive integer.' };
  }
  if (!company.listed || !company.stockParams) {
    return { success: false, error: 'Cannot trade unlisted company shares.' };
  }

  const existing = player.holdings.find(h => h.companyId === company.id);
  if (!existing || existing.shares < shares) {
    return {
      success: false,
      error: `Insufficient shares. You hold ${existing ? existing.shares.toLocaleString() : 0} shares, tried to sell ${shares.toLocaleString()}.`,
    };
  }

  const p = company.stockParams;
  const currentPrice = company.price;
  const sigma = Math.sqrt(Math.max(company.stockState?.v ?? p.thetaV, 1e-8));
  const adv = Math.max(p.adv, 1);

  // Square-root law price impact (downward for sell)
  const impact = p.impactY * sigma * Math.sqrt(shares / adv);
  const permanent = 0.65 * impact;
  const temp = 0.35 * impact;

  // Execution price with half of immediate negative impact
  const executionPrice = Math.max(1, Math.round(currentPrice * Math.exp(-0.5 * impact) * 100) / 100);
  const grossProceeds = Math.round(shares * executionPrice);
  const feeRate = balanceConfig.tradingFeeRate || 0.001;
  const fee = Math.max(1, Math.round(grossProceeds * feeRate));
  const netProceeds = Math.max(0, grossProceeds - fee);

  // Update holdings
  let holdings = [...player.holdings];
  if (existing.shares === shares) {
    holdings = holdings.filter(h => h.companyId !== company.id);
  } else {
    holdings = holdings.map(h => {
      if (h.companyId === company.id) {
        return { ...h, shares: h.shares - shares };
      }
      return h;
    });
  }

  const nextCash = player.cash + netProceeds;

  // Update company stock state and price
  const curLogP = company.stockState?.logP ?? Math.log(currentPrice);
  const curTemp = company.stockState?.tempImpact ?? 0;
  const newLogP = curLogP - permanent;
  const newPrice = Math.max(1, Math.round(Math.exp(newLogP) * 100) / 100);

  const updatedPriceHistory = [...company.priceHistory];
  if (updatedPriceHistory.length > 0) {
    updatedPriceHistory[updatedPriceHistory.length - 1] = newPrice;
  } else {
    updatedPriceHistory.push(newPrice);
  }

  const updatedCompany: Company = {
    ...company,
    price: newPrice,
    priceHistory: updatedPriceHistory,
    stockState: company.stockState
      ? {
          ...company.stockState,
          logP: newLogP,
          tempImpact: curTemp - temp,
        }
      : undefined,
  };

  const updatedPlayer: PlayerState = {
    ...player,
    cash: nextCash,
    holdings,
  };

  const event: GameEvent = {
    id: `ev_sell_${company.id}_${day}_${shares}`,
    day,
    type: 'SHARES_SOLD',
    title: `Sold ${shares.toLocaleString()} Shares of ${company.symbol || company.name}`,
    message: `Executed sell of ${shares.toLocaleString()} shares @ ₹${executionPrice.toFixed(2)} (Net: ₹${(netProceeds / 100000).toFixed(2)} Lakh, Fee: ₹${fee.toLocaleString()}). Price impact: -${(impact * 100).toFixed(2)}%.`,
    importance: 2,
    data: { companyId: company.id, shares, executionPrice, netProceeds, fee },
  };

  return {
    success: true,
    result: {
      player: updatedPlayer,
      company: updatedCompany,
      event,
      executionPrice,
      totalAmount: netProceeds,
      fee,
      priceImpact: -impact,
    },
  };
}
