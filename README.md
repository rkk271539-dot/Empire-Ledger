# Empire Ledger — Market Tycoon

> Modern, mobile-first business & stock-market life simulation engine and game.
> Built with TypeScript, React 18, Vite, Tailwind CSS, Zustand, and a headless simulation engine.

## Overview
**Empire Ledger** is a deep economic and life-simulation tycoon game where you start as a founder in an India-grounded market, balancing company operations, stock-market trading, investor relations (charm & 60-day announcements), marriage, rival competition, institutional flows (FII/DII), and high-stakes business takeovers.

## Architecture
- **Headless Engine**: `/src/engine` has zero React/DOM dependencies and runs deterministically via seeded PRNG streams. Can execute in a Web Worker or headless CLI.
- **Dynamic Simulation Math (Section 18A)**: No fixed ranges or raw `Math.random()`. Uses Heston-style volatility, Ornstein-Uhlenbeck processes, Cholesky correlated shocks, regime switching, Beta-trust dynamics, and fat-tailed distributions (Student-t, Laplace, Pareto).
- **Mobile-First Fintech UI**: Bottom navigation with quick actions, thumb-friendly tap targets, safe-area support, tabular numerals, clean cards, and dark/light mode.
- **Persistence**: IndexedDB multi-slot storage with JSON export/import and schema migrations.

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Testing & Verification
```bash
npm run test
npm run lint
```

### Production Build
```bash
npm run build
```

## Versioning & Roadmap
- [x] **v0.1 Foundation** — Project scaffold, seeded RNG & dynamics toolkit (18A.1-18A.2), game clock, save/load, mobile-first tab shell.
- [ ] **v0.2 Economy Core** — Player company, departments, employees, revenue, cash, net worth.
- [ ] **v0.25 Business Operations** — Demand-capacity model, decisions queue, Monte Carlo advisor.
- [ ] **v0.3 Market** — 24 listed companies, 8 sectors, order-flow impact, portfolios.
- [ ] **v0.4 People** — 30+ AI businessmen/women, Rich List, person cards, rival.
- [ ] **v0.45 Institutions & Startups** — FII/DII flows, banks, venture rounds & IPOs.
- [ ] **v0.5 Investors & Charm** — Charm system, 60-day announcement cycle, lean & flows.
- [ ] **v0.55 Smart AI** — Rival strategy library, trading desk, opponent model.
- [ ] **v0.6 Wife & Trust** — Wife tab, independent portfolio, advice & offers.
- [ ] **v0.65 Personal Life & Scandals** — Social graph, marriage health, secrets & scandals.
- [ ] **v0.7 News** — 10-day comprehensive daily reports.
- [ ] **v0.8 Finance** — Loans, fixed deposits, IPO, buybacks.
- [ ] **v0.85 M&A** — Due diligence, tender offers, regulatory review, synergies.
- [ ] **v0.9 Polish** — Full dashboard, analytics, tutorial.
- [ ] **v1.0 Release** — Headless balance testing, PWA deployment.
