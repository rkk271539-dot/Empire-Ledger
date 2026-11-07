import { GameState, MacroState, PlayerState, Person, MarketState } from './core/types';
import { Command } from './core/commands';
import { GameEvent } from './core/events';
import { Rng } from './dynamics/rng';
import { CURRENT_SCHEMA_VERSION } from './save/serialize';
import balanceConfig from '../data/config/balance.json';
import { createInitialCompany, stepCompanyDaily, createNewHire } from './company';

export * from './core/types';
export * from './core/commands';
export * from './core/events';
export * from './core/clock';
export * from './dynamics/rng';
export * from './dynamics/stochastic';
export * from './dynamics/stockModel';
export * from './dynamics/earningsModel';
export * from './dynamics/projects';
export * from './dynamics/trustModel';
export * from './dynamics/lean';
export * from './dynamics/stats';
export * from './company';
export * from './save/serialize';
export * from './save/storage';

export function createInitialState(seed = 12345): GameState {
  const macro: MacroState = {
    marketMood: 0.1,
    interestRate: balanceConfig.baseRiskFreeRate,
    inflation: 0.05,
    globalRiskAppetite: 0.0,
    retailSIPFlow: 150000000,
    stress: 0.15,
    fiiNetDaily: 50000000,
    diiNetDaily: 45000000,
  };

  const playerCompany = createInitialCompany(
    'company_player',
    'Mehta Enterprises',
    'tech',
    'player',
    balanceConfig.startingPlayerCash
  );

  const player: PlayerState = {
    id: 'player',
    name: 'Aarav Mehta',
    city: 'Mumbai',
    cash: balanceConfig.startingPlayerCash,
    debt: 0,
    netWorth: balanceConfig.startingPlayerNetWorth,
    charm: 65,
    reputation: 60,
    companyId: 'company_player',
    holdings: [],
  };

  const rival: Person = {
    id: 'rival',
    name: 'Vikram Singhania',
    gender: 'M',
    age: 38,
    role: 'rival',
    city: 'Mumbai',
    industryFocus: ['tech', 'manufacturing'],
    personality: 'activist',
    cash: balanceConfig.startingRivalCash,
    netWorth: 120000000,
    holdings: [],
    ownedCompanyIds: ['company_rival'],
    charm: 75,
    reputation: 70,
    riskTolerance: 0.8,
    patience: 0.6,
    lean: { target: null, strength: 0 },
    bio: 'Ruthless second-generation industrialist expanding into digital enterprise and tech infrastructure.',
    history: [{ day: 1, netWorth: 120000000 }],
  };

  const wife: Person = {
    id: 'wife',
    name: 'Ananya Mehta',
    gender: 'F',
    age: 32,
    role: 'wife',
    city: 'Mumbai',
    industryFocus: ['pharma', 'fmcg'],
    personality: 'value_investor',
    cash: balanceConfig.startingWifeCash,
    netWorth: 60000000,
    holdings: [],
    ownedCompanyIds: [],
    charm: 80,
    reputation: 78,
    riskTolerance: 0.4,
    patience: 0.85,
    lean: { target: 'player', strength: 0.75 },
    bio: 'Shrewd value investor and board director with strong networks across healthcare and consumer brands.',
    history: [{ day: 1, netWorth: 60000000 }],
  };

  const market: MarketState = {
    indexLevel: 24500,
    dailyReturn: 0.001,
    advShares: {},
  };

  const people: Record<string, Person> = {
    rival,
    wife,
  };

  // Default relationship between player and wife
  const relPlayerWife = {
    a: 'player',
    b: 'wife',
    trust: 85,
    respect: 80,
    bond: 82,
    grudge: 0,
    alpha: 8.5,
    beta: 1.5,
    lastInteractionDay: 1,
  };

  // Relationship between player and rival
  const relPlayerRival = {
    a: 'player',
    b: 'rival',
    trust: 30,
    respect: 65,
    bond: 15,
    grudge: 0.1,
    alpha: 3,
    beta: 7,
    lastInteractionDay: 1,
  };

  // Relationship between wife and rival
  const relWifeRival = {
    a: 'wife',
    b: 'rival',
    trust: 40,
    respect: 60,
    bond: 20,
    grudge: 0,
    alpha: 4,
    beta: 6,
    lastInteractionDay: 1,
  };

  const relationships: Record<string, typeof relPlayerWife> = {
    'player:wife': relPlayerWife,
    'player:rival': relPlayerRival,
    'wife:rival': relWifeRival,
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    seed,
    day: 1,
    slot: 0,
    macro,
    player,
    people,
    companies: {
      company_player: playerCompany,
    },
    market,
    relationships,
    announcements: [],
    news: [
      {
        day: 1,
        articles: [
          {
            id: 'art_1_1',
            day: 1,
            section: 'Market Wrap',
            headline: 'BSE Index opens steady as FII sentiment firms up',
            body: 'Markets commenced the session on solid footing supported by selective domestic and foreign inflows.',
            importance: 2,
            tone: 'positive',
            sourceName: 'The Dalal Street Chronicle',
          },
          {
            id: 'art_1_2',
            day: 1,
            section: 'People and Power',
            headline: 'Vikram Singhania announces major capital allocation plan',
            body: 'Rival founder signals an aggressive posture ahead of the next corporate reporting cycle.',
            importance: 2,
            tone: 'neutral',
            sourceName: 'Apex Financial Daily',
          },
        ],
      },
    ],
    history: {
      days: [1],
      playerNetWorth: [player.netWorth],
      rivalNetWorth: [rival.netWorth],
      wifeNetWorth: [wife.netWorth],
      marketIndex: [market.indexLevel],
    },
    flags: {
      tutorialCompleted: false,
      gameStarted: true,
      gameSetupCompleted: false,
    },
  };
}

export function tick(state: GameState, seed: number): { state: GameState; events: GameEvent[] } {
  const nextDay = state.day + 1;
  const rng = Rng.stream(seed, 'day_tick', nextDay);
  const events: GameEvent[] = [];

  // Macro update
  const moodNoise = rng.normal() * 0.02;
  const nextMood = Math.max(-1, Math.min(1, state.macro.marketMood * 0.95 + moodNoise));
  const marketReturn = nextMood * 0.005 + rng.studentT(5) * 0.008;
  const nextIndexLevel = Math.round(state.market.indexLevel * (1 + marketReturn));

  // Step player company
  const companies = { ...state.companies };
  let playerCash = state.player.cash;
  let playerCharm = state.player.charm;
  let playerReputation = state.player.reputation;
  let companyValuation = 0;

  if (companies['company_player']) {
    const rngCompany = Rng.stream(seed, 'company_player', nextDay);
    const compStep = stepCompanyDaily(companies['company_player'], nextDay, rngCompany);
    companies['company_player'] = compStep.company;
    events.push(...compStep.events);

    // Apply company cash & dividend policy if any
    const divRatio = compStep.company.strategy?.dividendPayoutRatio || 0;
    if (compStep.cashDelta > 0 && divRatio > 0) {
      const dividendPayout = Math.round(compStep.cashDelta * divRatio);
      playerCash += dividendPayout;
      events.push({
        id: `ev_div_${nextDay}`,
        day: nextDay,
        type: 'DIVIDEND_RECEIVED',
        title: 'Dividend Payout Received',
        message: `Received ₹${(dividendPayout / 100000).toFixed(2)} Lakh dividend from ${compStep.company.name}.`,
        importance: 1,
      });
    }

    playerCharm = Math.min(100, Math.max(0, playerCharm + compStep.charmDelta));
    playerReputation = Math.min(100, Math.max(0, playerReputation + compStep.reputationDelta));
    companyValuation = compStep.company.price * compStep.company.sharesOutstanding;
  }

  // Step Rival & Wife net worth with slight growth & volatility
  const rngRival = Rng.stream(seed, 'rival_growth', nextDay);
  const rivalGrowth = 0.0003 + nextMood * 0.0008 + rngRival.studentT(5) * 0.003;
  const curRival = state.people['rival'];
  const nextRivalNetWorth = curRival
    ? Math.round(curRival.netWorth * (1 + rivalGrowth))
    : 120000000;

  const rngWife = Rng.stream(seed, 'wife_growth', nextDay);
  const wifeGrowth = 0.0002 + nextMood * 0.0005 + rngWife.studentT(5) * 0.002;
  const curWife = state.people['wife'];
  const nextWifeNetWorth = curWife
    ? Math.round(curWife.netWorth * (1 + wifeGrowth))
    : 60000000;

  const updatedPeople: Record<string, Person> = {
    ...state.people,
  };
  if (curRival) {
    updatedPeople['rival'] = {
      ...curRival,
      netWorth: nextRivalNetWorth,
      history: [...curRival.history, { day: nextDay, netWorth: nextRivalNetWorth }].slice(-100),
    };
  }
  if (curWife) {
    updatedPeople['wife'] = {
      ...curWife,
      netWorth: nextWifeNetWorth,
      history: [...curWife.history, { day: nextDay, netWorth: nextWifeNetWorth }].slice(-100),
    };
  }

  // Player Total Net Worth = Liquid Cash + Equity in Owned Companies - Debt
  const playerNetWorth = playerCash + companyValuation - state.player.debt;

  // Update history
  const history = {
    days: [...state.history.days, nextDay],
    playerNetWorth: [...state.history.playerNetWorth, playerNetWorth],
    rivalNetWorth: [...state.history.rivalNetWorth, nextRivalNetWorth],
    wifeNetWorth: [...state.history.wifeNetWorth, nextWifeNetWorth],
    marketIndex: [...state.history.marketIndex, nextIndexLevel],
  };

  // Limit history length to 400 points
  if (history.days.length > 400) {
    history.days.shift();
    history.playerNetWorth.shift();
    history.rivalNetWorth.shift();
    history.wifeNetWorth.shift();
    history.marketIndex.shift();
  }

  // Generate day advancement event
  events.push({
    id: `ev_day_${nextDay}`,
    day: nextDay,
    type: 'DAY_ADVANCED',
    title: `Day ${nextDay} Began`,
    message: `Market opened at ${nextIndexLevel} (${(marketReturn * 100).toFixed(2)}%)`,
    importance: 1,
  });

  // Cycle check: announcement day every 60 days
  if (nextDay % balanceConfig.announcementCycleDays === 0) {
    events.push({
      id: `ev_announcement_${nextDay}`,
      day: nextDay,
      type: 'ANNOUNCEMENT_DAY',
      title: '60-Day Corporate Announcement Cycle',
      message: 'Quarterly reporting window opened. Investors are reviewing guidance and earnings performance.',
      importance: 3,
    });
  }

  const nextState: GameState = {
    ...state,
    day: nextDay,
    slot: 0,
    macro: {
      ...state.macro,
      marketMood: nextMood,
    },
    player: {
      ...state.player,
      cash: playerCash,
      netWorth: playerNetWorth,
      charm: playerCharm,
      reputation: playerReputation,
    },
    companies,
    people: updatedPeople,
    market: {
      ...state.market,
      indexLevel: nextIndexLevel,
      dailyReturn: marketReturn,
    },
    history,
  };

  return { state: nextState, events };
}

export function reduce(state: GameState, command: Command): { state: GameState; events: GameEvent[] } {
  switch (command.type) {
    case 'ADVANCE_SLOT': {
      if (state.slot < 3) {
        const nextSlot = (state.slot + 1) as 0 | 1 | 2 | 3;
        return {
          state: { ...state, slot: nextSlot },
          events: [],
        };
      }
      // If at slot 3, advance day
      return tick(state, state.seed);
    }

    case 'ADVANCE_DAY': {
      const count = command.count ?? 1;
      let cur = state;
      const allEvents: GameEvent[] = [];
      for (let i = 0; i < count; i++) {
        const step = tick(cur, cur.seed);
        cur = step.state;
        allEvents.push(...step.events);
      }
      return { state: cur, events: allEvents };
    }

    case 'SET_SLOT': {
      return {
        state: { ...state, slot: command.slot },
        events: [],
      };
    }

    case 'RENAME_PLAYER': {
      return {
        state: {
          ...state,
          player: { ...state.player, name: command.name },
        },
        events: [],
      };
    }

    case 'SETUP_FOUNDER': {
      const companies = { ...state.companies };
      if (companies['company_player']) {
        companies['company_player'] = {
          ...companies['company_player'],
          name: command.companyName,
          sector: command.companySector,
        };
      }

      const people = { ...state.people };
      if (people['wife']) {
        people['wife'] = {
          ...people['wife'],
          name: command.wifeName,
          avatarUrl: command.wifeAvatar || people['wife'].avatarUrl,
        };
      }
      if (people['rival']) {
        people['rival'] = {
          ...people['rival'],
          name: command.rivalName,
          avatarUrl: command.rivalAvatar || people['rival'].avatarUrl,
        };
      }

      return {
        state: {
          ...state,
          player: {
            ...state.player,
            name: command.playerName,
            city: command.playerCity,
            avatarUrl: command.playerAvatar,
          },
          companies,
          people,
          flags: {
            ...state.flags,
            gameSetupCompleted: true,
          },
        },
        events: [
          {
            id: 'ev_founder_setup',
            day: state.day,
            type: 'FOUNDER_SETUP',
            title: 'Empire Founded',
            message: `${command.playerName} has established ${command.companyName} in ${command.playerCity}!`,
            importance: 2,
          },
        ],
      };
    }

    case 'HIRE_EMPLOYEE': {
      const company = state.companies['company_player'];
      if (!company) return { state, events: [] };

      const rng = Rng.stream(state.seed, `hire_${state.day}`, (company.employeesList?.length || 0) + 1);
      const newHire = createNewHire(
        command.department,
        command.role,
        rng,
        state.day,
        command.name,
        command.skill,
        command.salaryDaily
      );

      const onboardingCost = 50000;
      const updatedEmployees = [...(company.employeesList || []), newHire];

      const updatedCompany = {
        ...company,
        employeesList: updatedEmployees,
        financials: {
          ...company.financials,
          cash: company.financials.cash - onboardingCost,
          employees: updatedEmployees.length,
        },
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_hire_${newHire.id}`,
            day: state.day,
            type: 'EMPLOYEE_HIRED',
            title: `New Hire: ${newHire.name}`,
            message: `Hired as ${newHire.role} in ${newHire.department}. Onboarding cost ₹50,000.`,
            importance: 1,
          },
        ],
      };
    }

    case 'FIRE_EMPLOYEE': {
      const company = state.companies['company_player'];
      if (!company || !company.employeesList) return { state, events: [] };

      const emp = company.employeesList.find((e) => e.id === command.employeeId);
      if (!emp) return { state, events: [] };

      const severance = emp.salaryDaily * 15;
      const updatedEmployees = company.employeesList.filter((e) => e.id !== command.employeeId);

      const updatedCompany = {
        ...company,
        employeesList: updatedEmployees,
        financials: {
          ...company.financials,
          cash: company.financials.cash - severance,
          employees: updatedEmployees.length,
        },
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_fire_${emp.id}`,
            day: state.day,
            type: 'EMPLOYEE_TERMINATED',
            title: `Employee Departed: ${emp.name}`,
            message: `Terminated ${emp.role}. Severance payout ₹${(severance / 1000).toFixed(0)}k.`,
            importance: 1,
          },
        ],
      };
    }

    case 'TRAIN_EMPLOYEE': {
      const company = state.companies['company_player'];
      if (!company || !company.employeesList) return { state, events: [] };

      const trainCost = 50000;
      if (company.financials.cash < trainCost) {
        return {
          state,
          events: [
            {
              id: `ev_train_fail_${state.day}`,
              day: state.day,
              type: 'TRAIN_FAILED',
              title: 'Insufficient Cash',
              message: 'Company cash is insufficient for employee training program (₹50k needed).',
              importance: 2,
            },
          ],
        };
      }

      const updatedEmployees = company.employeesList.map((e) => {
        if (e.id === command.employeeId) {
          return {
            ...e,
            skill: Math.min(10, e.skill + 1),
            morale: Math.min(1.0, e.morale + 0.1),
            productivity: e.productivity + 0.1,
          };
        }
        return e;
      });

      const updatedCompany = {
        ...company,
        employeesList: updatedEmployees,
        financials: {
          ...company.financials,
          cash: company.financials.cash - trainCost,
        },
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_train_${command.employeeId}`,
            day: state.day,
            type: 'EMPLOYEE_TRAINED',
            title: 'Employee Training Completed',
            message: 'Employee completed advanced skill training (+1 Skill, +10% Morale).',
            importance: 1,
          },
        ],
      };
    }

    case 'PROMOTE_EMPLOYEE': {
      const company = state.companies['company_player'];
      if (!company || !company.employeesList) return { state, events: [] };

      const updatedEmployees = company.employeesList.map((e) => {
        if (e.id === command.employeeId) {
          return {
            ...e,
            skill: Math.min(10, e.skill + 1),
            salaryDaily: Math.round(e.salaryDaily * 1.25),
            morale: 1.0,
            productivity: e.productivity + 0.15,
          };
        }
        return e;
      });

      const updatedCompany = {
        ...company,
        employeesList: updatedEmployees,
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_promote_${command.employeeId}`,
            day: state.day,
            type: 'EMPLOYEE_PROMOTED',
            title: 'Employee Promoted',
            message: 'Promoted with salary bump. Morale maximized to 100%!',
            importance: 1,
          },
        ],
      };
    }

    case 'ACCEPT_PROJECT': {
      const company = state.companies['company_player'];
      if (!company || !company.projects) return { state, events: [] };

      const updatedProjects = company.projects.map((p) => {
        if (p.id === command.projectId && p.status === 'available') {
          return { ...p, status: 'active' as const };
        }
        return p;
      });

      const updatedCompany = {
        ...company,
        projects: updatedProjects,
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_accept_${command.projectId}`,
            day: state.day,
            type: 'PROJECT_ACCEPTED',
            title: 'Project Contract Signed',
            message: 'Active project pipeline updated. Operations team will begin execution.',
            importance: 1,
          },
        ],
      };
    }

    case 'CANCEL_PROJECT': {
      const company = state.companies['company_player'];
      if (!company || !company.projects) return { state, events: [] };

      const updatedProjects = company.projects.map((p) => {
        if (p.id === command.projectId) {
          return { ...p, status: 'failed' as const };
        }
        return p;
      });

      const updatedCompany = {
        ...company,
        projects: updatedProjects,
      };

      return {
        state: {
          ...state,
          player: {
            ...state.player,
            reputation: Math.max(0, state.player.reputation - 2),
          },
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_cancel_${command.projectId}`,
            day: state.day,
            type: 'PROJECT_CANCELLED',
            title: 'Contract Cancelled',
            message: 'Client contract cancelled prematurely (-2 Reputation).',
            importance: 2,
          },
        ],
      };
    }

    case 'SET_DEPARTMENT_BUDGET': {
      const company = state.companies['company_player'];
      if (!company || !company.departments) return { state, events: [] };

      const updatedDept = {
        ...company.departments[command.department],
        budgetDaily: command.budgetDaily,
      };

      const updatedCompany = {
        ...company,
        departments: {
          ...company.departments,
          [command.department]: updatedDept,
        },
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [],
      };
    }

    case 'SET_STRATEGY': {
      const company = state.companies['company_player'];
      if (!company) return { state, events: [] };

      const curStrategy = company.strategy || {
        brandingSpendDaily: 25000,
        rdSpendDaily: 35000,
        expansionMode: 'balanced',
        costCuttingActive: false,
        dividendPayoutRatio: 0.15,
      };

      const updatedCompany = {
        ...company,
        strategy: {
          brandingSpendDaily: command.brandingSpendDaily ?? curStrategy.brandingSpendDaily,
          rdSpendDaily: command.rdSpendDaily ?? curStrategy.rdSpendDaily,
          expansionMode: command.expansionMode ?? curStrategy.expansionMode,
          costCuttingActive: command.costCuttingActive ?? curStrategy.costCuttingActive,
          dividendPayoutRatio: command.dividendPayoutRatio ?? curStrategy.dividendPayoutRatio,
        },
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_strat_${state.day}`,
            day: state.day,
            type: 'STRATEGY_UPDATED',
            title: 'Corporate Strategy Adjusted',
            message: 'Company resource allocation and growth levers have been updated.',
            importance: 1,
          },
        ],
      };
    }

    case 'LAUNCH_PRODUCT': {
      const company = state.companies['company_player'];
      if (!company) return { state, events: [] };

      const launchCost = command.initialCost || 500000;
      if (company.financials.cash < launchCost) {
        return {
          state,
          events: [
            {
              id: `ev_prod_fail_${state.day}`,
              day: state.day,
              type: 'PRODUCT_LAUNCH_FAILED',
              title: 'Insufficient Cash',
              message: `Need ₹${(launchCost / 100000).toFixed(1)} Lakh to commercialize new product line.`,
              importance: 2,
            },
          ],
        };
      }

      const rng = Rng.stream(state.seed, 'prod_launch', state.day);
      const newProduct = {
        id: `prod_${state.day}_${Math.floor(rng.next() * 100000)}`,
        name: command.name,
        dailyRevenue: 200000,
        dailyCost: 70000,
        quality: 0.8,
        attractiveness: 0.75,
        launchDay: state.day,
      };

      const updatedCompany = {
        ...company,
        products: [...(company.products || []), newProduct],
        financials: {
          ...company.financials,
          cash: company.financials.cash - launchCost,
        },
      };

      return {
        state: {
          ...state,
          companies: { ...state.companies, company_player: updatedCompany },
        },
        events: [
          {
            id: `ev_prod_launch_${newProduct.id}`,
            day: state.day,
            type: 'PRODUCT_LAUNCHED',
            title: `New Product Line Launched: ${newProduct.name}`,
            message: 'Commercial release live. Generating recurring revenue stream.',
            importance: 2,
          },
        ],
      };
    }

    case 'RESET_GAME': {
      const seed = command.seed ?? state.seed;
      return {
        state: createInitialState(seed),
        events: [
          {
            id: 'ev_reset',
            day: 1,
            type: 'GAME_RESET',
            title: 'Game Reset',
            message: 'Game state initialized to Day 1.',
            importance: 2,
          },
        ],
      };
    }

    default:
      return { state, events: [] };
  }
}
