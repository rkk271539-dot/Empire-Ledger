import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/engine/dynamics/rng';
import { ouStep, nextRegime, cholesky, stressedCorr, correlatedNormals, clamp } from '../../src/engine/dynamics/stochastic';

describe('Stochastic Primitives (Section 18A.2)', () => {
  it('clamp bounds numbers correctly', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('ouStep mean-reverts towards target', () => {
    const start = 0.5;
    const target = 0.05;
    const kappa = 2.5;
    const dt = 1 / 365;

    // Step with zero shock (z = 0)
    const nextVal = ouStep(start, target, kappa, 0.05, dt, 0);
    expect(nextVal).toBeLessThan(start);
    expect(nextVal).toBeGreaterThan(target);
  });

  it('nextRegime switches regimes deterministically based on stress and rng', () => {
    const rng = new Rng(12345);
    const r0 = nextRegime(1, 0.1, rng);
    expect([0, 1, 2]).toContain(r0);
  });

  it('cholesky decomposes positive-definite correlation matrix', () => {
    const A = [
      [1.0, 0.5],
      [0.5, 1.0],
    ];
    const L = cholesky(A);

    expect(L[0][0]).toBeCloseTo(1.0);
    expect(L[0][1]).toBe(0);
    expect(L[1][0]).toBeCloseTo(0.5);
    expect(L[1][1]).toBeCloseTo(Math.sqrt(1 - 0.25));
  });

  it('stressedCorr increases off-diagonal correlations during stress', () => {
    const base = [
      [1.0, 0.3],
      [0.3, 1.0],
    ];
    const stressed = stressedCorr(base, 0.8);

    expect(stressed[0][1]).toBeGreaterThan(base[0][1]);
    expect(stressed[0][0]).toBe(1.0);
  });

  it('correlatedNormals produces vector of shocks using Cholesky factor', () => {
    const A = [
      [1.0, 0.4],
      [0.4, 1.0],
    ];
    const L = cholesky(A);
    const rng = new Rng(777);
    const z = correlatedNormals(L, rng);

    expect(z.length).toBe(2);
    expect(typeof z[0]).toBe('number');
    expect(typeof z[1]).toBe('number');
  });
});
