import { FinancialStatements, DailyFinancialRecord, Money } from '../core/types';

export function createDefaultFinancialStatements(initialCash: Money): FinancialStatements {
  return {
    pl: {
      revenue: 500000,
      cogs: 175000,
      payroll: 66000,
      rd: 40000,
      marketing: 25000,
      overhead: 45000,
      ebitda: 149000,
      netIncome: 120000,
    },
    balanceSheet: {
      cash: initialCash,
      accountsReceivable: 12500000,
      equipmentValuation: 35000000,
      totalAssets: initialCash + 12500000 + 35000000,
      debt: 0,
      retainedEarnings: 15000000,
      totalEquity: initialCash + 12500000 + 35000000,
    },
    history30d: [],
  };
}

export function updateFinancialStatements(
  prev: FinancialStatements,
  record: DailyFinancialRecord
): FinancialStatements {
  const history30d = [...prev.history30d, record];
  if (history30d.length > 30) {
    history30d.shift();
  }

  const pl = {
    revenue: record.revenue,
    cogs: record.cogs,
    payroll: record.payroll,
    rd: record.rd,
    marketing: record.marketing,
    overhead: record.overhead,
    ebitda: record.ebitda,
    netIncome: record.netIncome,
  };

  const totalAssets = record.cashBalance + prev.balanceSheet.accountsReceivable + prev.balanceSheet.equipmentValuation;
  const totalEquity = totalAssets - prev.balanceSheet.debt;

  return {
    pl,
    balanceSheet: {
      ...prev.balanceSheet,
      cash: record.cashBalance,
      totalAssets,
      totalEquity,
      retainedEarnings: prev.balanceSheet.retainedEarnings + record.netIncome,
    },
    history30d,
  };
}

export function computeCompanyValuation(
  annualizedEbitda: Money,
  annualizedRevenue: Money,
  cash: Money,
  debt: Money
): Money {
  // Healthy valuation: 10x-14x normalized annualized EBITDA + net cash,
  // or 2.5x Revenue if EBITDA is low/early stage.
  // Bound to prevent unrealistic explosive jumps.
  let baseValuation: number;
  if (annualizedEbitda > 10000000) { // > ₹1 Cr EBITDA
    baseValuation = annualizedEbitda * 12 + Math.max(0, cash - debt);
  } else if (annualizedEbitda > 0) {
    baseValuation = Math.max(annualizedRevenue * 2.5, annualizedEbitda * 10) + Math.max(0, cash - debt);
  } else {
    baseValuation = Math.max(25000000, annualizedRevenue * 2.0 + Math.max(0, cash - debt));
  }

  return Math.round(baseValuation);
}
