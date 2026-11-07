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
│  │  │  ├─ banks.ts                 ← lending, deposits, credit rating, bank stocks
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
│  │  │  ├─ rival/
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

**Modern mobile UI standards (mandatory):**

- **Mobile-first, thumb-first:** All primary actions reachable in the bottom 60% of the screen. Bottom tab bar with 5 main tabs, "More" for the rest. Desktop gets a sidebar and multi-column layout.
- **Bottom sheets** for details (person card, company detail, order panel, institution card) instead of full-page jumps; drag to expand/dismiss.
- **Tap targets at least 44x44 px;** respect device safe areas (notch, home indicator).
- **Smooth motion:** 150-250 ms transitions, animated number counters, chart draw-in, skeleton loaders. Respect "reduce motion".
- **Interactive charts:** touch-drag crosshair with tooltip, pinch/range chips, sparklines in lists.
- **Visual hierarchy:** big number + small delta chip (green/red) pattern for all money stats; consistent card elevation; generous spacing.
- **Gestures:** swipe between days in News, pull-to-refresh style "advance day" is NOT used (avoid accidents); long-press for quick actions on holdings.
- **Haptics and sound** (optional, off by default): subtle haptic on trades and big news.
- **Accessibility:** WCAG AA contrast, scalable fonts, color-blind safe gain/loss indicators (arrows and +/- signs, not color alone).
- **Theme:** Dark default, light option, one accent color, tabular numerals, no decorative or retro fonts.
- **Layout testing:** Verify on 360x640, 390x844 and 768x1024 viewports.

### 7.1 Dashboard (home)

Everything important at a glance:

1. **Top bar:** Date, day number, cash, net worth, next announcement countdown, skip controls.
2. **Net Worth Race chart:** Multi-line chart: Player, Rival, Wife, and the top 5 investors. Range toggle (30d / 90d / 1y / all).
3. **Rich List snapshot:** Top 10 by net worth with rank change arrows. Tap → Person card.
4. **Player summary tiles:** Net worth, cash, company valuation, portfolio value, daily earnings, debt.
5. **Wife panel:** Her net worth, trust level with you, her last 3 actions.
6. **Rival panel:** Rival net worth, gap vs you, last move, who currently leans toward him vs you.
7. **Investor sentiment gauge:** % of market capital leaning to you vs rival vs neutral, with money flowing in/out this week.
8. **Institutional flow panel:** Today's and 30-day net FII and DII flows (bar chart), market index, and who is buying vs selling.
9. **Portfolio pie + top movers.**
10. **Live news ticker** (latest 5 headlines, tap → News tab).
11. **Life and risk panel:** marriage health, scandal risk gauge, pending social events, active deals and rumours.
12. **Alerts:** Pending offers, loan due, announcement in N days, deal deadlines, demand and capacity warnings on your businesses.

### 7.2 Company tab (the player's main business)

- Overview: valuation, revenue, cost, profit, cash, headcount, products.
- **Departments:** Marketing (brings projects), HR (hires), Operations, R&D, Finance, Managers (auto-handle projects).
- **Employees:** List with skill, salary, productivity; hire / fire / promote / train.
- **Projects:** Pipeline (available → active → delivered), work units, deadlines, payout.
- **Products:** Own products with monthly earnings, volatility cap ±10% per month.
- **Financial statements:** P&L, balance sheet, cash flow (simplified).
- **Strategy levers:** Expansion, cost cutting, R&D spend, dividend policy, branding spend (feeds charm and reputation).

### 7.3 Market tab (business and shares)

Four sub-tabs: **Companies**, **My Portfolio**, **My Businesses** (Business Pages for companies you control or sit on the board of, see 9C) and **Deals** (mergers and takeovers, see 9D).

**Companies sub-tab**
- Filter by sector, sort by price, change %, market cap, P/E, dividend yield.
- Each company row: logo-style initial badge, price, 1D / 7D change, sparkline.
- **Company detail page:**
  - Price chart (1M / 3M / 1Y / ALL) and volume
  - Key stats: market cap, revenue, profit, P/E, debt, dividend yield
  - **Shareholder register:** who owns what % (player, wife, rival, all AI investors, public float)
  - Recent news about this company
  - Buy / Sell panel (market order and limit order, shows price impact estimate and fees)
  - Founder / owner card link

**My Portfolio sub-tab**
- All holdings with: shares, avg cost, current price, P&L, **daily earnings** (price change + dividend accrual), % of portfolio.
- Total portfolio value, realised / unrealised P&L, daily earning total, dividend calendar.
- Wife's holdings (read-only, visible depending on trust).

**Rules**
- Buying large blocks moves the price (price impact, config-driven).
- Owning 10%+ gives board visibility; 26%+ gives blocking power; 51%+ gives control (can force strategy, appoint management); 90%+ allows buying out the remaining shares at a premium.
- Market is **always alive**: AI participants trade every day regardless of the player. There is no "stalled until 4 people invest" condition any more.

### 7.4 People tab (all businessmen / women)

- **List view:** Rival pinned at top with a distinct card style. Below: all other people sorted by net worth (sortable by charm, reputation, lean, sector).
- Filters: sector, city, lean (toward me / rival / neutral), investor type.
- **Person card (opens as full-screen sheet), detailed sections:**
  1. **Header:** Name, photo-style avatar (modern avatar: clean illustration or initials on a gradient), role, city, age, tagline.
  2. **Numbers:** Net worth, cash, charm, reputation, risk tolerance, patience, with 90-day sparkline.
  3. **Lean meter:** Leaning to you / rival / neutral, strength, and the **reasons** (e.g., "Impressed by your Q2 revenue", "Lost money in your sector").
  4. **Relationship with you:** Trust, respect, bond bars, history log.
  5. **Investments:** What they hold, what they hold in your company and the rival's company, recent buys/sells.
  6. **Businesses owned.**
  7. **Recent activity feed** (last 20 actions).
  8. **Actions (player):** Pitch, offer partnership, request investment, offer shares, send gift/favor, schedule meeting, form alliance (where trust is high enough).
- **Rival card (extra sections):** Strategy style (current AI mode), company breakdown, projects completed, known weaknesses revealed by news, who has been courted.

**Interact (all people):** every person card has an **Interact** menu (call, meet, dinner, gift, favour, introduce, co-invest, and so on, plus romantic options where relevant). Each option shows time cost, money cost and exposure risk. See 9E.2.

### 7.4A Institutions tab (FII, DII, Banks)

- **Overview:** Index level, today's FII and DII net buy/sell, 30/90-day flow chart, total foreign vs domestic ownership of the market, current regime (e.g., "FII risk-on", "FII selling, DII supporting").
- **Sub-tabs:** `FII` · `DII` · `Banks` · `Mutual Funds and Insurers`.
- **Institution card (opens as full sheet):** AUM, mandate, style, current sector tilt, top holdings, recent buys/sells, stake in the player's and rival's companies, sentiment toward the player vs rival, last 20 actions, and the **reasons** behind their latest move.
- **Bank card:** Loan book size, interest rates offered, NPAs, credit appetite, stance on lending to player vs rival, their own stock price.
- **Player actions:** Request institutional meeting (roadshow), offer a block deal, request a strategic stake, apply for loan, negotiate rates. Outcomes depend on charm, reputation, financials and the institution's mandate.
- **Rules visible to player:** FII ownership cap per company (e.g., 49% sector cap), minimum free float, lock-in periods.

### 7.4B Startups tab

- **Startup board:** Cards sorted by stage and valuation: Idea, Seed, Series A, B, C, Pre-IPO. Each shows sector, founder, valuation, monthly burn, runway (months), traction score, risk rating.
- **Startup detail:** Pitch, financial snapshot, funding history, cap table (who owns what: founder, angels, VCs, institutions, player), milestones, red flags, news.
- **Player actions:** Invest as angel or VC, negotiate term sheet (equity %, valuation, board seat), mentor (spends time, raises success odds), acquire the startup, co-invest with wife or other investors, exit via sale or IPO.
- **Risk and return:** Most startups fail; a few return 10-50x. Show a **portfolio of startup bets** with expected value, runway alerts, and follow-on investment prompts.
- **Your own startups:** Player may spin off a startup from the main company (R&D spend), becomes another asset.

### 7.5 Wife tab

- Her profile, net worth, cash, portfolio, businesses she runs.
- **Trust, respect and bond** with you. Separate **trust toward the rival** (she can be influenced by him).
- **Decisions panel:** Her recent decisions and reasoning (e.g., "Bought 2% of Sunrise Pharma; liked the dividend yield").
- **Offers and advice:** She may advise on a deal, warn about a person, or ask for something (time, money, a stake).
- **Meetings:** Schedule discussions that affect trust and her willingness to back you.
- **Investment behaviour:** Invests in the market on her own, can invest in you, in the rival, or in other people's companies depending on trust, bond, and her own analysis. Cannot be controlled directly, only influenced.
- **Events:** Rival propaganda can reduce her trust; support events can raise it.

### 7.6 News tab

See Section 10 for the detailed spec. Last 10 days, one tab/section per day, with a full report each day.

### 7.7 Finance tab

- Multiple banks with different rates, limits and risk (see 9A.4); credit rating; margin funding.
- Bank loans (e.g., 12% over 100 days; amount tiers, one at a time, cooldown), FDs (e.g., 6% over 100 days).
- IPO of the player's company (set price, shares offered, investors subscribe over several days).
- Buybacks, dividends, share issuance.
- Alliance deals and shared-ownership deals (auctions for rare businesses).
- Credit rating that depends on profit history and debt.

### 7.8 Settings

Save slots, export/import, difficulty, number format, theme, font size, speed defaults, notification filters, tutorial toggle, "reset game".

---

## 8. Market Simulation

### 8.1 Macro layer

- `marketMood` (-1 to +1) with slow random walk and shock events.
- `interestRate`, `inflation`, `sectorCycles` (each sector has boom/bust cycles).
- `globalRiskAppetite` (-1 to +1): drives FII risk-on/risk-off regimes. `retailSIPFlow`: steady retail money into mutual funds, supports DII buying.
- `currency` (rupee vs dollar): weak rupee hurts FII sentiment, helps exporters.
- Central bank policy rate decided every 60 days.
- Macro events (budget, policy change, oil shock, monsoon, global slowdown) are generated and reported in news.

### 8.2 Daily price model

For each listed company `c`:

```
fundamental = f(earnings growth, profit margin, debt, quality, sector cycle, interest rate)
sentiment   = news impact + investor lean/flows + announcement surprise
noise       = seeded random, scaled by company risk
orderFlow   = (net buys - net sells today) / liquidity   // price impact
dailyReturn = clamp(a*fundamental + b*sentiment + c*orderFlow + noise, -limit, +limit)
```

- Daily limit (e.g., ±10%) circuit breaker for stability.
- Prices must drift toward fundamental value over weeks, not months (so skill matters).
- The **player's own company** is listed after IPO and follows the same model, so what you do (and what investors think) moves your price.

### 8.3 Order matching (simplified)

- No real order book needed in v0.3. Use a **liquidity-based price impact** model: `impact = size / (liquidity * price)`.
- Orders from all participants are aggregated per company per day, then the price is updated once; the player gets an execution price estimate before confirming.

### 8.4 Dividends

Companies pay dividends by policy. Accrue daily, pay quarterly. Shown in "daily earnings" on the portfolio.

---

## 9. People, Investors, Charm and the 60-Day Cycle (CORE FEATURE)

### 9.1 The cast

- **1 Wife** (special AI, see 7.5)
- **1 Main Rival** (founder AI with his own company **and his own wife**, who is a full AI with her own money, business and investments; see 9E)
- **30+ Market People** (businessmen and businesswomen): industrialists, venture investors, family-office heads, old-money heirs, hedge fund managers, startup founders, retired CEOs, aggressive speculators, conservative dividend seekers. Mix of men and women, various cities and sectors, Indian-grounded names and backstories.

Each has a **personality archetype** (data-driven), for example:

| Archetype | Behaviour |
|---|---|
| Value Investor | Buys cheap, high dividends, slow to move, high patience |
| Momentum Trader | Follows price trends, quick to pull out |
| Visionary Backer | Backs charismatic founders, big bets, high charm sensitivity |
| Conservative Old Money | Avoids volatility, loyal once trust is built |
| Opportunist | Switches sides to whoever is winning |
| Loyalist | Picks a side early, rarely changes |
| Sector Specialist | Only invests in 1-2 sectors |
| Activist | Takes large stakes to push management |

### 9.2 Charm

- **Charm (0-100)** exists for the player, rival, and every person.
- Player charm is raised by: branding spend, public events, successful announcements, hosting meetings, partnerships, charity, media interviews. Lowered by: scandals, layoffs, missed targets, broken promises.
- Charm acts as a **multiplier on how strongly investors react** to your announcements and meetings, and as a **tie-breaker** when an investor chooses between you and the rival.
- Charm decays slowly without upkeep.

### 9.3 Lean and pull in / pull out

Each investor holds a `lean` toward the player, the rival, or neutral, computed from:

```
leanScore(target) =
    w1 * trust(investor, target)
  + w2 * perceivedPerformance(target)     // revenue growth, margin, projects
  + w3 * charm(target) * charmSensitivity(investor)
  + w4 * sectorFit(investor, target)
  + w5 * recentReturns(investor in target)
  - w6 * scandalPenalty(target)
  + w7 * personalityBias(investor)         // Loyalist, Opportunist etc.
  + noise
```

- When leanScore crosses a threshold, the investor **pulls money in** (buys shares, injects capital, offers a loan) or **pulls money out** (sells shares, withdraws loans) over several days.
- Investment size is capped by the investor's cash and by a % of their net worth set by personality (e.g., 5-25%).
- Pull-out is slower for high-patience personalities and instant for momentum traders.
- Every move produces an **event** (feeds news and person card activity feed).
- **Money is conserved:** investor cash goes down when invested, company cash or float absorbs it.

### 9.4 The 60-day announcement cycle

Every 60 days (offset per company, but the player's and rival's are in the same window):

1. **Preview (day -5):** News hints, analyst expectations (consensus revenue and profit), investors build positions.
2. **Announcement day:** Each tracked company (player, rival, major listed companies) publishes: revenue, profit, growth, headcount, major wins, guidance for next 60 days.
3. **Surprise score:** `surprise = (actual - expected) / expected`, adjusted by guidance and charm.
4. **Reaction (next 1-10 days):**
   - Price moves based on surprise.
   - Every investor re-evaluates lean. Strong beat → money flows in; miss → money flows out.
   - Wife and rival's wife/partner re-evaluate trust.
   - Media coverage multiplies reaction (headline tone).
5. **Player choices on announcement day:** Choose **guidance tone** (conservative / balanced / bold), **spin** (honest / aggressive PR), and whether to announce **a big initiative** (new product, acquisition). Bold guidance + beat = big charm gain; bold + miss = charm crash.
6. **Reporting history** page: all past announcements with expected vs actual and investor reaction summary.

### 9.5 Meetings and pitches

- Player can request meetings with individual investors (costs a time slot and maybe money).
- Outcome depends on charm, trust, current performance, and the investor's personality.
- Group events (investor summit every 120 days) let the player and rival both pitch; investors respond with commitments (can later withdraw at the next cycle).

### 9.6 Rival AI (summary; full design in Section 9B)

- Plays by the same rules as the player (no hidden resources, no free money), but is **highly intelligent, proactive and adaptive**.
- Runs a **campaign every day**: wooing investors, trading shares, timing announcements, countering the player's moves.
- See **Section 9B** for the full AI intelligence framework.

### 9.7 Wife AI

- Independent, intelligent decisions: analyses the market herself (value, momentum, sector view), invests in sized positions on her own schedule.
- Her trust in you and in the rival evolves from events, meetings, and your actions; the rival actively tries to influence her (see 9B.5).
- She can invest in the market, in you, in the rival, in startups or other companies, always logged with reasoning she can explain in her tab.
- Bond and trust stay balanced (neither saturates at 90+ for long, using decay and events).
- She can **warn you about threats** (e.g., "Rival is accumulating shares in your supplier") when her analysis finds them and trust is high.

---

## 9B. AI Intelligence Framework (CORE FEATURE: competitive, smart, adaptive)

**Design goal:** The world must feel inhabited by sharp, ambitious people who scheme, plan, adapt and fight for capital. The rival in particular should feel like a genuinely dangerous human opponent, not a script. Still **fair**: AI uses the same rules, same cash, same information channels as the player (see 9B.9).

### 9B.1 AI decision pipeline (every AI, every day)

```
1. PERCEIVE   → update beliefs from public data, news, own network, rumors (fog of information)
2. EVALUATE   → score goals: net worth growth, relative standing, investor support, risk, position threats
3. GENERATE   → create candidate actions (trade, woo, pitch, borrow, hire, spin, attack, defend, wait)
4. SIMULATE   → for top candidates, run short Monte Carlo rollouts (5-20 days) on a cloned state with noise
5. CHOOSE     → pick best by expected utility minus risk penalty, with personality weights
6. EXECUTE    → issue commands (same command API as the player)
7. LEARN      → record outcome; update opponent model and strategy weights
8. EXPLAIN    → write a short reasoning entry (stored for cards / news)
```

- **Utility scoring** is data-driven: weights per personality in `personalities.json`.
- **Lookahead budget:** rival gets a bigger rollout budget than minor AIs; run in the Web Worker with a time cap (e.g., 30 ms rival, 2 ms per minor AI, spread across frames).
- **Goals hierarchy:** survival > liquidity safety > growth > dominance over the player > opportunism.
- **Planning horizon:** the rival keeps a **multi-step plan** (e.g., "build 8% of Supplier X over 15 days, announce partnership on day 60, then lobby FIIs"). Plans can be interrupted and re-planned when conditions change.

### 9B.2 Rival: strategy library (it picks and combines them)

The rival has a **strategy library**; each strategy has trigger conditions, costs, expected payoff and counters. He runs several at once within his cash and attention budget.

| Strategy | What the rival does |
|---|---|
| **Investor Wooing Campaign** | Builds a ranked **target list** of investors (by cash, lean, sector fit, patience). Sends tailored pitches, offers meetings, discounts on placements, board seats, co-investment, and exclusive deals. Prioritises investors already wavering toward the player. |
| **Poaching** | Detects investors with recent losses in the player's company or low trust in him and offers better terms. Offers a **sweetener** (below-market block, guaranteed buyback, side deal) to flip them. |
| **Defensive Retention** | When his investors show pull-out signals (trust drop, lean shift), he calls meetings, improves guidance, buys back shares, or pays special dividends. |
| **Announcement Mastery** | Manages expectations before each 60-day cycle (guides low, then beats; or bold when confident). Times good news, bundles bad news with distractions, schedules partnerships/product launches just before reporting. |
| **Smart Share Holding** | See 9B.3: full trading desk. |
| **Strategic Stakes** | Accumulates **10% / 26% / 51%** thresholds in key suppliers, customers, and in the player's partners to hurt or box him in. |
| **Hostile Moves** | Quietly builds a stake in the player's company (below disclosure thresholds), then pressures or tries to block major decisions at 26%; attempts takeover if the player is weak. |
| **Market Pressure** | Coordinates with allied investors for a **bear raid on the player's stock** (heavy sell pressure timed with negative news) or a **support rally on his own stock** before key events. Strictly within the market-impact rules. |
| **Talent and Project Raids** | Poaches key employees and bids on projects the player needs, forcing price competition. |
| **PR and Psychological Ops** | Leaks rumors (true and false, with reliability scores), sponsors positive coverage, spins the player's setbacks, courts the wife (9B.5), seeds doubt among investors. |
| **Alliance Building** | Forms alliances with high-trust investors and institutions; shares tips; builds voting blocs. |
| **Capital Structure Moves** | Uses bank loans, bonds, IPO, placements and buybacks to optimise cost of capital and signal strength. Times raises when his valuation is high. |
| **Startup Plays** | Backs startups that complement or threaten the player; acquires promising startups to boost growth stories. |
| **Opportunistic Scavenging** | Buys distressed assets when the player or others are in trouble (margin calls, failed startups, bank trouble). |

**Mode selection:** The rival re-evaluates every day using the gap to the player, his cash, investor sentiment, upcoming announcements, and the opponent model. He may run **offence and defence together**. When behind, he becomes more aggressive; when ahead, he protects the lead and tries to lock in alliances; when equal, he escalates targeted attacks.

### 9B.3 Smart share holding (trading desk) for the rival and all smart AIs

The rival (and, scaled down, other AIs) trades like a real professional:

- **Multiple signals:** valuation (P/E, growth, quality), momentum, sector cycle, insider-type information (what his network knows), news sentiment, flow data (FII/DII), upcoming announcements, macro regime.
- **Position sizing:** Kelly-like fractional sizing capped by risk limits; max % per stock, per sector; keeps a **cash buffer** for opportunities and margin calls.
- **Execution skill:** Splits large orders over several days to limit price impact (iceberg style), buys into weakness, sells into strength, avoids telegraphing moves when possible.
- **Event trading:** Accumulates before expected good news, trims before risky announcements, hedges around central bank decisions, rotates sectors with the macro regime.
- **Stake thresholds:** Understands what 5%, 10%, 26%, 51%, 90% mean and plans around them (board influence, blocking power, control, squeeze-out).
- **Portfolio management:** Rebalances, takes profit, cuts losers by rule (stop logic with personality noise), keeps diversification when risk-averse, concentrates when conviction is high.
- **Counter-trading the player:** If the opponent model detects the player accumulating a stock, the rival may front-run, bid it up to raise the player's cost, or avoid the trade if it is a trap.
- **Use of leverage:** Uses margin/bank credit when the expected edge is high; respects margin-call risk (can still get burned, which keeps him fallible).
- **Dividend and cash-flow awareness:** Holds stable payers for income when he needs liquidity.
- **Exit discipline:** Plans exits (partial sell on rallies, full exit on thesis break).

### 9B.4 Smart investors (the 30+ AI people)

Each investor runs the pipeline above at smaller scale, with **personality-shaped intelligence**:

- **Information asymmetry:** Each has a network (who they talk to) and gets different information with delays; the well-connected get tips earlier, the isolated react late.
- **Herding and contrarianism:** Momentum types follow crowds; contrarians fade them; value types wait for mispricing.
- **Coalitions:** Investors form **blocs** (shared sector or trust) that co-invest, share rumors and move together. Blocs can be won or lost via wooing.
- **Deal making:** Investors negotiate; they ask for better terms from both sides and **play the player and rival against each other** (they respond to competing offers).
- **Memory:** Investors remember promises kept or broken, past returns, and slights; trust is slow to build and fast to break.
- **Activists** push for changes and can attack the player or the rival publicly; **opportunists** switch to the winning side at the right time.
- **Self-interest:** Investors protect their own portfolios first; they will not blindly support the player or rival if returns are poor.
- **Imperfection by design:** Smart but not omniscient; they can be fooled by good PR, panic in crashes, or overpay in hype (keeps the market exploitable).

### 9B.5 Rival and the wife: psychological competition

- The rival models the wife's trust drivers (what she values: stability, growth, respect, time) and tries to influence her through events, favours, advice, and by highlighting the player's neglect or risky moves.
- He may offer her investment opportunities, co-invest, or praise publicly; he may also spread doubt about the player's decisions.
- The player can counter through meetings, support, and transparent communication.
- The wife's intelligence prevents manipulation from working too easily: repeated pressure raises her suspicion, and she can warn the player.

### 9B.6 Opponent modelling (the rival learns the player)

The rival tracks:
- The player's **trade patterns** (sectors, timing, sizing), cash habits, loan usage, reaction to news.
- **Investor outreach style** and who the player courts.
- **Weak points:** low cash, high debt, concentrated holdings, upcoming announcements the player may miss, key-person risk, lean slipping.
- **Predictability:** if the player repeats a pattern, the rival exploits it; if the player varies, the rival's confidence drops and he becomes more cautious.

The model is used in scoring and lookahead (predict the player's next likely actions as a noisy distribution). At higher difficulties, the model updates faster.

### 9B.7 Adaptation and learning

- Strategy weights shift after outcomes (what worked against this player gets used more, what failed less).
- Rival has an **"adaptation rate"** per difficulty; it never becomes unbeatable because noise, risk limits and imperfect information stay in place.
- Between games, no persistent learning is stored (only within a playthrough) to keep it fair and deterministic by seed.

### 9B.8 Visible competitiveness (player experience)

The player should feel the rival's presence daily:
- **Rival Watch** in News shows his latest moves, rumours of his plans and investor courting (some hidden, some leaked).
- **Rival card** shows current strategy mode, targets, recent trades (with disclosure delay for large stakes), and a **reasoning snippet** unlocked after the fact ("He accumulated 6% of Supplier X because...").
- **Direct clashes:** bidding wars for investors, competing offers, auctions, hostile stake battles; the game surfaces them as events with choices for the player.
- **Threat alerts** warn the player of dangerous moves (e.g., stake nearing a threshold, investor about to flip, bear raid detected) if the player has enough intel/reputation or hires a research/intel department.
- Occasional **rival mistakes** (misjudged trade, overreach) keep the game satisfying, but always logged and exploitable by an attentive player.

### 9B.9 Fairness rules (non-negotiable)

- AI uses the **same commands, costs, limits and information channels** as the player (no direct reads of the player's hidden private data unless a plausible channel exists, e.g., disclosed filings, leaks, bank gossip, investor chatter).
- No infinite money, no free trades, no rubber-banding that cheats; difficulty only changes **intelligence parameters** (lookahead depth, adaptation rate, mistake rate, information delay, aggression), not resources.
- Deterministic by seed (same seed + same player actions = same AI actions) for bug reproduction.
- Optional "Brutal" mode: small, **disclosed** information edge for the rival (shown in settings).

### 9B.10 Performance and tuning

- AI think time budgets (per day): rival up to 30 ms, institutions 10 ms total, investors 20 ms total, startups 5 ms; spread work using time slicing in the Worker.
- Cache beliefs and candidate lists; recompute only when relevant events happen.
- Tunable in `balance.json` and `personalities.json`; strategy trigger thresholds and costs in `strategies.json`.
- **AI test suite:** (1) Rival beats a naive buy-and-hold bot in at least 80% of simulated games. (2) Rival fails against a strong scripted "expert player" at least 40% of the time (so it is beatable). (3) No AI ever breaks invariants (negative cash without credit, impossible trades). (4) Rival uses at least 5 different strategies across a typical 600-day game. (5) Investor flows react to rival wooing in expected directions in unit tests.

---

## 9A. Institutions, Banks and Startups (CORE FEATURE)

The market is not just people. Large institutions create the flows that move prices, banks control credit, and startups are the risky frontier.

### 9A.1 Foreign Institutional Investors (FII)

- 8-12 named foreign entities (sovereign wealth fund, global hedge fund, pension fund, emerging-market fund, US asset manager, Gulf fund, etc.), each with AUM in the tens of thousands of crores.
- **They act on global macro**, not just local news: a hidden `globalRiskAppetite` variable (driven by global events like US rate moves, dollar strength, oil, geopolitics) drives **risk-on / risk-off** regimes.
  - Risk-on: heavy net buying, favouring large caps, banking, IT, consumption.
  - Risk-off: sudden selling, market-wide drops, rupee pressure.
- **Also react to** India-specific factors: interest rates, inflation, budget/policy, corporate governance news, earnings season, currency.
- Move in **big blocks** (price impact is large) and in **waves** over several days.
- Prefer high-liquidity, well-governed companies; avoid companies with scandals or low free float. They can take **strategic stakes** (up to a configured cap per company) and demand governance changes.
- Daily **net FII flow** is computed and shown in the dashboard and Institutions tab.
- Can lean toward the player or rival as with other investors, but driven mostly by **performance, governance and liquidity**, not personal charm (low charm sensitivity, high data sensitivity).

### 9A.2 Domestic Institutional Investors (DII)

- 8-12 entities: large mutual funds, life insurers, pension funds, a government-owned insurer, a few smaller funds.
- **Stabilisers:** they tend to buy when FIIs sell (counter-flow, limited by their own cash inflows from retail SIP money).
- **SIP inflows:** a steady monthly inflow of retail money into mutual funds (macro variable `retailSIPFlow`, grows with market performance and mood). This is why DIIs can keep buying through FII selling, until retail sentiment breaks.
- Long-horizon, higher patience, diversified. Mutual funds have mandates (large-cap, mid-cap, small-cap, sectoral, flexi) that restrict what they can buy.
- Insurers and pension funds prefer dividend-paying, stable companies and government bonds.
- A **government-backed institution** can step in to support the market during crashes (rare event).

### 9A.3 Flow dynamics (how FII and DII move the market)

```
netFlow(day) = FII_net + DII_net + individualInvestors_net + player_net
priceImpact(company) ∝ netFlow(company) / liquidity(company)
```

- Track cumulative flows per sector and per company.
- Show **"FII selling, DII buying"** style summaries in news and dashboard.
- Crash scenario: FIIs dump → DIIs absorb part → panic selling by momentum traders → circuit breakers. The player can profit or get hurt.
- Regimes last weeks to months, with transitions triggered by macro events.

### 9A.4 Banks

- 6-8 banks: large public sector, large private, mid private, small finance bank, one foreign bank. Banks are also **listed companies** (the banking sector in the market) with their own stock prices, NPAs and earnings announcements.
- **Roles for the player:**
  - **Lending:** Loan approval depends on the player's credit rating, profit history, collateral (shares or assets), debt, charm and relationship with the bank. Different banks offer different rates and limits.
  - **Deposits and FDs:** Rates vary by bank; safety varies (small bank with higher rate but higher risk).
  - **Credit lines and overdrafts** for working capital.
  - **Margin funding** for share purchases (risky; margin calls if prices fall).
- **Banking events:** NPA spikes, rate changes, bank runs on weak small banks, mergers, regulatory action. Weak banks can fail, causing losses for depositors (including the player and AI investors).
- **Rival and banks:** Rival also borrows and courts banks; banks can be pressured to cut credit to one side if sentiment shifts.
- Central bank (fictional "National Reserve Authority") sets the policy rate each 60 days with announcements affecting banks, bonds, FDs and the whole market.

### 9A.5 Other institutional types (smaller scope)

- **Mutual funds:** Part of DII; visible NAV, AUM, holdings, flows.
- **Insurers:** Large stable holders, boost stock stability.
- **Private equity funds:** Take large private stakes, can offer buyouts or growth capital to the player's company.
- **Brokerages and analysts:** Publish ratings (Buy/Hold/Sell) with target prices; ratings move sentiment slightly and appear in news.

### 9A.6 Startups (risky ecosystem)

- 40+ startups at various stages across sectors (fintech, edtech, health-tech, EV, agri-tech, SaaS, D2C, logistics, AI).
- **Model:**

```ts
interface Startup {
  id: StartupId; name: string; sector: SectorId; founderId: PersonId;
  stage: 'idea' | 'seed' | 'seriesA' | 'seriesB' | 'seriesC' | 'preIPO' | 'listed' | 'dead' | 'acquired';
  valuation: Money; cash: Money; burnPerMonth: Money; runwayMonths: number;
  revenueMonthly: Money; growthRate: number;      // can be very high, very volatile
  traction: number; productQuality: number; teamQuality: number; marketSize: number;
  capTable: { holderId: string; pct: number }[];
  fundingHistory: Round[];
  riskScore: number;                              // 0-1 probability-weighted failure risk
}
```

- **Monthly simulation:** burn reduces cash; revenue growth is volatile; milestones (product launch, big customer, regulatory approval) can jump valuation; shocks (competitor, funding winter, founder conflict) can sink it.
- **Funding rounds:** When runway is below ~6 months a startup seeks a round. VCs, angels, institutions, the player, wife, rival and other investors may participate; valuation depends on traction and market mood ("funding winter" reduces rounds and valuations).
- **Outcomes:** About 60% fail (investment lost), 25% muddle along or are acquired cheaply, ~10% return 3-10x, ~5% become big hits (10-50x) via acquisition or IPO.
- **IPO:** Late-stage startups can list; hype can cause huge listing gains or flops. FIIs and DIIs subscribe depending on valuation and governance.
- **Venture and angel investors** among the 30+ people (and a few VC fund entities) invest actively; some lean toward the rival's startup portfolio.
- **Player and rival** can build startup portfolios; the rival AI sometimes backs competing startups, or acquires startups to boost his company.

### 9A.7 Interaction with the rest of the game

- Institutions and banks are **tracked in News** (flows, ratings, loans, NPAs, funding rounds, startup failures/IPOs).
- **60-day announcements** also trigger institutional re-evaluation: FIIs and DIIs revise their stake in the player and the rival.
- Institutions affect **credit rating, IPO subscription, valuation and charm** (a big name taking a stake gives a charm and reputation bump).
- Institutions never "cheat": same rules, deterministic given seed.

---

## 9C. Business Operations Management (Business Pages)

Every business (listed company, private business, startup, the player's own company) has a **Business Page**. What the player can see and do depends on ownership.

| Stake | Access |
|---|---|
| **51% or more (control)** | Full management: every decision below, appoint or replace the CEO, set strategy, dividends, expansion |
| **26% to 50%** | Board seat: live data, can **propose** decisions; approval chance depends on stake, board allies and CEO relationship |
| **10% to 25%** | Detailed data with a 15-day delay; votes on major resolutions only |
| **5% to 10%** | Quarterly disclosures and news |
| **Under 5%** | Public information only |

**Management modes (for controlled businesses):**
- **Manual:** you make every decision.
- **Advisory:** the CEO proposes, you approve or reject.
- **Autopilot:** the CEO decides on their own. Quality depends on the CEO's competence and the CEO makes realistic mistakes and reacts late.

### 9C.1 Business Page layout (all businesses use the same layout; product lines differ)

1. **Header:** name, sector, your ownership, valuation, health score, CEO card, management mode.
2. **Supply and Demand panel (the heart of the page)**, one block per product line:

```
Product: Hot-rolled steel coil
Demand you can serve:  600 t/month      ▲ +0.6% per month   Forecast 6m: 640 (range 585-700)
Production capacity:   250 t/month      Utilisation 98%
Actual production:     245 t/month
Sales:                 245 t/month      Inventory: 6 days
Unmet demand:          355 t/month  →  lost revenue about ₹1.9 crore/month
Market price: ₹54,000/t  (▲ 1.2% in 3 months)   Competitor capacity: no change
Advisor: Adding one 200 t/month mill pays back in about 21 months (range 14-38).
         Risk: 22% chance demand falls below capacity within 12 months.
```
3. **Capacity:** machines (type, count, nameplate output, efficiency, age, maintenance level, status), shifts (1, 2 or 3), workforce by role and utilisation.
4. **Decision centre:** every action shows cost, lead time (ETA), expected effect and risk. Orders go into a **decision queue** with ETAs, so nothing is instant.
5. **Unit economics:** price, raw material, energy, labour, overhead per unit, margin per unit, break-even utilisation, marginal profit of the next machine or hire.
6. **Cost waterfall and P&L:** daily and monthly.
7. **People:** employees by role (skill, wage, morale, tenure, productivity ramp), attrition risk, union strength.
8. **Risks and events:** demand cycle, raw material price, supplier concentration, strikes, accidents, regulation.
9. **Charts (24 months):** demand vs capacity vs production vs sales, price, margin, inventory, headcount.

### 9C.2 Decisions (each with lead time, cost and consequence)

| Decision | Lead time | Key mechanics |
|---|---|---|
| **Hire** (by role) | 15 to 45 days to fill (depends on wage offered vs market and brand) | New hires ramp up over about 60 days; training costs; wage drift |
| **Fire / layoff** | Immediate | Severance cost; morale hit grows with share fired and publicity; union strike risk; lost know-how |
| **Buy machinery** | 30 to 120 days delivery plus 15 to 45 days commissioning | Capex, ramp-up period, breakdown risk by age and maintenance |
| **Add or drop shifts** | 7 to 14 days | Output up to about 2.2x with 3 shifts, but overtime cost, wear and morale cost |
| **Maintenance level** | Immediate | Higher cost now, fewer breakdowns later |
| **Automation** | 90 to 240 days | Capex up, labour per unit down, redundancy and morale issues |
| **Raise or cut price** | Immediate | Share and demand respond through price elasticity; competitors react |
| **Raw material contracts** | Immediate | Spot (cheap, volatile) vs contract (stable, premium); hedging |
| **New plant / expansion** | 180 to 540 days | Large capex, financing needed, execution risk, can overshoot demand |
| **Export / new customer contract** | 30 to 90 days | Extra demand with currency and payment risk |
| **Replace CEO / managers** | 30 to 60 days | Competence changes; transition disruption |
| **Dividend / reinvest** | Immediate | Signals to investors |

### 9C.3 Demand model: slow, trend plus cycle plus regime (no fast jitter)

Demand must move **over months**: typical change is 0.5% to 3% per month, and daily changes are below 0.5%. Mechanism: slow Markov demand regimes (slowdown / normal / boom) set a growth trend; a very slow mean-reverting business cycle is added; seasonality is smooth; daily noise is tiny.

```ts
// engine/operations/demand.ts
export interface DemandState { logBase: number; cycle: number; regime: 0 | 1 | 2; } // 0 slowdown, 1 normal, 2 boom
export interface DemandParams {
  kappaCycle: number;   // ~0.35 per year  (cycles last years)
  sigmaCycle: number;   // ~0.10 per sqrt(year)
  sigmaDay: number;     // ~0.0015        (tiny day-to-day noise)
  seasonAmp: number;    // 0 to 0.06
  seasonPhase: number;
}

function nextDemandRegime(r: 0 | 1 | 2, sectorBoom: number, rng: Rng): 0 | 1 | 2 {
  // monthly transition matrix, tilted by the sector cycle (sectorBoom in about [-1,1])
  const base = [[0.82, 0.16, 0.02], [0.07, 0.86, 0.07], [0.02, 0.18, 0.80]];
  const row = base[r].slice();
  row[2] *= Math.exp(0.8 * sectorBoom);
  row[0] *= Math.exp(-0.8 * sectorBoom);
  const sum = row[0] + row[1] + row[2];
  const u = rng.next() * sum;
  return u < row[0] ? 0 : u < row[0] + row[1] ? 1 : 2;
}

export function stepDemand(d: DemandState, p: DemandParams, env: { gdpGrowth: number; sectorBoom: number },
                           rng: Rng, day: number) {
  const dt = 1 / 365;
  const regime = day % 30 === 0 ? nextDemandRegime(d.regime, env.sectorBoom, rng) : d.regime; // monthly regime update
  const trendG = [-0.06, 0.04, 0.12][regime] + 0.5 * (env.gdpGrowth - 0.06);                 // annual growth by regime
  const cycle = ouStep(d.cycle, 0, p.kappaCycle, p.sigmaCycle, dt, rng.normal());
  const logBase = d.logBase + trendG * dt + p.sigmaDay * rng.studentT(6);
  const seasonal = p.seasonAmp * Math.sin((2 * Math.PI * day) / 365 + p.seasonPhase);
  const demandPerMonth = Math.exp(logBase + cycle + seasonal);   // market demand in units/month
  return { next: { logBase, cycle, regime } as DemandState, demandPerMonth };
}

// Demand you can serve = market demand x your share x price effect (elasticity e: ~0.3 commodity to ~1.5 branded goods)
export const servedDemand = (market: number, share: number, price: number, refPrice: number, e: number) =>
  market * share * Math.pow(price / refPrice, -e);
```

**Market price** also moves slowly toward a supply and demand balance (shortage lifts price, glut cuts it, input costs are passed through partly):

```ts
export function stepMarketPrice(P: number, demand: number, supply: number, inputCostIdx: number,
  p: { kappaP: number; costFloor: number; markupBase: number; sigma: number }, rng: Rng) {
  const tightness = Math.log(demand / Math.max(supply, 1));                    // above 0 means shortage
  const target = Math.log(p.costFloor * inputCostIdx) + p.markupBase + 0.8 * Math.tanh(2 * tightness);
  const logP = Math.log(P) + p.kappaP * (target - Math.log(P)) + p.sigma * rng.studentT(6); // kappaP ~0.02/day
  return Math.exp(logP);
}
```

### 9C.4 Production, inventory and workforce model

```ts
// engine/operations/operations.ts  (all outputs in tonnes/units per day; capacities stored per month)
export const weibullHazard = (age: number, shape: number, scale: number) =>
  (shape / scale) * Math.pow(age / scale, shape - 1);                          // breakdown hazard rises with age

export const rampFactor = (daysSinceStart: number, rampDays = 60) =>          // logistic ramp for hires and new machines
  Math.max(0.25, 1 / (1 + Math.exp(-(daysSinceStart - rampDays / 2) / (rampDays / 8))));

export function stepOperations(o: OpsState, mkt: { demandPerMonth: number; price: number; inputCost: number },
                               rng: Rng, day: number) {
  // 1) Machines: availability, breakdowns, ramp-up, ageing
  let machineCapMonth = 0;
  const machines = o.machines.map(m => {
    const age = day - m.installedDay;
    const hz = weibullHazard(Math.max(age, 1), 1.8, m.scaleDays * (0.6 + 0.8 * m.maintenance)); // maintenance 0..1
    let downUntil = m.downUntil;
    if (downUntil <= day && rng.next() < hz) downUntil = day + Math.round(rng.lognormal(Math.log(6), 0.6)); // repair takes days
    const up = downUntil <= day;
    const ageLoss = 1 - 0.15 * Math.min(1, age / 3650);                         // slow efficiency loss over ten years
    const cap = up ? m.nameplate * m.efficiency * ageLoss * rampFactor(day - m.commissionedDay, m.rampDays) : 0;
    machineCapMonth += cap;
    return { ...m, downUntil };
  });
  const shiftFactor = [1, 1.7, 2.2][o.shifts - 1];

  // 2) Labour: effective workers = sum of skill x morale x hire-ramp
  const effWorkers = o.workers.reduce((a, w) => a + w.skill * (0.7 + 0.5 * w.morale) * rampFactor(day - w.hireDay), 0);
  const labourCapMonth = effWorkers * o.unitsPerWorkerMonth;

  // 3) Production = binding constraint (machines or people), minus scrap
  const capMonth = Math.min(machineCapMonth * shiftFactor, labourCapMonth);
  const produced = (capMonth / 30) * (1 - o.scrapRate);

  // 4) Demand, sales, unmet demand, inventory
  const demandDay = servedDemand(mkt.demandPerMonth, o.share, mkt.price, o.refPrice, o.elasticity) / 30;
  const available = o.inventory + produced;
  const sold = Math.min(demandDay, available);
  const unmet = Math.max(0, demandDay - sold);
  const inventory = (available - sold) * (1 - o.spoilageRate);

  // 5) Feedback: persistent unmet demand leaks customers to competitors; reliable supply wins share back slowly
  const unmetRatio = unmet / Math.max(demandDay, 1e-9);
  const share = clamp(o.share - 0.00005 * unmetRatio + 0.00002 * (1 - unmetRatio) * o.brand, 0.001, 0.95);

  // 6) Money (rupees per day)
  const revenue = sold * mkt.price;
  const materials = produced * mkt.inputCost;
  const energy = produced * o.energyPerUnit * o.energyPrice;
  const overtime = Math.max(0, shiftFactor - 1) * o.workers.length * o.avgWage / 30 * 0.35;
  const labour = o.workers.reduce((a, w) => a + w.wage, 0) / 30 + overtime;
  const carry = inventory * mkt.inputCost * 0.0003;
  const profit = revenue - materials - energy - labour - o.fixedCostPerDay - carry;

  return { next: { ...o, machines, inventory, share }, daily: { produced, sold, unmet, revenue, profit, capMonth } };
}

// Hiring is a stochastic arrival process, not instant: better pay and brand fill vacancies faster
export function hireArrivals(vacancies: number, wageOffer: number, marketWage: number, brand: number, rng: Rng) {
  const attract = Math.exp(2.0 * Math.log(wageOffer / marketWage) + 0.5 * (brand - 0.5));
  return Math.min(vacancies, rng.poisson(vacancies * 0.05 * attract));
}

// Layoffs hurt: morale drop and strike risk grow with the share fired, union strength and publicity
export function layoffImpact(fired: number, headcount: number, union: number, publicity: number, rng: Rng) {
  const frac = fired / Math.max(headcount, 1);
  const moraleHit = Math.min(0.5, 0.25 * Math.pow(frac, 0.7) * (1 + union));
  const strikeP = 1 / (1 + Math.exp(-(6 * frac + 2 * union + publicity - 3)));
  return { moraleHit, strike: rng.next() < strikeP, strikeDays: Math.round(rng.lognormal(Math.log(9), 0.5)) };
}
```

### 9C.5 The advisor: "should I buy another machine?" (Monte Carlo ROI)

The advisor does not give a single fake number. It simulates future demand uncertainty and reports a range and a risk of idle capacity. Its accuracy depends on the CEO and the player's analyst/intel quality (noisy inputs when staff are weak).

```ts
export function machineAdvisor(ctx: {
  unmetForecast: { mean: number; sd: number };   // tonnes/month you could still sell in 6-12 months
  marginPerUnit: number; addedCapacity: number;  // e.g. 9,000 per tonne and 200 t/month
  capex: number; opexPerMonth: number;           // labour and maintenance for the new line
  leadDays: number; rampDays: number; annualRate: number;
}, rng: Rng, N = 500) {
  const paybacks: number[] = [], npvs: number[] = []; let idle = 0;
  for (let i = 0; i < N; i++) {
    const demandPath = Math.max(0, ctx.unmetForecast.mean + ctx.unmetForecast.sd * rng.studentT(5)); // fat-tailed uncertainty
    if (demandPath < ctx.addedCapacity * 0.6) idle++;                                                 // idle-capacity risk
    let cum = -ctx.capex, npv = -ctx.capex, payback = Infinity;
    const start = Math.round((ctx.leadDays + ctx.rampDays) / 30);
    for (let m = 1; m <= 84; m++) {
      const ramp = m <= start ? 0 : Math.min(1, (m - start) / Math.max(1, ctx.rampDays / 30));
      const drift = Math.exp(0.02 * (m / 12) * rng.normal());                                         // demand keeps wandering
      const usable = Math.min(ctx.addedCapacity, demandPath * drift) * ramp;
      const cash = usable * ctx.marginPerUnit - (m > start ? ctx.opexPerMonth : 0);
      cum += cash; npv += cash / Math.pow(1 + ctx.annualRate / 12, m);
      if (cum >= 0 && payback === Infinity) payback = m;
    }
    paybacks.push(payback); npvs.push(npv);
  }
  paybacks.sort((a, b) => a - b); npvs.sort((a, b) => a - b);
  const q = (arr: number[], p: number) => arr[Math.floor(p * (arr.length - 1))];
  return { paybackP10: q(paybacks, 0.1), paybackP50: q(paybacks, 0.5), paybackP90: q(paybacks, 0.9),
           npvMean: npvs.reduce((a, b) => a + b, 0) / N, probIdle: idle / N };
}
```

### 9C.6 Events specific to operations (generated from state, not from a calendar)

Raw material price spike or squeeze (OU plus jumps), supplier failure (contagion from startups and banks), strike (from morale, layoffs, union), accident (hazard rises with low maintenance and long shifts), new competitor plant (appears when margins stay high for months), government order, export contract, power cuts, regulation change, key manager poached by the rival, product recall. Each produces news and decision prompts.

### 9C.7 AI and the rival

The rival uses the same pages and rules. His CEO logic checks utilisation, unmet demand, margins and the advisor output, and he **sometimes overbuilds or underinvests** (so he can be outsmarted). He may deliberately **buy a supplier or compete for the same machines and workers** to hurt the player.

---

## 9D. Mergers, Acquisitions and Takeovers

Deals are first-class game objects. Participants: player, rival, wife, rival's wife, AI investors, institutions, listed companies, private firms, startups.

### 9D.1 Deal types

| Type | Description |
|---|---|
| **Friendly acquisition** | Agreed price; board recommends; shareholder vote |
| **Merger of equals** | Share swap; shared board and management; high integration risk |
| **Hostile takeover** | Tender offer straight to shareholders after the board rejects; creeping stake first |
| **Asset purchase** | Buy a division, plant or brand; simpler, less synergy |
| **Joint venture / strategic partnership** | Shared project or company; builds relationships (see 9D.8) |
| **Squeeze-out** | After 90% ownership, buy out the remaining holders |
| **Reverse deals** | Target runs a **Pac-Man defence** or a **white knight** brings a friendly bidder |

### 9D.2 Deal pipeline (state machine)

```
Idea → Approach (private or public) → NDA and Due Diligence → Valuation and Offer
     → Negotiation (counter-offers) → Board response → Shareholder vote or tender
     → Regulatory clearance → Financing → Closing → Integration (12 to 24 months) → Review
```
Each stage has a duration, cost and failure chance. Leaks can happen at any stage (news, price run-up, rival counter-bid), and a leaked deal changes the rest of the process.

### 9D.3 Valuation and bidding (with winner's curse)

Standalone value comes from `fundamentalPerShare` (18A.4). Synergies are uncertain and each bidder estimates them with noise, so the **highest estimate wins and tends to overpay**.

```ts
// engine/mna/valuation.ts
export interface Synergies { cost: number; revenue: number; financing: number; }
export const netDealValue = (standalone: number, s: Synergies, integrationCost: number, realisation: number) =>
  standalone + realisation * (s.cost + s.revenue + s.financing) - integrationCost;

// A bidder's private estimate of the target's true value; noise shrinks with diligence spend, grows with opacity
export function estimateValue(trueValue: number, diligenceSpend: number, opacity: number, hubris: number, rng: Rng) {
  const sd = (0.25 * opacity) / Math.sqrt(1 + diligenceSpend / 1e6);
  return trueValue * Math.exp(sd * rng.normal()) * (1 + hubris);               // hubris inflates the estimate
}

// Maximum rational bid: standalone plus a negotiated share of expected net synergies
export function maxBid(standalone: number, expectedNetSynergies: number, bargainingShare: number) {
  return standalone + Math.max(0, bargainingShare * expectedNetSynergies);     // share about 0.2 to 0.7
}
```

### 9D.4 Due diligence (information is bought, never free)

At deal start the target gets **hidden items** drawn from distributions: lawsuits, tax disputes, inflated receivables, aging inventory, key-person dependence, customer concentration, environmental liabilities, undisclosed debt, culture problems.

```ts
export function runDueDiligence(hidden: HiddenItem[], spend: number, days: number, accessLevel: number, rng: Rng) {
  const p = 1 - Math.exp(-(spend / 5e5) * (days / 30) * accessLevel);          // chance each item is found
  return hidden.map(h => ({ ...h, found: rng.next() < p * (h.concealment ? 0.6 : 1) }));
}
// Unfound items hit AFTER closing as negative surprises: write-downs, settlements, lost customers.
// Hostile bids get lower accessLevel (public data only), so they carry far more hidden-risk.
```

### 9D.5 Target response, shareholder votes, tender offers

```ts
export function boardAcceptProb(premium: number, ctx: { requiredPremium: number; founderAttachment: number;
  trustInBidder: number; stockPaymentRisk: number; defences: number }) {
  const z = 6 * (premium - ctx.requiredPremium) + 1.5 * (ctx.trustInBidder - 0.5)
          - 2.0 * ctx.founderAttachment - 1.0 * ctx.stockPaymentRisk - 1.8 * ctx.defences;
  return 1 / (1 + Math.exp(-z));
}

// Each shareholder has a reservation price; a tender succeeds if enough shares are tendered
export function tenderOutcome(offer: number, holders: { shares: number; type: string; value: number;
  leanToBidder: number; holdout: number }[], rng: Rng, required: number) {
  let tendered = 0, total = 0;
  for (const h of holders) {
    total += h.shares;
    const reservation = h.value * Math.exp(0.08 * rng.normal() + 0.15 * h.holdout - 0.08 * h.leanToBidder);
    const arb = h.type === 'arbitrage' ? -0.05 : 0;                             // arbitrageurs tender near the offer
    if (offer * (1 + arb) >= reservation) tendered += h.shares;
  }
  return { tenderedPct: tendered / total, success: tendered / total >= required };
}
```

**Defences available to targets (including the player):** poison pill (dilutes a bidder who crosses 15% to 20%), staggered board, white knight, Pac-Man counter-bid, crown-jewel sale, special dividend, share buyback, lobbying the regulator, seeking friendly large holders. Each has a cost and side effects.

### 9D.6 Regulatory clearance

```ts
export function regulatoryBlockProb(shareA: number, shareB: number, lobbying: number, politicalHeat: number) {
  const dHHI = 2 * shareA * shareB * 10000;                                     // change in concentration index
  const z = (dHHI - 200) / 150 + politicalHeat - 0.8 * lobbying;
  return 1 / (1 + Math.exp(-z));
}
// Remedies: forced divestments, behavioural conditions, delay (days to months), or outright block.
```

### 9D.7 Integration risk (where deals often destroy value)

Integration is a multi-month process, not a switch. Planned synergies are only partly realised, and the dispersion is wide.

```ts
export function integrationOutcome(ctx: { cultureFit: number; sizeRatio: number; overlap: number;
  retention: number; leadershipClarity: number; speed: number }, plannedSynergy: number, rng: Rng) {
  const mu = clamp(0.30 + 0.35 * ctx.cultureFit + 0.15 * ctx.leadershipClarity + 0.10 * ctx.retention
                   - 0.12 * Math.abs(Math.log(ctx.sizeRatio)) - 0.15 * ctx.overlap * (1 - ctx.speed), 0.05, 0.95);
  const k = 6;                                                                  // small k = wide outcomes
  const realisation = rng.beta(mu * k, (1 - mu) * k);                           // fraction of planned synergy actually earned
  const attritionMult = 1 + 2.0 * (1 - ctx.cultureFit) * (1 - ctx.retention);   // exits spike, then decay (time constant 120 days)
  const customerChurn = 0.03 * (1 - ctx.cultureFit) + 0.02 * ctx.overlap;
  const reversal = rng.next() < 1 / (1 + Math.exp(-(6 * (0.25 - mu) + 1)));    // rare: deal fails and is partly unwound
  return { realisation, realisedValue: realisation * plannedSynergy, attritionMult, customerChurn, reversal };
}
```
**Calibration target:** about 40% to 60% of acquisitions should destroy acquirer value after 24 months; premiums average 25% to 40%; hostile bids succeed about 30% to 45% of the time.

**Market reaction on announcement:** target jumps by about 80% of the premium; the acquirer usually dips: `acquirerReturn = 0.15 * perceivedNetValue / acquirerMarketCap - 0.02 * stockFinancedFraction - 0.01 * hubrisSignal`. Institutions and investors update lean on the acquirer's management quality.

### 9D.8 The rival, the wife and strategic partnerships

The rival can **propose a merger, JV or stake purchase to the wife's company** if his models say it is profitable (or if it helps him influence her). This creates a **partnership with shared interests**, which has relationship effects:

- Recurring contact: joint meetings, board seats, shared projects. Each interaction applies `applyEvent` (kind `partnership`, positive valence, moderate salience), so **trust and bond between the wife and rival rise over time** if the partnership performs well, and fall if it fails.
- **Information channel:** the rival gains legitimate visibility into her company and decisions (and can leak or exploit it).
- **Influence:** his lean score on her investing rises; he may pull her capital toward his own plans.
- **Conflict-of-interest flag:** raises scandal exposure chances for any related secret (see 9E) and creates headlines.
- **The wife decides on her own** using value gain, trust in the rival vs trust and bond with the player, risk, and her personality. She may ask the player for advice (if trust is high) or **hide** the deal.

```ts
export function wifeAcceptsPartnership(x: { valueGain: number; trustRival: number; trustPlayer: number; bondPlayer: number;
  riskAversion: number; independence: number }, rng: Rng) {
  const z = 4 * x.valueGain + 1.8 * (x.trustRival - 0.5) - 1.2 * (x.trustPlayer - 0.5) * (1 - x.independence)
          - 0.01 * x.bondPlayer * (1 - x.independence) - 2.0 * x.riskAversion * (1 - x.valueGain) + 0.3 * rng.normal();
  return 1 / (1 + Math.exp(-z));
}
```
**Player counters:** make a better offer to the wife's company, ask or advise her, buy a **26% blocking stake**, bid himself, expose the rival's motives, or form his own partnership with the rival's wife's company (symmetrical).

### 9D.9 UI: Deals tab

- **Active deals** board with stage tracker and ETA; **Rumours** (possible deals, reliability score).
- **Deal room:** valuation range, synergy estimates (with uncertainty bands), diligence findings, bidders, board and shareholder positions, financing plan, regulator view, counter-offer controls.
- **Defence centre** when you are targeted: alerts for stake-building (above 5% disclosures), recommended defences and their costs.
- **Post-deal dashboard:** integration progress, synergy realisation vs plan, attrition and churn.

### 9D.10 AI behaviour

The rival and other AIs scan for targets using value gap, synergy fit, financing capacity and strategic purpose (hurt the player, secure suppliers, win a partner). They estimate with noise, sometimes **overpay**, sometimes retreat after diligence, and use creeping stakes, leaks and timing. Institutions vote based on premium, governance and their view of management. All deals obey the same rules and costs as the player's.

---

## 9E. Personal Life, Relationships and Scandals

> **Content boundaries:** Romance and family drama are shown at a **PG-13** level: dinners, trips, "seen together", tabloid language, emotional consequences. No explicit content. The focus is relationship management, secrecy, trust and business impact.

### 9E.1 Cast and social graph

- **Player's wife:** full independent AI with her own money, business, portfolio, friends and goals.
- **Rival's wife:** also a **full AI** with her own money (starting cash in the same range as the wife), portfolio, circle, ambitions and opinions of both men. She can invest in the market, in the rival, or in other people (including the player), and her marriage can strain or strengthen independently.
- **All 30+ business people, family, friends, mentors** are nodes in a social graph with typed edges (family, friend, business, mentor, romantic, secret).
- The player can interact with **everyone**. Each person has availability, mood, schedule and personality.

### 9E.2 Interaction menu (each action takes time slots and has risks)

Actions are data in `/src/data/life/actions.json`. Each has time cost (in the 4 daily slots), money cost, requirements (stage, trust), effect distributions (not fixed numbers), and exposure risk.

| Group | Examples |
|---|---|
| **Everyday** | Call, coffee, lunch, dinner, gift, favour, introduce someone, share a tip, invite to an event, visit family |
| **Business social** | Private meeting, golf, dinner party, co-invest, mentor, recommend for a job, public praise |
| **Conflict** | Public criticism, compete publicly, spread a rumour, withhold a favour |
| **Marriage** | Quality time, holiday together, surprise, support her business, attend her events, apologise, difficult talk, joint decision |
| **Romantic (other people)** | Flirt, date, private dinner, trip, secret meeting (any romantic action outside a marriage is a **secret** with exposure risk) |
| **Repair** | Apologise, make amends, counselling, public reconciliation |

**Time is the scarce resource:** 4 slots a day shared between company, family, networking, rest. Neglecting the spouse (below her personal need, e.g. 6 slots a week) builds resentment.

### 9E.3 Relationship state (extends the Beta-trust model in 18A.6)

```ts
export interface Bond extends Rel {              // alpha, beta, respect, bond, grudge, lastContactDay from 18A.6
  attraction: number;     // 0..100, romantic or social pull
  familiarity: number;    // accumulated time together (diminishes novelty)
  compat: number;         // hidden compatibility from the seed, learned slowly
  jealousy: number;       // 0..100
  commitment: number;     // 0..100, exclusivity, marriage vows
  stage: 'stranger' | 'acquaintance' | 'friend' | 'close' | 'interest' | 'partner' | 'spouse';
}
// Stage moves up only after thresholds hold for N days (hysteresis) and moves down faster after betrayal.
```

**Attraction and novelty (OU toward a target built from fit, reciprocity, status):**

```ts
export function stepAttraction(b: Bond, x: { reciprocity: number; status: number; contactToday: boolean }, rng: Rng) {
  const novelty = Math.exp(-b.familiarity / 30);                                // new people feel exciting, then it fades
  const target = 100 / (1 + Math.exp(-(-1.2 + 1.6 * b.compat + 0.8 * x.reciprocity + 0.5 * x.status + 0.6 * novelty)));
  const attraction = clamp(ouStep(b.attraction, target, x.contactToday ? 0.06 : 0.01, 2.0, 1, rng.normal()), 0, 100);
  return { ...b, attraction, familiarity: b.familiarity + (x.contactToday ? 1 : 0) };
}
```

### 9E.4 Marriage health (player's marriage and the rival's marriage both run this)

```ts
export interface Marriage { satisfaction: number; resentment: number; commitment: number; sharedGoals: number; conflict: number; }

export function stepMarriage(m: Marriage, x: { qualityTimeSlotsWeek: number; neededSlotsWeek: number; support: number;
  sharedSuccess: number; secretBurden: number; rivalInfluence: number; personalityFidelity: number }, rng: Rng) {
  const neglect = Math.max(0, x.neededSlotsWeek - x.qualityTimeSlotsWeek) / Math.max(1, x.neededSlotsWeek); // 0..1
  const target = 60 + 25 * x.support + 15 * x.sharedSuccess - 40 * neglect - 25 * x.secretBurden - 15 * x.rivalInfluence;
  const satisfaction = clamp(ouStep(m.satisfaction, target, 0.02, 1.5, 1, rng.normal()), 0, 100);
  const resentment = clamp(m.resentment * 0.995 + 1.5 * neglect + 2.0 * x.secretBurden - (satisfaction > 70 ? 0.4 : 0), 0, 100);
  const commitment = clamp(m.commitment + 0.02 * (satisfaction - 55) - 0.01 * resentment, 0, 100);
  return { ...m, satisfaction, resentment, commitment };
}
```

### 9E.5 Opportunities and temptation (wife and others act on their own)

Opportunities appear as **events**: business tours, conferences, dinners, holidays, partnership trips. They arise from a Poisson process whose intensity depends on contact frequency and shared interests (a business partnership with the rival raises it a lot).

```ts
export function opportunityRate(x: { contactFreq: number; partnership: boolean; mutualInterests: number; travelDays: number }) {
  return 0.01 + 0.04 * x.contactFreq * (1 + 1.5 * (x.partnership ? 1 : 0)) + 0.01 * x.mutualInterests + 0.002 * x.travelDays;
}

// An NPC's decision to act on an opportunity (logistic with noise). Applies equally to the wife, the rival's wife and the rival.
export function driftProbability(x: { satisfaction: number; attractionToOther: number; opportunity: number;
  fidelity: number; fearOfExposure: number; novelty: number; resentmentTowardPartner: number }) {
  const z = -2.4 + 0.06 * (60 - x.satisfaction) + 0.035 * x.attractionToOther + 1.1 * x.opportunity + 0.5 * x.novelty
          + 0.02 * x.resentmentTowardPartner - 0.045 * x.fidelity - 0.03 * x.fearOfExposure;
  return 1 / (1 + Math.exp(-z));
}
```
**Wife and rival:** if trust and bond between them are strong, the partnership is active, and her marriage satisfaction is low, then tours, dinners and hotel stays become likely events. Their secrecy and the player's chance to find out are modelled below. The same applies in reverse: **the player can build closeness with the rival's wife**, with the same risks. Nothing is scripted; outcomes come from the state.

### 9E.6 Secrecy, exposure and the scandal engine

Every sensitive action creates a **Secret** with witnesses and evidence. Exposure is a hazard process, so a secret can survive for months or blow up in a week.

```ts
export interface Secret {
  id: string; kind: 'affair' | 'trip' | 'insider' | 'bribe' | 'hidden-deal';
  participants: string[]; day: number;
  evidence: number;        // 0..1 strength of proof if exposed
  publicness: number;      // 0..1 (private home vs five-star hotel lobby)
  witnesses: { id: string; loyalty: number; leakProne: number }[];
  coverUp: number;         // 0..1 effort and money spent hiding it
}

export function exposureHazard(s: Secret, env: { fame: number; paparazzi: number; rivalSurveillance: number;
  gossipDensity: number; digitalTrail: number }, daysSince: number) {
  const witness = s.witnesses.reduce((a, w) => a + 0.0015 * w.leakProne * (1 - w.loyalty), 0);
  const base = 0.001 * (1 + 4 * s.publicness) * (1 + 3 * env.paparazzi * env.fame);
  const spying = 0.004 * env.rivalSurveillance;
  const trail = 0.0008 * env.digitalTrail + 0.0006 * env.gossipDensity;
  const lam = (base + spying + trail) * Math.exp(-daysSince / 240) * (1 - 0.8 * s.coverUp) + witness; // witnesses never go away
  return 1 - Math.exp(-lam);                                                    // probability of exposure today
}
```

**What can reveal a secret:** paparazzi, a talkative witness (driver, staff, hotel), a financial or travel trail, the rival's investigators, a confession, or gossip passing through the social graph (18A.6 gossip). The player can hire investigators (cost, accuracy 60% to 90%, with false positives) to **learn about** the wife's or rival's secrets, and the rival can do the same to the player.

**Scandal severity and lifecycle:**

```ts
export function scandalSeverity(s: Secret, hypocrisy: number, audienceSensitivity: number, coverUpDiscovered: boolean) {
  return clamp(s.evidence * (0.4 + 0.6 * s.publicness) * (1 + hypocrisy) * (0.7 + 0.6 * audienceSensitivity)
               * (coverUpDiscovered ? 1.6 : 1), 0, 3);
}
// News attention decays but self-excites with follow-ups (Hawkes style): 
export const scandalAttention = (sev: number, t: number, followUps: number) =>
  sev * (Math.exp(-t / 7) + 0.3 * Math.exp(-t / 30)) * (1 + 0.4 * followUps);
```

**Consequences are computed from state (never fixed):**
- **Investors:** each investor's lean penalty = `severity * moralSensitivity * hypocrisy`. Conservative Old Money and institutions react strongly; Opportunists barely care unless the stock falls.
- **Stock price and charm:** a shock proportional to severity feeds `newsTone` (18A.4) and reduces charm and reputation.
- **The spouse:** `applyEvent` with a betrayal valence, huge grudge and resentment, commitment drops.
- **Marriage breakdown:** divorce hazard rises with resentment, public humiliation and low commitment; settlement splits marital assets (default 50/50 adjusted by prenup and fault), which **reduces net worth and can force share sales**.
- **Board and control:** at 26%+ stakes, boards and large holders may demand resignation; banks may tighten credit.
- **The rival:** can exploit (leak at the worst moment, blackmail for favours, poach investors) if he knows and has evidence.

**Crisis responses (player choices):** deny, apologise publicly, legal injunction, counter-leak against the rival, pay for silence (risky, creates a new secret), step aside, reconcile publicly. Success depends on evidence strength and credibility: denial works only if evidence is weak, and **if the truth emerges later the cover-up penalty multiplies the damage**.

### 9E.7 What the player can and cannot see

- Visible: public image, reputation, scandal risk meter (based on what the player knows), the player's own secrets ledger, the wife's **shared** calendar.
- Hidden: the wife's and the rival's secrets until discovered (investigators, tips, confessions, public exposure). Unexplained absences, odd payments or behaviour changes produce **clues** with reliability scores.
- **Player options when suspicious:** talk to her, ignore, investigate, set a trap, counter-leak, or invest in the marriage. Each affects trust and resentment differently.

### 9E.8 UI additions

- **People card:** Interact menu with all actions and live risk tags (time cost, money, exposure risk).
- **Wife tab:** marriage health (satisfaction, resentment, commitment) with trend, her calendar (known items only), time allocation prompts, **clues** from suspicious events.
- **Life panel (under Wife tab or its own tab):** time allocation slider (company, family, network, rest), secrets ledger, public image and scandal risk gauges, social calendar.
- **Dashboard:** scandal risk gauge, marriage health indicator, pending social events.
- **Rival card:** his marriage status (public info), rumours about his private life, his wife's profile and public activity.

### 9E.9 AI behaviour

All NPCs, including the rival and both wives, use the same state, decisions and exposure rules. The rival calculates whether a private-life leak or a partnership with the wife helps him, and he **can also make mistakes and get caught**. Rival's wife can become an ally, an informant, an investor or an enemy depending on how the player and the rival treat her and her own marriage state.

---

## 10. News System (Detailed Daily Reports)

**Goal:** A real feeling of a living world. The player should open the News tab and find enough to read every day.

### 10.1 Structure

- Keep the **last 10 days in full detail**. Older days are compressed into short summaries (headline list only) to save memory.
- News tab layout: **Day selector** (today, yesterday, ... 9 days ago) → **Daily Report**.

### 10.2 Daily report sections

1. **Market Wrap:** Index move, top 5 gainers, top 5 losers, most traded, sector heatmap, one-paragraph narrative, **FII and DII net buy/sell for the day**.
2. **Your Company:** What happened today (projects completed, hires, revenue, issues) and how the market reacted.
3. **Rival Watch:** Rival's actions, hires, deals, statements, rumors.
4. **People and Power:** Notable investor moves ("X bought 3% of Y", "Z pulled out of the rival's company"), lean changes, new alliances.
5. **Society, Family and Scandal:** marriage news, public appearances, rumours, scandal coverage (with lifecycle and follow-ups), reputation shifts. Tabloid tone only, PG-13.
6. **Macro and Policy:** Rates, inflation, budget, regulation, global events.
7. **Announcements, Earnings and Deals:** reporting-cycle news (or previews), plus deal news: bids, leaks, due diligence rumours, shareholder votes, regulator decisions, integration progress, and operations news from businesses (strikes, capacity expansions, supply shocks).
8. **Institutions and Banks:** FII/DII flow commentary, block deals, mutual fund moves, bank rate changes, loan news, NPAs, brokerage rating changes.
8A. **Startup Watch:** Funding rounds, valuations, failures, acquisitions, IPO filings, "unicorn" milestones.
8B. **Rumors and Gossip:** Mix of true and false tips (player must judge; trust in source matters).
9. **Editorial / Analyst Take:** Short opinion piece with a stance that influences sentiment.

### 10.3 Article model

```ts
interface Article {
  id: string; day: number;
  section: NewsSection;
  headline: string;
  body: string;                 // 2-6 sentences generated from template + event data
  importance: 1 | 2 | 3;        // 3 = banner
  tags: (PersonId | CompanyId | SectorId)[];
  tone: 'positive' | 'neutral' | 'negative';
  reliability: number;          // 0-1 (rumors < 1)
  sourceName: string;           // fictional outlets
  linkedEventIds: string[];
}
```

### 10.4 Generation rules

- Every engine event may create 0-n articles via `templates.json` (multiple variants per event type to avoid repetition).
- Ensure **at least 15 articles per day** even on quiet days (filler from macro, sector, gossip, analyst takes).
- Headlines link to person cards and company pages.
- News tone affects sentiment on the next day (small, bounded).
- Fictional outlets with different bias (e.g., a business daily, a tabloid, an analyst newsletter).

---

## 11. Finance Details

- **Bank loans:** Fixed rate over N days (default 12% over 100 days), tiered amounts, one active loan at a time, cooldown after repayment, may allow negative cash with penalty.
- **Fixed deposits:** Default 6% over 100 days, early withdrawal penalty.
- **IPO:** Player picks float %, price band; AI investors subscribe based on lean, trust and valuation; oversubscription raises price on listing.
- **Auctions:** Rare businesses (limited supply) sold by auction; shared ownership allowed; AI bids depend on personality and cash.
- **Alliances:** Locked for 30 days; persist only if trust and bond stay above threshold; members' net worth may count together for victory.
- **Force-buy (rival ability):** Rival may buy shares from the player-aligned holder at +20% once per 50 days (config).

---

## 12. Balance Rules and Safeguards

- All starting values in `balance.json` (default: player cash 5 crore, wife 2.5 crore, rival 5 crore, investors vary by archetype).
- AI cash buffer: AIs always keep a minimum cash reserve (10-15%).
- AI investing cap per target: 10-20% of net worth by default.
- Growth caps: Project work units and company growth scale with real headcount; no unlimited scaling.
- Market must never fully freeze: if liquidity is low, price impact increases rather than blocking trades.
- Anti-snowball: Leader's investors get impatient (profit-taking), trailing player gets sympathy investors (rubber-banding within limits).
- Run `tools/simulate.ts` for 1000 headless games per balance change, report: average game length, win rate by difficulty, rival win rate, investor behavior distribution, price volatility.
- Targets: Normal difficulty win rate 40-60%; average game length 600-1200 days.

---

## 13. Difficulty

| Level | Rival intelligence (lookahead, adaptation) | Rival aggression | Mistake rate | Investor patience | Market volatility |
|---|---|---|---|---|---|
| Easy | Shallow lookahead, slow adaptation | Low | High | High | Low |
| Normal | Medium lookahead, adapts per cycle | Medium | Medium | Medium | Medium |
| Hard | Deep lookahead, adapts weekly, uses 6+ strategies | High | Low | Low | High |
| Brutal | Deepest lookahead, fast opponent modelling, coordinates blocs, disclosed small info edge | Very high | Very low | Low | High |
| Realistic | Hard AI plus random shocks | High | Low | Low | High |

Difficulty changes **intelligence parameters only**, never the rival's starting resources (see 9B.9).

---

## 14. Persistence

- Auto-save every game day (debounced), manual save slots (min 3), export/import JSON.
- Large state: store `priceHistory` as typed arrays; compress old news.
- Save includes seed and command log (optional) to allow replay debugging.

---

## 15. Performance Requirements

- Advance 1 day in under 50 ms on a mid-range phone (engine in Worker).
- Fast-forward 60 days in under 3 seconds with UI progress indicator.
- Charts render max 400 points (downsample).
- Memory under 150 MB after 2000 days.

---

## 16. Quality and Testing

- **Unit tests:** Pricing, relationship math, lean scoring, announcement surprise, loans, IPO, save migration.
- **Invariants test (every tick in tests):** total money in the system is conserved apart from explicit sources (salaries, interest, dividends) and sinks; no negative shares; net worth equals cash + holdings + business value − debt.
- **Balance simulation** in `/tests/balance`.
- **E2E smoke:** Start a new game, advance 100 days, buy shares, open a person card, view news.
- Lint, type-check and tests must pass before each version is marked done.

---

## 17. Acceptance Criteria per Version (summary)

- **v0.1:** Tabs navigate; day advances; save/load works; dynamics toolkit (18A.1-18A.2) implemented with unit tests, and ESLint ban on `Math.random` active.
- **v0.2:** Player company produces believable financials over 100 days using the earnings model in 18A.5 (growth as a mean-reverting state, seasonality, morale/attrition, operating leverage).
- **v0.25:** Business Page for a controlled business shows demand, capacity, production, unmet demand and advisor ranges; demand moves slowly (monthly change mostly 0.5% to 3%); hires, machines and layoffs take effect after their lead times with correct costs and side effects.
- **v0.3:** Stock model per 18A.4 with the 18A.10 stock tests passing (fat tails, volatility clustering, correlation rises in stress); 24 companies trade; price charts; buying shifts price; portfolio shows daily earnings.
- **v0.4:** 30+ people listed; rival pinned top; person cards complete; AIs trade independently.
- **v0.45:** FII/DII flows visible daily and move prices; banks lend with different terms; 40+ startups progress through rounds, fail or list; Institutions and Startups tabs complete.
- **v0.5:** Relationships use the Beta-trust model and softmax lean with hysteresis (18A.6); a 60-day announcement visibly moves investor money and the lean meters; reaction logged.
- **v0.55:** Rival runs 5+ strategies per game, targets investors, counter-trades the player, adapts; AI test suite (9B.10) passes; reasoning logs readable on the Rival card.
- **v0.6:** Wife tab complete; trust changes from events; wife invests with logged reasoning.
- **v0.65:** Interaction menus work for every person; marriage satisfaction, resentment and commitment evolve from time allocation and events; rival's wife is a full AI investor; opportunities, secrets, exposure and scandals trigger from state and change investor lean, charm, stock price and (via divorce) net worth.
- **v0.7:** News page shows 10 days, ≥15 articles each, all sections populated.
- **v0.8:** Loans, FDs, IPO work and affect net worth correctly.
- **v0.85:** Deals run through every pipeline stage; due diligence reveals hidden items probabilistically; hostile tenders and defences work; 40% to 60% of acquisitions destroy acquirer value over 24 months in balance sims; the rival can propose a partnership to the wife's company and relationship effects follow.
- **v0.9:** Dashboard shows all required panels, charts update smoothly.
- **v1.0:** 20 full playthroughs without crashes; balance targets met; PWA installable.

---

## 18. Content Requirements

- 24+ listed companies across 8 sectors (e.g., Technology, Pharma, Banking and Finance, Energy, Real Estate, Consumer Goods, Manufacturing, Media and Entertainment), with fictional but Indian-flavoured names.
- 8-12 FII entities, 8-12 DII entities (fictional names), 6-8 banks, 40+ startups with founders.
- 30+ named AI people with bio, archetype, sector focus, city, starting wealth.
- 150+ news templates (at least 5 variants per major event type).
- Fictional media outlets (6+).
- All text in English initially; keep strings in a single file for future translation (Hindi later).

---

## 18A. Dynamic Simulation Math and Reference Code (MANDATORY)

> **Why this section exists:** Default LLM-written simulations use fixed ranges (`Math.random() * 10 - 5`), constant volatility, independent coin flips and static probabilities. The result feels dead: prices jitter around nothing, relationships climb in straight lines, earnings look like noise. **Everything below replaces that.** Treat the code in this section as the reference implementation; adapt names to the codebase, but keep the mathematics.
>
> Files live in `/src/engine/dynamics/`. Every system in the game (stocks, earnings, relationships, flows, strategies) must call these primitives. **Never call `Math.random()` anywhere in `/src/engine`** (add the ESLint rule in 18A.11).

### 18A.0 Principles ("how to make it feel alive")

1. **State-dependent randomness.** Noise size, jump chance and reaction strength depend on current state (volatility regime, stress, uncertainty), never on constants.
2. **Parameters are states too.** Volatility, growth targets, correlations, thresholds and even personality weights drift slowly over time (mean-reverting random processes).
3. **Memory and hysteresis.** Past events keep influencing the present (volatility clustering, grudges, momentum), and switching sides has a cost.
4. **Fat tails.** Use Student-t, Laplace and jump processes. Rare big events must happen, but not on a schedule.
5. **Feedback loops.** Price moves change sentiment, sentiment changes flows, flows change prices; trust changes lean, lean changes money, money changes performance, performance changes trust.
6. **Asymmetry.** Bad news weighs more than good news. Trust is slow to build and fast to break. Crashes are faster than rallies.
7. **Correlation that changes.** Stocks move together, and much more so during stress.
8. **No fixed ranges, no fixed schedules, no repeated values.** Outputs come from distributions whose parameters are computed from the world state each day.
9. **Heterogeneity.** Every company, person and institution has its own parameters generated from distributions (no two alike).
10. **Everything seeded and reproducible.** Named RNG streams per entity per day (18A.1).

### 18A.1 RNG toolkit (`dynamics/rng.ts`)

```ts
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

  beta(a: number, b: number): number { const x = this.gamma(a), y = this.gamma(b); return x / (x + y); }

  // Fat-tailed shocks. nu = 3..6 gives realistic market tails.
  studentT(nu: number): number { return this.normal() / Math.sqrt((2 * this.gamma(nu / 2)) / nu); }

  laplace(b = 1): number { // double-exponential, jump sizes
    const u = this.next() - 0.5;
    return -b * Math.sign(u) * Math.log(Math.max(1e-12, 1 - 2 * Math.abs(u)));
  }

  lognormal(mu: number, sigma: number): number { return Math.exp(mu + sigma * this.normal()); }

  poisson(lambda: number): number { // Knuth, fine for lambda < 30
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= this.next(); } while (p > L);
    return k - 1;
  }

  pareto(xm: number, alpha: number): number { return xm / Math.pow(1 - this.next(), 1 / alpha); }
}
```

### 18A.2 Stochastic process building blocks (`dynamics/stochastic.ts`)

```ts
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// Ornstein-Uhlenbeck (mean-reverting) with EXACT discretisation, stable for any dt.
// Use for: growth rates, sentiment, volatility targets, trust drivers, macro variables.
export function ouStep(x: number, mean: number, kappa: number, sigma: number, dt: number, z: number): number {
  const e = Math.exp(-kappa * dt);
  return mean + (x - mean) * e + sigma * Math.sqrt((1 - e * e) / (2 * kappa)) * z;
}

// Markov regime switching: 0 = calm, 1 = normal, 2 = stressed.
// 'stress' (0..1) from the macro layer tilts transition probabilities, so crashes cluster and regimes persist.
export type Regime = 0 | 1 | 2;
export function nextRegime(r: Regime, stress: number, rng: Rng): Regime {
  const base = [
    [0.970, 0.028, 0.002],
    [0.020, 0.950, 0.030],
    [0.010, 0.070, 0.920],
  ];
  const row = base[r].slice();
  row[2] *= 1 + 6 * stress;   // stress makes the stressed regime likelier and stickier
  row[0] *= 1 - 0.7 * stress; // and calm less likely
  const sum = row[0] + row[1] + row[2];
  const u = rng.next() * sum;
  return u < row[0] ? 0 : u < row[0] + row[1] ? 1 : 2;
}

// Correlated normals via Cholesky. Correlations RISE with stress (diversification fails in crashes).
export function stressedCorr(base: number[][], stress: number): number[][] {
  return base.map((row, i) => row.map((c, j) => (i === j ? 1 : c + (1 - c) * 0.6 * stress)));
}
export function cholesky(A: number[][]): number[][] {
  const n = A.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(A[i][i] - sum, 1e-12)) : (A[i][j] - sum) / L[j][j];
    }
  }
  return L;
}
export function correlatedNormals(L: number[][], rng: Rng): number[] {
  const z = L.map(() => rng.normal());
  return L.map((row, i) => row.reduce((s, l, j) => s + (j <= i ? l * z[j] : 0), 0));
}

// Example: parameters drift too. Long-run variance target rises with market stress and wanders on its own.
export function driftTheta(thetaV: number, baseTheta: number, stress: number, rng: Rng): number {
  return Math.max(1e-6, ouStep(thetaV, baseTheta * (1 + 2 * stress), 0.03, baseTheta * 0.05, 1, rng.normal()));
}
```

### 18A.3 Macro engine (the common factors every stock and business feels)

Per day compute, once, in this order (all with `Rng.stream(seed,'macro',day)`):

```ts
// Factors: [market, sectorA, sectorB, ...] with base correlation matrix from sectors.json
const stress = clamp(0.5 * (marketVolPercentile) + 0.3 * fiiSellingPressure + 0.2 * creditSpreadZ, 0, 1);
const L = cholesky(stressedCorr(baseCorr, stress));
const z = correlatedNormals(L, rng);
// Market factor volatility is itself stochastic (see Heston step in 18A.4) and regime dependent
const marketShock = sigmaMkt * z[0];                   // daily market return shock
const sectorShock = Object.fromEntries(sectors.map((s, i) => [s, sigmaSector[s] * z[i + 1]]));
// Slow macro states are OU processes, not constants:
macro.rate        = ouStep(macro.rate, policyTarget, 0.8, 0.004, 1 / 365, rng.normal());
macro.inflation   = ouStep(macro.inflation, 0.05 + 0.3 * oilShockEma, 1.2, 0.006, 1 / 365, rng.normal());
macro.globalRisk  = ouStep(macro.globalRisk, 0, 2.0, 0.35, 1 / 365, rng.normal());   // drives FII risk-on/off
```

### 18A.4 Stock price model (`dynamics/stockModel.ts`)

**What it combines:** stochastic volatility (Heston-style, volatility clusters), leverage effect (price falls raise volatility), regime switching, shared market and sector factors (correlation), fat-tailed jumps tied to news, mean reversion to a fundamental value (with speed that depends on regime), order-flow price impact (square-root law with a temporary part that reverts), and sentiment momentum.

```ts
export interface StockState {
  logP: number;        // ln(price)
  v: number;           // instantaneous DAILY variance (e.g. 3.2e-4 => 1.8% daily vol)
  regime: Regime;
  sentiment: number;   // AR(1) in about [-1,1]
  tempImpact: number;  // temporary price impact still to revert
}
export interface StockParams {
  sector: string;
  betaMkt: number; betaSector: number;   // loadings on common factors
  kappaV: number;   // variance mean-reversion per day      (~0.05)
  thetaV: number;   // long-run daily variance (drifts via driftTheta, ~3e-4)
  xi: number;       // vol-of-vol in daily-variance units   (~0.0025)
  rho: number;      // price/vol correlation (leverage)     (~-0.6)
  kappaP: number;   // pull toward fundamental value /day   (~0.015, half-life ~45 days)
  jumpBase: number; // base jump intensity per day          (~0.01)
  impactY: number;  // impact coefficient                   (~0.8)
  adv: number;      // average daily volume in shares
}
export interface StockEnv {
  marketShock: number; sectorShock: Record<string, number>; marketStress: number;
  newsTone: number;        // -1..1 net tone of today's company news
  newsIntensity: number;   // 0..3 how much company news today
  netFlowShares: number;   // signed net order flow today (all participants incl. FII/DII/player/rival)
  fundamentalValue: number;
}

export function stepStock(s: StockState, p: StockParams, env: StockEnv, rng: Rng) {
  // 1) Regime and variance (Heston with full truncation, correlated shocks)
  const regime = nextRegime(s.regime, env.marketStress, rng);
  const volMult = [0.75, 1.0, 2.3][regime];
  const zP = rng.normal();
  const zV = p.rho * zP + Math.sqrt(1 - p.rho * p.rho) * rng.normal();
  const vPos = Math.max(s.v, 1e-8);
  const v = Math.max(1e-8, s.v + p.kappaV * (p.thetaV * volMult - vPos) + p.xi * Math.sqrt(vPos) * zV);
  const sigma = Math.sqrt(vPos);

  // 2) Common factors (creates correlation across stocks) + own diffusion
  const common = p.betaMkt * env.marketShock + p.betaSector * (env.sectorShock[p.sector] ?? 0);
  const idio = sigma * zP;

  // 3) Mean reversion toward fundamentals (slower in stressed regimes, markets overshoot)
  const gap = Math.log(env.fundamentalValue) - s.logP;
  const pull = p.kappaP * (regime === 2 ? 0.4 : 1) * clamp(gap, -0.7, 0.7);

  // 4) Jumps: intensity grows with news; sizes are fat-tailed and tone-biased
  const lambda = p.jumpBase + 0.12 * env.newsIntensity + 0.05 * env.marketStress;
  let jump = 0;
  const n = rng.poisson(lambda);
  for (let i = 0; i < n; i++) jump += rng.laplace(0.02) + 0.015 * env.newsTone;

  // 5) Order-flow impact (square-root law): permanent + temporary part that reverts later
  const q = env.netFlowShares;
  const impact = p.impactY * sigma * Math.sign(q) * Math.sqrt(Math.abs(q) / p.adv);
  const permanent = 0.65 * impact, temp = 0.35 * impact;

  // 6) Sentiment momentum (AR(1), driven by news and by its own past)
  const sentiment = clamp(0.9 * s.sentiment + 0.1 * env.newsTone + 0.02 * rng.normal(), -1, 1);

  // 7) Total log return, with circuit breaker (+/-10%)
  let r = pull + common + idio + jump + permanent + temp - 0.5 * s.tempImpact + 0.0015 * sentiment - 0.5 * vPos;
  r = clamp(r, Math.log(0.9), Math.log(1.1));

  return {
    next: { logP: s.logP + r, v, regime, sentiment, tempImpact: 0.5 * s.tempImpact + temp } as StockState,
    logReturn: r,
  };
}
```

**Fundamental value** (two-stage per-share valuation, so value moves when earnings, growth, rates or risk change):

```ts
export function fundamentalPerShare(
  eps: number, growth: number,
  risk: { rf: number; erp: number; leverage: number; quality: number },
  opts = { terminalG: 0.045, years: 8, fcfConv: 0.7 }
): number {
  const r = Math.max(0.06, risk.rf + risk.erp * (1 + 0.35 * risk.leverage) - 0.015 * risk.quality);
  const gT = Math.min(opts.terminalG, r - 0.02);
  let e = Math.max(eps, 0.02), pv = 0;
  for (let t = 1; t <= opts.years; t++) {
    const g = gT + (growth - gT) * (1 - (t - 1) / opts.years); // growth fades to terminal
    e *= 1 + g;
    pv += (opts.fcfConv * e) / Math.pow(1 + r, t);
  }
  const tv = (opts.fcfConv * e * (1 + gT)) / (r - gT) / Math.pow(1 + r, opts.years);
  return pv + tv;
}
// If eps <= 0 (loss-making startup/listed firm), value on revenue per share x a growth-adjusted multiple instead.
```

**Why it feels dynamic:** quiet periods followed by violent ones (volatility clustering), crashes that start small and snowball, rallies that fade, sector rotations, stocks that diverge for months and then snap back to value, and price reactions that differ between a thinly traded and a liquid stock.

### 18A.5 Business earnings model (`dynamics/earningsModel.ts`)

**Revenue = slow-moving trend (growth rate itself mean-reverts and is pushed by quality, sector boom, competition, rates) x seasonality x demand shocks x market-share dynamics.** Costs have fixed and variable parts (operating leverage), labour capacity, overtime, morale and attrition, experience-curve productivity, and wage inflation.

```ts
export interface BizState {
  trendRev: number;     // trend daily revenue
  g: number;            // annualised growth rate (a state, not a constant)
  share: number;        // market share (0..1)
  attract: number;      // product attractiveness index
  quality: number;      // 0..1
  morale: number;       // 0..1
  headcount: number; wage: number; fixedCost: number;
  cumUnits: number;     // cumulative output (experience curve)
}
export interface BizParams {
  baseGrowth: number;   // ~0.10 / yr
  kappaG: number;       // ~2.5 / yr  (growth mean reversion)
  sigmaG: number;       // ~0.08      (growth volatility)
  sigmaR: number;       // ~0.15 per sqrt(year)  (revenue shock scale)
  vcRate: number;       // variable cost ratio (0.25..0.65)
  revPerHead: number;   // revenue capacity per employee per day
  learnExp: number;     // experience-curve exponent (~0.15)
  attritionBase: number;// yearly attrition at morale 0.5 (~0.12)
  seasonAmp: [number, number]; seasonPhase: [number, number];
}
export interface BizEnv {
  sectorBoom: number; rate: number; inflation: number;
  competition: number; rivalAttract: number; demandShock: number; // demandShock: macro/sector demand surprise
}

export function stepBusiness(b: BizState, p: BizParams, env: BizEnv, rng: Rng, day: number) {
  const dt = 1 / 365;

  // 1) Growth target depends on the world; growth rate follows OU toward it
  const gT = p.baseGrowth + 0.9 * (b.quality - 0.5) + 0.7 * env.sectorBoom
           - 0.5 * env.competition - 0.4 * Math.max(0, env.rate - 0.06) + 0.3 * (b.morale - 0.5);
  const g = ouStep(b.g, gT, p.kappaG, p.sigmaG, dt, rng.normal());

  // 2) Market-share dynamics (logistic): attractiveness gap vs rivals moves share, with inertia and noise
  const edge = b.attract - env.rivalAttract;
  const share = clamp(b.share + 0.02 * b.share * (1 - b.share) * edge + 0.0008 * rng.normal(), 0.001, 0.95);
  const shareAdj = Math.sqrt(share / b.share);

  // 3) Trend revenue: fat-tailed shocks + demand shocks
  const shock = p.sigmaR * Math.sqrt(dt) * rng.studentT(5) + env.demandShock * 0.01;
  const trendRev = b.trendRev * Math.exp((g - 0.5 * p.sigmaR * p.sigmaR) * dt + shock) * shareAdj;

  // 4) Seasonality (two harmonics, company-specific phase)
  const t = 2 * Math.PI * (day / 365);
  const season = 1 + p.seasonAmp[0] * Math.sin(t + p.seasonPhase[0]) + p.seasonAmp[1] * Math.sin(2 * t + p.seasonPhase[1]);
  const revenue = trendRev * season;

  // 5) Capacity, overtime, morale, attrition
  const productivity = (1 + b.cumUnits / 1e4) ** p.learnExp * (0.8 + 0.4 * b.morale);
  const capacity = b.headcount * p.revPerHead * productivity;
  const utilisation = revenue / Math.max(capacity, 1);
  const wage = b.wage * (1 + env.inflation * dt + 0.0002 * rng.normal());
  const labour = b.headcount * wage;
  const overtime = Math.max(0, utilisation - 1) * labour * 0.5;     // overworked teams cost more
  const moraleTarget = 0.5 + 0.5 * Math.tanh(2 * (1 - utilisation)); // overload hurts, slack helps (up to a point)
  const morale = clamp(b.morale + 0.02 * (moraleTarget - b.morale) + 0.004 * rng.normal(), 0, 1);
  const hazard = p.attritionBase * Math.exp(-3 * (morale - 0.5));    // per year
  const leavers = Math.min(b.headcount, rng.poisson(b.headcount * hazard * dt));

  // 6) Costs and earnings (operating leverage emerges from fixed + labour vs revenue)
  const variable = p.vcRate * revenue * (1 + 0.5 * Math.max(0, env.inflation - 0.05));
  const fixed = b.fixedCost * (1 + env.inflation * dt);
  const ebitda = revenue - labour - overtime - variable - fixed;

  return {
    next: { ...b, g, share, trendRev, morale, headcount: b.headcount - leavers, wage, fixedCost: fixed,
            cumUnits: b.cumUnits + revenue / 1000 } as BizState,
    daily: { revenue, labour, overtime, variable, fixed, ebitda, utilisation, leavers },
  };
}
```

**Projects (non-fixed jobs, `dynamics/projects.ts`):**

```ts
export function generateProject(rng: Rng, ctx: { marketing: number; heat: number }) {
  const size = rng.lognormal(Math.log(40), 0.6);                          // work units, heavy right tail
  const payoutPerUnit = rng.lognormal(Math.log(1 + 0.5 * ctx.heat), 0.25) * (0.85 + 0.3 * ctx.marketing);
  const clientDefaultRisk = Math.min(0.35, Math.abs(rng.laplace(0.04)));
  const deadline = Math.round(size / (2.5 * (0.7 + 0.6 * rng.next())) + 7);
  return { size, payoutPerUnit, clientDefaultRisk, deadline, progress: 0 };
}
// Each day: progress += teamUnits * efficiency; with hazard h = 0.02 + 0.03*(utilisation-1)+ scope creep:
// progress -= 0.1*size (rework). On delivery: payout = size*payoutPerUnit, minus a client default draw.
// Late delivery applies a penalty that grows with days late (non-linear), and lowers client relationship.
```

**Announcement surprise and market reaction (every 60 days):**

```ts
export function analystConsensus(trendEps: number, analystBias: number, analystNoise: number, rng: Rng) {
  // analysts anchor on the smooth trend, not on the lumpy truth, and are biased and noisy
  const forecasts = Array.from({ length: 8 }, () => trendEps * (1 + analystBias + analystNoise * rng.normal()));
  const mean = forecasts.reduce((a, b) => a + b, 0) / forecasts.length;
  const sd = Math.sqrt(forecasts.reduce((a, b) => a + (b - mean) ** 2, 0) / (forecasts.length - 1));
  return { mean, dispersion: Math.max(sd, 0.02 * Math.abs(mean)) };
}
export const standardisedSurprise = (actual: number, mean: number, disp: number) => (actual - mean) / disp;

export function announcementReaction(sue: number, charm: number, guidanceTone: number) {
  // saturating reaction, amplified by charm, plus post-announcement drift over ~10 days
  const immediate = 0.06 * Math.tanh(0.8 * sue) * (1 + 0.3 * (charm - 50) / 50) + 0.02 * guidanceTone;
  const drift = Array.from({ length: 10 }, (_, k) => 0.35 * immediate * Math.pow(0.8, k));
  return { immediate, drift };
}
```
Feed `immediate` and `drift` into `env.newsTone`/`newsIntensity` and the jump term of the stock model, and into investors' lean update (18A.6).

### 18A.6 Dynamic relationships (`dynamics/trustModel.ts`)

**Model:** Trust is a **Beta distribution** (`alpha` = accumulated positive evidence, `beta` = negative). Its mean is the trust level and its variance is **uncertainty** (new relationships swing wildly, mature ones are stable). Updates are driven by **surprise** (expectation violation), with negativity bias, betrayal shocks, slow forgetting, grudges, diminishing returns on bond, and third-party gossip.

```ts
export interface Rel {
  alpha: number; beta: number;   // trust posterior (start at 1,1 or a prior from personality)
  respect: number;               // 0..100 (competence perception)
  bond: number;                  // 0..100 (emotional/personal link)
  grudge: number;                // 0..1 slow-decaying negative memory
  lastContactDay: number;
}
export interface Persona { negBias: number; forgiveness: number; gullibility: number; loyalty: number; } // each ~0.5..1.5 or 0..1
export interface RelEvent { kind: string; valence: number; salience: number; publicity: number; day: number; } // valence -1..1

export const trustMean = (r: Rel) => r.alpha / (r.alpha + r.beta);
export const trustUncertainty = (r: Rel) => { const n = r.alpha + r.beta; return (r.alpha * r.beta) / (n * n * (n + 1)); };

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
    ? clamp(r.bond + 6 * e.valence * e.salience * (1 - r.bond / 100), 0, 100)       // diminishing returns near the top
    : clamp(r.bond * (1 - 0.35 * -e.valence * e.salience * betrayal), 0, 100);      // multiplicative drop
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
    bond: r.bond * Math.exp(idle > 14 ? -0.004 : -0.0005),         // neglected relationships cool
    grudge: r.grudge * Math.exp(-0.003 * pers.forgiveness),
    respect: 50 + (r.respect - 50) * 0.999,                        // slow regression to neutral
  };
}

// Gossip / reputation contagion (DeGroot with stubbornness). Reuse applyEvent with a weak pseudo-event:
export function gossipEvent(avgNeighbourTrust: number, stubborn: number, day: number): RelEvent {
  return { kind: 'gossip', valence: 2 * avgNeighbourTrust - 1, salience: 0.1 * (1 - stubborn), publicity: 0, day };
}
```

**Event valence examples (do not hardcode outcomes, compute them):**

```
Player beats announcement:  valence = tanh(0.8*SUE) * (0.6 + 0.4*investor.dataSensitivity)
Player misses guidance he set boldly: valence = -min(1, 0.4 + 0.6*|SUE|) * boldnessOfGuidance
Rival leaks rumour about player (believed with prob = source reliability * (1 - investor.skepticism)):
    valence = -0.3 * believed, salience = 0.4
Meeting: valence = (charm/100 - 0.5) * 1.2 + noise(0.15) ; salience = 0.5
Broken promise: valence = -0.9, salience = 0.8, publicity by news coverage
Profit from holding the person's stock: valence = tanh(returnOverPeriod / 0.15)
```

**Lean, switching cost and the wavering investor (`dynamics/lean.ts`):**

```ts
export function chooseLean(
  scores: Record<string, number>,                // utility of backing each target (player, rival, neutral...)
  current: string | null,
  pers: { patience: number; loyalty: number; temp: number },  // temp ~0.15 (decisive) .. 0.6 (erratic)
  bondToCurrent: number, rng: Rng
): string {
  const hysteresis = 0.15 + 0.5 * pers.loyalty + 0.3 * pers.patience + 0.4 * (bondToCurrent / 100);
  const adj = Object.entries(scores).map(([k, v]) => [k, v + (k === current ? hysteresis : 0)] as const);
  const m = Math.max(...adj.map(a => a[1]));
  const w = adj.map(([k, v]) => [k, Math.exp((v - m) / pers.temp)] as const);
  const total = w.reduce((a, b) => a + b[1], 0);
  let u = rng.next() * total;
  for (const [k, x] of w) { u -= x; if (u <= 0) return k; }
  return current ?? adj[0][0];
}
```
(Softmax sampling means close calls are genuinely uncertain and a leader can still lose a wavering investor on a bad day, while hysteresis prevents flip-flopping every day.)

**Money flows with herding (self-exciting / Hawkes-style) and Kelly sizing:**

```ts
// A big investor's buy raises the chance that others follow in the next days (herding), then decays.
export function flowStep(excite: number, mu: number, eventImpulse: number, alpha = 0.8, decay = 0.25) {
  const next = excite * Math.exp(-decay) + alpha * eventImpulse;
  return { excite: next, intensity: mu + next };
}
// orders today ~ Poisson(intensity); sizes ~ rng.pareto(minSize, 1.6) (a few huge orders, many small)

// Position sizing: shrunk fractional Kelly with confidence and personality
export function targetWeight(muHat: number, rf: number, sigma: number, gamma: number, confidence: number, maxW: number) {
  const f = (muHat - rf) / (gamma * sigma * sigma);   // gamma = risk aversion (2..8)
  return clamp(f * confidence * 0.5, 0, maxW);        // half-Kelly scaled by confidence in [0,1]
}
```

### 18A.7 Dynamic strategy selection for the rival (`ai/core/bandit.ts`)

**Idea:** the rival keeps a **belief about how well each strategy works against THIS player** (Beta posteriors with forgetting, Thompson sampling), blends it with situational fit and cost, penalises recent overuse (so he is **not predictable**), and samples via softmax rather than always taking the maximum. Smarter AIs have a lower temperature and a deeper lookahead.

```ts
export interface StrategyStat { alpha: number; beta: number; lastUsedDay: number; }
export interface Strategy {
  id: string; cooldown: number; cost: number;
  fit(ctx: Ctx): number;          // 0..1 how well the situation suits it (logistic of features)
  payoff(ctx: Ctx): number;       // expected utility if it works
}

export function chooseStrategies(
  strategies: Strategy[], stats: Record<string, StrategyStat>, ctx: Ctx,
  budget: number, intelligence: number /*0..1*/, k: number, rng: Rng
): Strategy[] {
  const T = 0.5 * (1 - 0.6 * intelligence) + 0.05;                    // lower temperature = more decisive
  const scored = strategies.map(s => {
    const st = stats[s.id];
    const belief = rng.beta(st.alpha, st.beta);                        // Thompson sample of "works vs this opponent"
    const fatigue = Math.exp(-(ctx.day - st.lastUsedDay) / s.cooldown); // recent use => predictable => penalised
    const u = 0.35 * belief + 0.30 * s.fit(ctx) + 0.25 * Math.tanh(s.payoff(ctx))
            - 0.20 * fatigue - 0.15 * (s.cost / Math.max(budget, 1));
    return { s, u };
  });
  const chosen: Strategy[] = [];
  const pool = scored.slice();
  while (chosen.length < k && pool.length) {                           // sample WITHOUT replacement via softmax
    const m = Math.max(...pool.map(p => p.u));
    const w = pool.map(p => Math.exp((p.u - m) / T));
    let x = rng.next() * w.reduce((a, b) => a + b, 0), i = 0;
    for (; i < w.length; i++) { x -= w[i]; if (x <= 0) break; }
    chosen.push(pool.splice(Math.min(i, pool.length - 1), 1)[0].s);
  }
  return chosen;
}

// Learning with forgetting (the player adapts, so old evidence ages out)
export function updateStat(st: StrategyStat, success: number /*0..1 graded outcome*/, day: number, forget = 0.98): StrategyStat {
  return {
    alpha: 1 + (st.alpha - 1) * forget + success,
    beta: 1 + (st.beta - 1) * forget + (1 - success),
    lastUsedDay: day,
  };
}
```

**Lookahead with common random numbers and downside risk (`ai/core/lookahead.ts`):**

```ts
export function evaluateAction(state: GameState, actorId: string, action: Action, seed: number, N = 16, horizon = 10, riskAversion = 0.5) {
  const outcomes: number[] = [];
  for (let i = 0; i < N; i++) {
    const sim = cloneLight(state);                       // copy only the slices the simulation touches
    applyAction(sim, actorId, action);
    const rng = Rng.stream(seed, `rollout:${i}`, state.day); // SAME stream index for every candidate = common random numbers
    for (let d = 0; d < horizon; d++) simulateDayLite(sim, rng);   // simplified engine, same math as 18A.4/18A.5
    outcomes.push(utility(sim, actorId));                // net worth gain + investor support + position safety
  }
  outcomes.sort((a, b) => a - b);
  const mean = outcomes.reduce((a, b) => a + b, 0) / N;
  const worst = outcomes.slice(0, Math.max(1, Math.floor(N * 0.2)));
  const cvar = worst.reduce((a, b) => a + b, 0) / worst.length;   // mean of the worst 20%
  return mean - riskAversion * (mean - cvar);
}
```
Common random numbers mean differences between candidate actions reflect the actions, not luck, so 16 rollouts are enough.

### 18A.8 Putting it together: the daily tick order

```
1. macro:      rng = stream('macro')        → stress, correlated factor shocks, macro OU states
2. news:       events from yesterday + scheduled (announcements) → company newsTone/newsIntensity
3. business:   for each company: stepBusiness → daily P&L, projects, hiring/attrition;
               for each Business Page: stepDemand → stepMarketPrice → stepOperations (9C); advance decision queues (hires, machines)
4. people:     relDaily() for all relationships; apply today's events (applyEvent); gossip;
               life: stepMarriage, stepAttraction, opportunity events, NPC drift decisions, exposureHazard for every Secret, scandals (9E);
               deals: advance M&A pipeline stages, votes, tenders, integration (9D)
5. decisions:  AIs run the pipeline (9B.1): perceive → strategies (18A.7) → rollouts → commands
6. flows:      aggregate all orders → netFlowShares per company (Hawkes herding for investors)
7. prices:     for each company: fundamentalPerShare → stepStock
8. settle:     cash, dividends, margin calls, loans, net worth, history series
9. news:       generate daily report from the events of this tick
10. save:      autosave
```
Each system reads yesterday's state of the others, so updates do not depend on code execution order beyond this fixed pipeline.

### 18A.9 Recommended starting parameters (put in `balance.json`; vary per entity)

| Parameter | Typical | Per-entity variation |
|---|---|---|
| Stock daily vol (sqrt of thetaV) | 1.2% to 2.5% | lognormal sigma 0.3 by sector |
| kappaV / xi / rho | 0.05 / 0.0025 / -0.6 | rho in [-0.8,-0.3] |
| kappaP (value pull) | 0.015 per day | 0.008 to 0.03 |
| Jump intensity | 0.01 per day | 0.005 to 0.03 |
| betaMkt / betaSector | 0.6-1.4 / 0.4-1.1 | per company |
| Business growth OU (kappaG, sigmaG) | 2.5 / 0.08 | sector dependent |
| Revenue shock sigmaR | 0.10-0.30 | startups 0.4+ |
| Attrition base | 12% per year | by sector |
| Trust prior | Beta(1,1) or personality-based | Loyalist (2,1), Skeptic (1,2) |
| Lean temperature | 0.15 to 0.6 | by personality |
| Rival lookahead (N, horizon) | 16, 10 (Normal); 32, 20 (Brutal) | |

**Heterogeneity rule:** generate every entity's parameters at game start from these distributions using the seed, and let the slow ones drift (18A.2 `driftTheta`, OU on growth targets, personalities shifting slightly after big life events).

### 18A.10 Anti-"fixed randomness" tests (must pass, `/tests/dynamics`)

Run a 3000-day headless simulation with 5 seeds and assert:

| Test | Expected |
|---|---|
| Daily return kurtosis (per stock) | 4 to 15 (fat tails; a normal distribution is 3) |
| Autocorrelation of absolute returns, lags 1-10 (mean) | greater than 0.10 (volatility clustering) |
| Autocorrelation of raw returns lag 1 | between -0.08 and +0.10 (no easy pattern) |
| Same-sector return correlation | 0.35 to 0.75; cross-sector 0.10 to 0.45 |
| Correlation in stressed regime vs calm | higher by at least 0.15 |
| Max drawdown across stocks | at least one stock below -35% and no stock below -95% per 3000 days on average |
| Earnings surprise stdev over time | varies by company and by period (not constant); coefficient of variation > 0.3 |
| Revenue growth autocorrelation (60-day) | positive, 0.2 to 0.7 |
| Trust series | autocorrelated, contains at least one regime break per 500 days for active relationships; mean-reverting only with long idle |
| Lean flip count | investors flip sides rarely (0-6 times per 600 days) but not zero; Opportunists flip more than Loyalists |
| Strategy entropy of the rival over 100 days | at least 1.5 bits (not repeating one strategy) |
| Different seeds | price paths correlation across seeds near 0 (below 0.1) |
| Same seed twice | bit-identical results |
| Distinct entities | no two companies share the same path; parameter stdev per field above a floor |

```ts
// example (Vitest)
it('returns are fat-tailed and cluster in volatility', () => {
  const r = simulateReturns({ seed: 7, days: 3000, company: 'C01' });
  expect(kurtosis(r)).toBeGreaterThan(4);
  expect(meanAutocorr(r.map(Math.abs), 10)).toBeGreaterThan(0.10);
});
```

**Tests for Sections 9C to 9E (also required):**

| Test | Expected |
|---|---|
| Demand: median absolute monthly change; share of days with change above 0.5% | 0.5% to 3%; under 1% of days |
| Demand regime persistence | average regime length of 4 to 12 months |
| Capacity addition | production responds only after lead time plus ramp; ramp is gradual |
| Unmet demand feedback | prolonged shortage lowers share; adding capacity restores it slowly |
| Advisor calibration | realised payback falls inside the advisor's P10 to P90 about 80% of the time (over 500 simulated decisions) |
| M&A outcomes (1000 deals) | 40% to 60% destroy acquirer value after 24 months; mean premium 25% to 40%; hostile success 30% to 45% |
| Due diligence | more spend finds more hidden items; unfound items cause later write-downs |
| Marriage dynamics | neglect lowers satisfaction within weeks; repair actions raise it slowly; resentment decays slower than it grows |
| Scandal engine | exposure probability rises with publicness and rival surveillance; cover-up discovery multiplies severity; secrets are never exposed on a fixed schedule |
| NPC drift decisions | wife or rival's wife act on opportunities rarely in healthy marriages and more often when satisfaction is low and a partnership exists |

`tools/dynamicsReport.ts` prints all these statistics plus histograms so a human can eyeball the "feel" after each balance change.

### 18A.11 Guardrails for the builder (enforce in lint and review)

```jsonc
// .eslintrc: forbid raw randomness and wall-clock time inside the engine
{
  "overrides": [{
    "files": ["src/engine/**/*.ts"],
    "rules": {
      "no-restricted-properties": ["error",
        { "object": "Math", "property": "random", "message": "Use Rng from dynamics/rng.ts" },
        { "object": "Date", "property": "now", "message": "Use game clock" }]
    }
  }]
}
```

Also forbidden in the engine: constant volatility, probabilities that never change, `if (random < 0.3)` style fixed coin flips, linear +N per event updates to trust/bond, uniform ranges for money amounts, and per-day loops that treat all companies identically. If a system needs "some randomness", it must pick a distribution from 18A.1, state what drives its parameters, and add a test from 18A.10.

---

## 19. Out of Scope (for now)

Multiplayer, real-money anything, real company names, real people, retro/arcade-style graphics, 3D.

---

## 20. First Task for the Builder Agent

1. Create the folder structure in Section 4.
2. Implement **v0.1 Foundation** completely (project scaffold, theme, tab shell, clock, seeded RNG, save/load, worker bridge).
3. Write `docs/versions/v0.1.md` summarising what was built and any decisions.
4. Stop and wait for review before starting v0.2.
