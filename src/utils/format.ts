export type NumberFormatMode = 'indian' | 'standard';

export function formatMoney(amount: number, mode: NumberFormatMode = 'indian', currencySymbol = '₹'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (mode === 'indian') {
    if (abs >= 10000000) {
      const cr = abs / 10000000;
      return `${isNegative ? '-' : ''}${currencySymbol}${cr.toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      const lk = abs / 100000;
      return `${isNegative ? '-' : ''}${currencySymbol}${lk.toFixed(2)} L`;
    }
    return `${isNegative ? '-' : ''}${currencySymbol}${abs.toLocaleString('en-IN')}`;
  } else {
    if (abs >= 1000000000) {
      return `${isNegative ? '-' : ''}${currencySymbol}${(abs / 1000000000).toFixed(2)}B`;
    }
    if (abs >= 1000000) {
      return `${isNegative ? '-' : ''}${currencySymbol}${(abs / 1000000).toFixed(2)}M`;
    }
    if (abs >= 1000) {
      return `${isNegative ? '-' : ''}${currencySymbol}${(abs / 1000).toFixed(2)}K`;
    }
    return `${isNegative ? '-' : ''}${currencySymbol}${abs.toLocaleString('en-US')}`;
  }
}

export function formatPercent(value: number, includeSign = true): string {
  const pct = value * 100;
  const sign = includeSign && pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
