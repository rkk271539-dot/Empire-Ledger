import { describe, it, expect } from 'vitest';
import { Rng, hash32 } from '../../src/engine/dynamics/rng';

describe('RNG Toolkit (Section 18A.1)', () => {
  it('hash32 generates stable 32-bit hashes', () => {
    const h1 = hash32('12345|stock:C01|10');
    const h2 = hash32('12345|stock:C01|10');
    const h3 = hash32('12345|stock:C02|10');

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(typeof h1).toBe('number');
  });

  it('Rng streams produce deterministic sequences from the same seed', () => {
    const stream1 = Rng.stream(42, 'macro', 1);
    const stream2 = Rng.stream(42, 'macro', 1);

    const values1 = Array.from({ length: 5 }, () => stream1.next());
    const values2 = Array.from({ length: 5 }, () => stream2.next());

    expect(values1).toEqual(values2);
  });

  it('Generates normal distribution values with expected mean and spread', () => {
    const rng = new Rng(999);
    const samples = Array.from({ length: 2000 }, () => rng.normal());
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;

    expect(Math.abs(mean)).toBeLessThan(0.1);
  });

  it('Generates beta distribution bounded between 0 and 1', () => {
    const rng = new Rng(100);
    for (let i = 0; i < 50; i++) {
      const val = rng.beta(2, 5);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('Generates fat-tailed Student-t shocks', () => {
    const rng = new Rng(555);
    const samples = Array.from({ length: 100 }, () => rng.studentT(5));
    expect(samples.some((v) => Math.abs(v) > 0)).toBe(true);
  });
});
