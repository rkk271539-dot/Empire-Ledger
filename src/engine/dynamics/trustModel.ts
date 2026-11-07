import { clamp } from './stochastic';

export interface Rel {
  alpha: number; beta: number;   // trust posterior (start at 1,1 or a prior from personality)
  respect: number;               // 0..100 (competence perception)
  bond: number;                  // 0..100 (emotional/personal link)
  grudge: number;                // 0..1 slow-decaying negative memory
  lastContactDay: number;
}

export interface Persona {
  negBias: number;
  forgiveness: number;
  gullibility: number;
  loyalty: number;
}

export interface RelEvent {
  kind: string;
  valence: number;
  salience: number;
  publicity: number;
  day: number;
}

export const trustMean = (r: Rel) => r.alpha / (r.alpha + r.beta);

export const trustUncertainty = (r: Rel) => {
  const n = r.alpha + r.beta;
  return (r.alpha * r.beta) / (n * n * (n + 1));
};

export function applyEvent(r: Rel, e: RelEvent, pers: Persona): Rel {
  const expected = 2 * trustMean(r) - 1;                       // expected valence in [-1,1]
  const surprise = Math.abs(e.valence - expected) / 2;         // 0..1
  const confidence = r.alpha + r.beta;
  const betrayal = e.valence < -0.4 && expected > 0.3 ? 1 + 2 * surprise : 1;   // trusted person lets you down => huge hit
  const weight = e.salience * (1 + 1.5 * surprise) * (1 + 0.5 * e.publicity)
               * (e.valence < 0 ? pers.negBias : 1) / Math.sqrt(1 + confidence / 20);  // established trust moves slowly

  let { alpha, beta } = r;
  if (e.valence >= 0) alpha += weight * e.valence * (0.6 + 0.4 * pers.gullibility);
  else beta += weight * -e.valence * betrayal;

  const grudge = e.valence < 0 ? Math.min(1, r.grudge + 0.25 * weight * -e.valence) : r.grudge;
  const respect = clamp(r.respect + (e.kind === 'performance' ? 8 : 2) * e.valence * e.salience, 0, 100);
  const bond = e.valence > 0
    ? clamp(r.bond + 6 * e.valence * e.salience * (1 - r.bond / 100), 0, 100)
    : clamp(r.bond * (1 - 0.35 * -e.valence * e.salience * betrayal), 0, 100);
  return { alpha, beta, respect, bond, grudge, lastContactDay: e.day };
}

// Daily drift: forgetting is ASYMMETRIC. Good memories fade faster than bad ones; grudges slow forgiveness.
export function relDaily(r: Rel, pers: Persona, day: number): Rel {
  const idle = day - r.lastContactDay;
  const fadeA = Math.exp(-(0.004 + 0.002 * Math.min(idle, 60) / 60));
  const fadeB = Math.exp(-(0.0015 * (0.5 + pers.forgiveness)) / (1 + 2 * r.grudge));
  return {
    ...r,
    alpha: 1 + (r.alpha - 1) * fadeA,
    beta: 1 + (r.beta - 1) * fadeB,
    bond: r.bond * Math.exp(idle > 14 ? -0.004 : -0.0005),
    grudge: r.grudge * Math.exp(-0.003 * pers.forgiveness),
    respect: 50 + (r.respect - 50) * 0.999,
  };
}

// Gossip / reputation contagion (DeGroot with stubbornness)
export function gossipEvent(avgNeighbourTrust: number, stubborn: number, day: number): RelEvent {
  return { kind: 'gossip', valence: 2 * avgNeighbourTrust - 1, salience: 0.1 * (1 - stubborn), publicity: 0, day };
}
