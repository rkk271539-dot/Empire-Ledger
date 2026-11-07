# EMPIRE LEDGER — Market Tycoon (working title)

> Master specification for building the full game. Hand this file to Antigravity as the single source of truth.
> Successor to the earlier tycoon games. **Modern, polished, mobile-first UI built from tabs, cards and charts. No retro or game-style graphics.**

---

## 0. How to use this document (instructions for the builder agent)

1. Read the whole file before writing code.
2. Build strictly in the order of the **Version Roadmap (Section 3)**. Finish and test each version before starting the next.
3. All game rules live in the **simulation engine** (pure TypeScript, no UI imports). The UI only reads state and dispatches actions.
4. Every number that affects balance goes into `/src/data/config/*.json`, never hard-coded in logic.
5. Keep text readable: no tiny fonts, no retro or decorative fonts. Use a modern sans-serif (e.g., Inter). Minimum body font 14px on mobile.
6. **Never use fixed ranges, constant volatility or raw `Math.random()` for game dynamics.** Use the mathematics and reference code in **Section 18A** for stock prices, business earnings, relationships, investor flows and AI strategy choice. These are mandatory, and they are tested by the statistical tests in 18A.10.
7. When a rule here is ambiguous, pick the simpler option, document it in `/docs/DECISIONS.md`, and continue.

---

## 1. Game Overview

**Genre:** Business and stock-market life simulation / tycoon.

**Market structure:** Three layers of participants: (1) **individuals** (wife, rival, 30+ businessmen/women), (2) **institutions** (Foreign Institutional Investors, Domestic Institutional Investors, banks, mutual funds, insurers), and (3) **startups** (high-risk private companies that can fail, get funded, or IPO).

**Player:** A founder in Mumbai-grounded India (company names, news and cities are configurable on the start screen). The player has a **wife** (independent AI investor), a **main rival** (AI founder), and a living **market of 30+ other businessmen and businesswomen** (AI investors/founders) who buy shares, back or abandon the player and the rival, and compete in the market.

**Core loop:**
Run your company → grow revenue → build trust and "charm" → investors respond to 60-day announcements → buy and sell shares in the market → outgrow the rival.

**Key differences from the old games:**

| Old game | New game |
|---|---|
| 4 players only (you, wife, rival, rival's wife) | 30+ AI market participants plus wife and rival |
| Wives made most investment decisions | Every investor decides independently from fundamentals, trust, charm |
| Game could stall if the 4 never reached the goal | Market is alive regardless; other investors keep trading |
| Basic game UI | Modern fintech-style app UI with tabs, charts, cards, bottom sheets |
| Simple news ticker | Full daily news reports, last 10 days |

**Win / lose conditions (all configurable):**
- **Win:** Player net worth reaches 8x the rival's net worth, OR player becomes #1 in the Rich List for 180 consecutive days with at least a 2x lead.
- **Lose:** Rival reaches 8x player's net worth, OR player is bankrupt (net worth below zero and no way to raise cash for 30 days).
- Alliance members' combined worth may count toward the ratio (toggle in config).

---

## 2. Tech Stack and Architecture

### 2.1 Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript (strict) | Large project, needs type safety |
| Build | Vite | Fast, simple |
| UI | React 18 | Tab/card UI is a natural fit |
| State | Zustand (+ Immer) | Small, predictable |
| Styling | Tailwind CSS + CSS variables for theme | Fast, consistent, dark/light |
| Charts | Recharts for simple charts; uPlot for large time series | Performance on mobile |
| Simulation | Pure TS engine, runs in a **Web Worker** | UI stays smooth during fast-forward |
| Persistence | IndexedDB via `idb` (multiple save slots) + JSON export/import | Saves can be large |
| Randomness | Seeded PRNG (mulberry32) | Reproducible bugs and balancing |
| Testing | Vitest (engine), Playwright (smoke UI) | |
| Delivery | PWA, installable, offline capable | Mobile-first |

### 2.2 Architecture principles

- **Engine is headless.** `/src/engine` has zero React/DOM imports. It can run in Node for balance simulations.
- **Command pattern.** UI sends commands (`BUY_SHARES`, `HIRE`, `ADVANCE_DAY`); engine returns a new state plus a list of **events**.
- **Event bus.** Every meaningful thing (trade, hire, announcement, investor move, news) is an event. The News system, notifications and logs are all built from events.
- **Deterministic ticks.** One `tick(state, seed)` = one game day. Slots (morning/noon/evening/night) are optional sub-steps.
- **Data-driven.** Companies, sectors, personalities, news templates and balance values are JSON.
- **Save versioning.** Every save has `schemaVersion`; migrations in `/src/engine/save/migrations`.

### 2.3 Data flow

```
UI action → command → engine.reduce(state, command) → new state + events[]
                                                        │
              ┌─────────────────────────────────────────┤
              ▼                    ▼                    ▼
         store update         news generator       notification toast
         (UI re-renders)      (daily report)       (if player-relevant)
```

---

## 3. Version Roadmap (build in this order)

| Version | Name | Scope | Done when |
|---|---|---|---|
| **v0.1** | Foundation | Project scaffold, folder structure, theme, tab shell, save/load, seeded RNG streams + dynamics toolkit (18A.1-18A.2), game clock | App opens with empty tabs, can save/load, day advances |
| **v0.2** | Economy core | Player company, departments, employees, projects, revenue, cash, net worth | Player can run a company for 100 days and see numbers change sensibly |
| **v0.25** | Business Operations | Business Page, slow demand model, production and capacity, hire/fire/buy-machine decisions with lead times, advisor (Section 9C) | Controlled business shows demand vs production; decisions change output after lead time |
| **v0.3** | Market | 24 listed companies, 8 sectors, daily prices, buy/sell shares, portfolio, price charts | Prices move believably; player can build a portfolio |
| **v0.4** | People | 30+ AI businessmen/women with personalities, Rich List, person cards, rival on top | Cards open with full detail; AI trades on its own |
| **v0.45** | Institutions and Startups | FII and DII, banks, mutual funds, startup ecosystem (Section 9A), Institutions and Startups tabs | FII/DII daily flows move the market; startups get funded, fail or IPO |
| **v0.5** | Investors and Charm | Charm system, 60-day announcements, investor lean toward player/rival, pull-in / pull-out of money | Announcement visibly moves investor money |
| **v0.55** | Smart AI | Full AI framework (Section 9B): rival strategy library, trading desk, investor wooing, opponent model, reasoning logs | Rival visibly woos investors, trades smartly, adapts; AI test suite passes |
| **v0.6** | Wife and Trust | Wife tab, trust/bond, her own portfolio and decisions, advice and offers | Wife invests in market, you and rival, based on trust |
| **v0.65** | Personal Life and Scandals | Social graph, interaction menus, marriage health, rival's wife, opportunities, secrets and scandals (Section 9E) | Wife and rival interactions emerge from state; exposures and scandals change investor lean and net worth |
| **v0.7** | News | News page, last 10 days, detailed daily reports, per-event templates | Every day produces a readable report |
| **v0.8** | Finance | Bank loans, FDs, IPO of player company, buybacks, dividends | Player can IPO and raise capital |
| **v0.85** | Mergers and Takeovers | Deal pipeline, due diligence, bids, tender, defences, regulator, integration, rival-wife partnerships (Section 9D) | Friendly and hostile deals complete with realistic value outcomes |
| **v0.9** | Dashboard and polish | Full dashboard, graphs, notifications, tutorial, settings | Everything connected on one home screen |
| **v1.0** | Balance and release | Balance passes using headless simulation, bug bash, PWA | 20 full playthroughs complete without breaking |

---

## 4. Folder Structure

```
empire-ledger/
├─ README.md
├─ GAME_SPEC.md                      ← this file
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tailwind.config.ts
├─ docs/
│  ├─ DECISIONS.md                   ← log of ambiguous choices
│  ├─ BALANCE_NOTES.md
│  ├─ CHANGELOG.md
│  └─ versions/                      ← one short md per version (v0.1.md ...)
├─ public/
│  ├─ manifest.webmanifest
│  └─ icons/
├─ src/
│  ├─ main.tsx
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.ts                   ← tab definitions
│  │  └─ providers/
│  ├─ engine/                        ← HEADLESS GAME LOGIC (no React)
│  │  ├─ index.ts                    ← public API: createGame, dispatch, tick
│  │  ├─ core/
│  │  │  ├─ clock.ts                 ← days, slots, calendar, 60-day cycles
│  │  │  ├─ rng.ts                   ← seeded PRNG
│  │  │  ├─ events.ts                ← event types + bus
│  │  │  ├─ commands.ts              ← command types
│  │  │  └─ types.ts                 ← shared types
│  │  ├─ dynamics/                   ← MATH TOOLKIT (Section 18A), used by every system
│  │  │  ├─ rng.ts                   ← named seeded streams, normal/studentT/laplace/poisson/gamma/beta
│  │  │  ├─ stochastic.ts            ← OU, regime switching, Cholesky, stressed correlation
│  │  │  ├─ stockModel.ts            ← Heston-style vol, jumps, impact, fundamentals
│  │  │  ├─ earningsModel.ts         ← revenue, costs, morale, attrition, surprise
│  │  │  ├─ projects.ts
│  │  │  ├─ trustModel.ts            ← Beta-trust, bond, grudge, gossip
│  │  │  ├─ lean.ts                  ← softmax lean with hysteresis, Hawkes flows, Kelly
│  │  │  └─ stats.ts                 ← kurtosis, autocorrelation, entropy (for tests/tools)
│  │  ├─ operations/                 ← Business Pages (Section 9C)
│  │  │  ├─ demand.ts                ← slow demand model and market price
│  │  │  ├─ operations.ts            ← machines, labour, production, inventory
│  │  │  ├─ decisions.ts             ← decision queue with lead times, costs, effects
│  │  │  ├─ advisor.ts               ← Monte Carlo ROI advisor
│  │  │  └─ ceoAutopilot.ts
│  │  ├─ mna/                        ← Mergers and takeovers (Section 9D)
│  │  │  ├─ pipeline.ts              ← deal state machine
│  │  │  ├─ valuation.ts
│  │  │  ├─ diligence.ts
│  │  │  ├─ tender.ts                ← board response, votes, tender offers, defences
│  │  │  ├─ regulator.ts
│  │  │  └─ integration.ts
│  │  ├─ life/                       ← Personal life, relationships, scandals (Section 9E)
│  │  │  ├─ socialGraph.ts
│  │  │  ├─ actions.ts               ← interaction menu logic
│  │  │  ├─ attraction.ts
│  │  │  ├─ marriage.ts
│  │  │  ├─ opportunities.ts
│  │  │  ├─ secrets.ts               ← secrets, exposure hazard
│  │  │  └─ scandal.ts               ← severity, lifecycle, consequences, responses
│  │  ├─ economy/
│  │  │  ├─ macro.ts                 ← interest rate, inflation, market mood
│  │  │  ├─ sectors.ts
│  │  │  └─ pricing.ts               ← daily price model
│  │  ├─ company/
│  │  │  ├─ company.ts
│  │  │  ├─ departments.ts
│  │  │  ├─ employees.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ products.ts
│  │  │  └─ financials.ts            ← revenue, costs, profit, quarterly report
│  │  ├─ market/
│  │  │  ├─ listings.ts              ← listed companies
│  │  │  ├─ orderbook.ts             ← simplified order matching + price impact
│  │  │  ├─ portfolio.ts
│  │  │  ├─ ipo.ts
│  │  │  └─ dividends.ts
│  │  ├─ people/
│  │  │  ├─ person.ts                ← shared model for all humans
│  │  │  ├─ personalities.ts
│  │  │  ├─ rival.ts
│  │  │  ├─ wife.ts
│  │  │  ├─ investors.ts             ← AI investment decision logic
│  │  │  ├─ relationships.ts         ← trust, bond, lean
│  │  │  └─ charm.ts
│  │  ├─ institutions/
│  │  │  ├─ fii.ts                   ← foreign institutional investors
│  │  │  ├─ dii.ts                   ← domestic institutions (mutual funds, insurers, pension)
│  │  │  └─ banks.ts                 ← lending, deposits, credit rating, bank stocks
│  │  │  ├─ flows.ts                 ← daily FII/DII net flow aggregation
│  │  │  └─ regulation.ts            ← FII caps, margin rules, circuit rules
│  │  ├─ startups/
│  │  │  ├─ startup.ts               ← startup model, stages, burn, runway
│  │  │  ├─ funding.ts               ← seed / Series A-C rounds, valuation
│  │  │  ├─ outcomes.ts              ← failure, acquisition, IPO
│  │  │  └─ vc.ts                    ← venture funds and angel investors
│  │  ├─ announcements/
│  │  │  ├─ cycle.ts                 ← 60-day announcement scheduler
│  │  │  └─ reaction.ts              ← investor response to announcements
│  │  ├─ finance/
│  │  │  ├─ bank.ts
│  │  │  ├─ loans.ts
│  │  │  └─ deposits.ts
│  │  ├─ news/
│  │  │  ├─ generator.ts             ← events → articles
│  │  │  ├─ dailyReport.ts
│  │  │  └─ templates.ts
│  │  ├─ ai/
│  │  │  ├─ core/
│  │  │  │  ├─ bandit.ts             ← Thompson-sampling strategy chooser (18A.7)
│  │  │  │  ├─ utility.ts            ← utility scoring for candidate actions
│  │  │  │  ├─ planner.ts            ← multi-day plans and goals
│  │  │  │  ├─ lookahead.ts          ← Monte Carlo rollouts on a cloned state
│  │  │  │  ├─ beliefs.ts            ← what each AI knows/believes (fog of information)
│  │  │  │  ├─ opponentModel.ts      ← learns the player's habits and weaknesses
│  │  │  │  └─ explain.ts            ← reasoning log for cards and news
│  │  ├─ rival/
│  │  │  │  ├─ rivalBrain.ts
│  │  │  │  ├─ strategies.ts         ← strategy library (Section 9B)
│  │  │  │  ├─ investorWooing.ts     ← targeted investor campaigns
│  │  │  │  ├─ tradingDesk.ts        ← smart share holding engine
│  │  │  │  ├─ announcementPlay.ts   ← guidance and timing tactics
│  │  │  │  └─ psyOps.ts             ← PR, rumors, wife courting
│  │  │  ├─ investorBrain.ts
│  │  │  ├─ institutionBrain.ts
│  │  │  └─ wifeBrain.ts
│  │  ├─ victory/
│  │  │  └─ conditions.ts
│  │  └─ save/
│  │     ├─ serialize.ts
│  │     └─ migrations/
│  ├─ worker/
│  │  ├─ sim.worker.ts               ← runs engine off main thread
│  │  └─ bridge.ts                   ← typed message API for UI
│  ├─ store/
│  │  ├─ gameStore.ts                ← Zustand store mirroring engine state
│  │  ├─ uiStore.ts
│  │  └─ selectors.ts
│  ├─ ui/
│  │  ├─ layout/                     ← TopBar, BottomTabs, DaySkipper
│  │  ├─ components/                 ← Card, StatTile, Sparkline, Modal, Toast, Table
│  │  ├─ charts/                     ← NetWorthChart, PriceChart, PieChart
│  │  ├─ tabs/
│  │  │  ├─ dashboard/
│  │  │  ├─ company/
│  │  │  ├─ market/
│  │  │  ├─ people/                  ← list + PersonCard detail
│  │  │  ├─ institutions/            ← FII, DII, banks, fund cards
│  │  │  ├─ business/                ← Business Page (supply-demand panel, decision centre, advisor)
│  │  │  ├─ deals/                   ← Deals board, deal room, defence centre
│  │  │  ├─ life/                    ← interact menus, marriage health, secrets ledger, social calendar
│  │  │  ├─ startups/                ← startup board, funding rounds, detail
│  │  │  ├─ wife/
│  │  │  ├─ news/
│  │  │  ├─ finance/
│  │  │  └─ settings/
│  │  └─ theme/
│  ├─ data/
│  │  ├─ config/
│  │  │  ├─ balance.json
│  │  │  ├─ sectors.json
│  │  │  ├─ companies.json           ← 24+ listed companies
│  │  │  ├─ personalities.json
│  │  │  ├─ difficulty.json
│  │  │  └─ victory.json
│  │  ├─ institutions/
│  │  │  ├─ fii.json                 ← 8-12 foreign funds
│  │  │  ├─ dii.json                 ← 8-12 domestic institutions
│  │  │  └─ banks.json               ← 6-8 banks
│  │  ├─ operations/
│  │  │  ├─ products.json            ← product lines, price/cost parameters by sector
│  │  │  └─ machines.json            ← machine types, capex, capacity, lead times
│  │  ├─ life/
│  │  │  ├─ actions.json             ← interaction menu (time, cost, effects, exposure)
│  │  │  └─ personas.json            ← fidelity, forgiveness, jealousy, time-need profiles
│  │  ├─ mna/
│  │  │  └─ defences.json            ← takeover defences and costs
│  │  ├─ startups.json               ← 40+ startups with stage, sector, founder, burn
│  │  ├─ people/
│  │  │  ├─ investors.json           ← 30+ named AI people (Indian names, backgrounds)
│  │  │  └─ rivals.json
│  │  └─ news/
│  │     ├─ templates.json
│  │     └─ headlines.json
│  └─ utils/
├─ tests/
│  ├─ dynamics/                      ← statistical feel tests (18A.10)
│  ├─ engine/                        ← unit tests per module
│  ├─ balance/                       ← headless 1000-day simulations
│  └─ e2e/
└─ tools/
   ├─ simulate.ts                    ← run N headless games, print stats
   ├─ dynamicsReport.ts              ← prints return stats, trust/lean stats, histograms
   └─ validateData.ts                ← schema check for all JSON
```

---

## 5. Time System

- **1 day = 1 tick.** Optional 4 slots per day (Morning / Noon / Evening / Night) for player actions; AI acts once per day unless an event triggers.
- **Controls:** Next slot, Skip 1 day, Skip 1 week, Auto-play (speed 1x/2x/4x), auto-stops on: announcement day, big news, investor pulls out, loan due, wife offer.
- **Calendar:** Start date configurable (default 1 Jan 2026). Months and weekends matter (market closed on weekends: no price change, news continues).
- **60-day cycle:** Every 60 days is a **Reporting Cycle** (see Section 9).

---

## 6. Core Data Models (TypeScript sketches)

```ts
type Money = number; // store in rupees (or configurable currency), integers where possible

interface GameState {
  schemaVersion: number;
  seed: number;
  day: number;
  slot: 0 | 1 | 2 | 3;
  macro: MacroState;
  player: PlayerState;
  people: Record<PersonId, Person>;      // wife, rival, all investors
  companies: Record<CompanyId, Company>; // player's company + all listed companies
  market: MarketState;                   // prices, history, shareholdings
  relationships: Record<string, Relationship>; // key = `${a}:${b}`
  announcements: AnnouncementRecord[];
  news: NewsDay[];                       // last 10 days kept in full, older summarized
  history: HistorySeries;                // net worth etc. for charts
  flags: Record<string, boolean>;
}

interface Person {
  id: PersonId;
  name: string;
  gender: 'M' | 'F';
  age: number;
  role: 'player' | 'wife' | 'rival' | 'investor' | 'founder';
  city: string;
  industryFocus: SectorId[];
  personality: PersonalityId;
  cash: Money;
  netWorth: Money;                       // computed each day
  holdings: Holding[];                   // shares in companies
  ownedCompanyIds: CompanyId[];
  charm: number;                         // 0-100, ability to persuade / attract capital
  reputation: number;                    // 0-100, public standing
  riskTolerance: number;                 // 0-1
  patience: number;                      // 0-1, how long before pulling out
  lean: { target: PersonId | null; strength: number }; // leaning to player / rival / neutral
  bio: string;
  history: { day: number; netWorth: Money }[];
}

interface Relationship {
  a: PersonId; b: PersonId;
  trust: number;     // 0-100
  respect: number;   // 0-100
  bond: number;      // 0-100 (emotional / personal link)
  lastInteractionDay: number;
  log: RelEvent[];
}

interface Company {
  id: CompanyId; name: string; sector: SectorId;
  ownerId?: PersonId;                    // founder
  listed: boolean;
  sharesOutstanding: number;
  price: Money;
  priceHistory: number[];                // daily
  financials: {
    revenueDaily: Money; costsDaily: Money; profitDaily: Money;
    cash: Money; debt: Money; employees: number;
    quarterly: QuarterlyReport[];
  };
  quality: { management: number; growth: number; moat: number; risk: number };
  dividendPolicy: number;                // payout ratio 0-1
}

interface Holding { companyId: CompanyId; shares: number; avgCost: Money; boughtOnDay: number; }
```

---

## 7. Tabs and Screens (UI Specification)

**Navigation:** Bottom tab bar on mobile, left sidebar on desktop. Tabs:
`Dashboard · Company · Market · People · Institutions · Startups · Wife · News · Finance · Settings`
(On mobile, the bottom bar shows 5 main tabs; the rest sit under a "More" menu.)

**Design language:** Clean fintech look (think Bloomberg-lite crossed with a modern banking app). Dark theme default, light theme optional. One accent color (configurable), green/red only for gains/losses. Rounded cards, subtle shadows, tabular numerals for money. Indian number formatting (lakh/crore) toggle.

---

## 18A. Dynamic Simulation Math and Reference Code (MANDATORY)

Files live in `/src/engine/dynamics/`. Every system in the game (stocks, earnings, relationships, flows, strategies) must call these primitives. **Never call `Math.random()` anywhere in `/src/engine`**.

---
