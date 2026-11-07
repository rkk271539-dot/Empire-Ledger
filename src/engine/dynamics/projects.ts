import { Rng } from './rng';

export interface Project {
  size: number;
  payoutPerUnit: number;
  clientDefaultRisk: number;
  deadline: number;
  progress: number;
}

export function generateProject(rng: Rng, ctx: { marketing: number; heat: number }): Project {
  const size = rng.lognormal(Math.log(40), 0.6); // work units, heavy right tail
  const payoutPerUnit = rng.lognormal(Math.log(1 + 0.5 * ctx.heat), 0.25) * (0.85 + 0.3 * ctx.marketing);
  const clientDefaultRisk = Math.min(0.35, Math.abs(rng.laplace(0.04)));
  const deadline = Math.round(size / (2.5 * (0.7 + 0.6 * rng.next())) + 7);
  return { size, payoutPerUnit, clientDefaultRisk, deadline, progress: 0 };
}
