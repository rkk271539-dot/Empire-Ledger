export type Money = number;
export type PersonId = string;
export type CompanyId = string;
export type SectorId = string;
export type PersonalityId = string;

export interface GameState {
  schemaVersion: number;
  seed: number;
  day: number;
  slot: 0 | 1 | 2 | 3; // 0: Morning, 1: Noon, 2: Evening, 3: Night
  macro: MacroState;
  player: PlayerState;
  people: Record<PersonId, Person>;
  companies: Record<CompanyId, Company>;
  market: MarketState;
  relationships: Record<string, Relationship>; // key: `${a}:${b}`
  announcements: AnnouncementRecord[];
  news: NewsDay[];
  history: HistorySeries;
  flags: Record<string, boolean>;
}

export interface MacroState {
  marketMood: number; // -1 to +1
  interestRate: number; // e.g. 0.065
  inflation: number; // e.g. 0.05
  globalRiskAppetite: number; // -1 to +1
  retailSIPFlow: Money; // monthly retail inflow
  stress: number; // 0 to 1
  fiiNetDaily: Money;
  diiNetDaily: Money;
}

export interface PlayerState {
  id: PersonId;
  name: string;
  cash: Money;
  debt: Money;
  netWorth: Money;
  charm: number; // 0 - 100
  reputation: number; // 0 - 100
  companyId: CompanyId;
  holdings: Holding[];
}

export interface Person {
  id: PersonId;
  name: string;
  gender: 'M' | 'F';
  age: number;
  role: 'player' | 'wife' | 'rival' | 'investor' | 'founder';
  city: string;
  industryFocus: SectorId[];
  personality: PersonalityId;
  cash: Money;
  netWorth: Money;
  holdings: Holding[];
  ownedCompanyIds: CompanyId[];
  charm: number;
  reputation: number;
  riskTolerance: number;
  patience: number;
  lean: { target: PersonId | null; strength: number };
  bio: string;
  history: { day: number; netWorth: Money }[];
}

export interface Relationship {
  a: PersonId;
  b: PersonId;
  trust: number; // 0 - 100
  respect: number; // 0 - 100
  bond: number; // 0 - 100
  grudge: number; // 0 - 1
  alpha: number; // Beta trust positive evidence
  beta: number; // Beta trust negative evidence
  lastInteractionDay: number;
}

export interface Company {
  id: CompanyId;
  name: string;
  sector: SectorId;
  ownerId?: PersonId;
  listed: boolean;
  sharesOutstanding: number;
  price: Money;
  priceHistory: number[];
  financials: {
    revenueDaily: Money;
    costsDaily: Money;
    profitDaily: Money;
    cash: Money;
    debt: Money;
    employees: number;
  };
  quality: {
    management: number;
    growth: number;
    moat: number;
    risk: number;
  };
  dividendPolicy: number; // 0 - 1
}

export interface Holding {
  companyId: CompanyId;
  shares: number;
  avgCost: Money;
  boughtOnDay: number;
}

export interface MarketState {
  indexLevel: number;
  dailyReturn: number;
  advShares: Record<CompanyId, number>;
}

export interface AnnouncementRecord {
  id: string;
  companyId: CompanyId;
  day: number;
  actualEps: number;
  expectedEps: number;
  surpriseScore: number;
  guidanceTone: 'conservative' | 'balanced' | 'bold';
  reactionReturn: number;
}

export interface NewsArticle {
  id: string;
  day: number;
  section: string;
  headline: string;
  body: string;
  importance: 1 | 2 | 3;
  tone: 'positive' | 'neutral' | 'negative';
  sourceName: string;
}

export interface NewsDay {
  day: number;
  articles: NewsArticle[];
}

export interface HistorySeries {
  days: number[];
  playerNetWorth: number[];
  rivalNetWorth: number[];
  wifeNetWorth: number[];
  marketIndex: number[];
}
