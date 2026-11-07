import { StockParams, StockState } from '../dynamics/stockModel';

export type Money = number;
export type PersonId = string;
export type CompanyId = string;
export type SectorId = string;
export type PersonalityId = string;
export type DepartmentId = 'marketing' | 'hr' | 'operations' | 'rd' | 'finance' | 'management';

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
  avatarUrl?: string;
  city?: string;
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
  avatarUrl?: string;
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

export interface Department {
  id: DepartmentId;
  name: string;
  level: number;
  budgetDaily: Money;
  efficiency: number;
  staffCount: number;
  autoManage?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  department: DepartmentId;
  role: string;
  skill: number; // 1 to 10
  salaryDaily: Money;
  morale: number; // 0 to 1
  hireDay: number;
  productivity: number; // multiplier e.g. 0.8 - 1.5
}

export interface CompanyProject {
  id: string;
  name: string;
  clientName: string;
  size: number; // total work units needed
  workCompleted: number;
  payout: Money;
  deadlineDay: number;
  status: 'available' | 'active' | 'delivered' | 'failed';
  clientDefaultRisk: number; // 0 - 1
}

export interface ProductLine {
  id: string;
  name: string;
  dailyRevenue: Money;
  dailyCost: Money;
  quality: number; // 0 to 1
  attractiveness: number; // 0 to 1
  launchDay: number;
}

export interface CompanyStrategy {
  brandingSpendDaily: Money;
  rdSpendDaily: Money;
  expansionMode: 'conservative' | 'balanced' | 'aggressive';
  costCuttingActive: boolean;
  dividendPayoutRatio: number; // 0 to 1
}

export interface DailyFinancialRecord {
  day: number;
  revenue: Money;
  cogs: Money;
  payroll: Money;
  rd: Money;
  marketing: Money;
  overhead: Money;
  ebitda: Money;
  netIncome: Money;
  cashBalance: Money;
}

export interface FinancialStatements {
  pl: {
    revenue: Money;
    cogs: Money;
    payroll: Money;
    rd: Money;
    marketing: Money;
    overhead: Money;
    ebitda: Money;
    netIncome: Money;
  };
  balanceSheet: {
    cash: Money;
    accountsReceivable: Money;
    equipmentValuation: Money;
    totalAssets: Money;
    debt: Money;
    retainedEarnings: Money;
    totalEquity: Money;
  };
  history30d: DailyFinancialRecord[];
}

export interface Company {
  id: CompanyId;
  name: string;
  symbol?: string;
  description?: string;
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
    employees?: number;
    peRatio?: number;
    dividendYield?: number;
  };
  departments?: Record<DepartmentId, Department>;
  employeesList?: Employee[];
  projects?: CompanyProject[];
  products?: ProductLine[];
  strategy?: CompanyStrategy;
  financialStatements?: FinancialStatements;
  quality: {
    management: number;
    growth: number;
    moat: number;
    risk: number;
  };
  dividendPolicy?: number; // 0 - 1
  stockParams?: StockParams;
  stockState?: StockState;
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
  regime?: 0 | 1 | 2;
  stress?: number;
  sectorReturns?: Record<string, number>;
  indexHistory?: number[];
  lastTradeDay?: number;
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
