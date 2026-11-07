import { GameState, MacroState, PlayerState, Person, MarketState } from './core/types';
import { Command } from './core/commands';
import { GameEvent } from './core/events';
import { Rng } from './dynamics/rng';
import { CURRENT_SCHEMA_VERSION } from './save/serialize';
import balanceConfig from '../data/config/balance.json';

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

  const player: PlayerState = {
    id: 'player',
    name: 'Aarav Mehta',
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
    companies: {},
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

  // Update history
  const history = {
    days: [...state.history.days, nextDay],
    playerNetWorth: [...state.history.playerNetWorth, state.player.netWorth],
    rivalNetWorth: [...state.history.rivalNetWorth, state.people['rival']?.netWorth ?? 120000000],
    wifeNetWorth: [...state.history.wifeNetWorth, state.people['wife']?.netWorth ?? 60000000],
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
