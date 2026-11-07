// Stable 32-bit string hash (FNV-1a)
export function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class Rng {
  constructor(public s: number) {} // serialisable state

  // Independent stream per (seed, name, day). Adding a new company or person
  // never changes anyone else's random numbers, so bugs stay reproducible.
  static stream(seed: number, name: string, day: number): Rng {
    return new Rng(hash32(`${seed}|${name}|${day}`));
  }

  next(): number { // mulberry32, uniform [0,1)
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  normal(): number { // Box-Muller
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  gamma(k: number): number { // Marsaglia-Tsang, any k > 0
    if (k < 1) return this.gamma(k + 1) * Math.pow(this.next(), 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x: number, v: number;
      do { x = this.normal(); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = this.next();
      if (u < 1 - 0.0331 * x ** 4) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  beta(a: number, b: number): number {
    const x = this.gamma(a), y = this.gamma(b);
    return x / (x + y);
  }

  // Fat-tailed shocks. nu = 3..6 gives realistic market tails.
  studentT(nu: number): number {
    return this.normal() / Math.sqrt((2 * this.gamma(nu / 2)) / nu);
  }

  laplace(b = 1): number { // double-exponential, jump sizes
    const u = this.next() - 0.5;
    return -b * Math.sign(u) * Math.log(Math.max(1e-12, 1 - 2 * Math.abs(u)));
  }

  lognormal(mu: number, sigma: number): number {
    return Math.exp(mu + sigma * this.normal());
  }

  poisson(lambda: number): number { // Knuth, fine for lambda < 30
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= this.next(); } while (p > L);
    return k - 1;
  }

  pareto(xm: number, alpha: number): number {
    return xm / Math.pow(1 - this.next(), 1 / alpha);
  }
}
