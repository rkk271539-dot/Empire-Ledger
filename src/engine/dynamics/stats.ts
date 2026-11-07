export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1);
}

export function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function kurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const m = mean(arr);
  const s2 = variance(arr);
  if (s2 === 0) return 0;
  const n = arr.length;
  const m4 = arr.reduce((acc, x) => acc + (x - m) ** 4, 0) / n;
  return m4 / (s2 * s2);
}

export function autocorr(arr: number[], lag: number): number {
  if (arr.length <= lag) return 0;
  const m = mean(arr);
  let num = 0;
  let den = 0;
  for (let i = 0; i < arr.length; i++) {
    den += (arr[i] - m) ** 2;
    if (i >= lag) {
      num += (arr[i] - m) * (arr[i - lag] - m);
    }
  }
  return den === 0 ? 0 : num / den;
}

export function meanAutocorr(arr: number[], maxLag = 10): number {
  let sum = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    sum += autocorr(arr, lag);
  }
  return sum / maxLag;
}
