# Changelog

All notable changes to Empire Ledger are documented in this file.

---

## [0.3.0] - Market & Equity Trading

### Added
- **24 Listed Companies across 8 Sectors (`/src/data/config/companies.json`)**:
  - Technology, Pharma, Banking, Energy, Real Estate, FMCG, Manufacturing, Media (3 companies each).
  - Pre-seeded 30-day realistic price histories and fundamentals (P/E ratio, dividend yield, market cap, beta, ADV).
- **Section 18A Stock Price Simulation (`/src/engine/market/`)**:
  - Heston-style stochastic volatility with vol-of-vol, leverage effect ($\rho$), and mean reversion.
  - Markov regime switching (Calm, Normal, Stressed) with stressed correlation matrix expansion via Cholesky decomposition.
  - Square-root order impact law ($0.65\times$ permanent, $0.35\times$ temporary impact) with daily $\pm 10\%$ circuit limit clamps.
  - Daily Empire 24 Index calculation tracking market-cap weighted performance.
- **Order Matching & Trading Desk**:
  - `BUY_SHARES` and `SELL_SHARES` engine commands with cash conservation and 0.1% STT/brokerage fee.
  - Interactive Trading Modal with real-time slippage impact calculation and quick share presets.
  - Interactive SVG price chart with gradient fills, gridlines, min/max bounds, and responsive touch controls.
  - Sparkline charts on all listed company cards.
- **Portfolio Tracking**:
  - Dedicated "My Portfolio" view tracking total invested, current valuation, unrealized P&L, today's gain, and individual holding breakdown.
  - "Wife's Portfolio" peek showing Ananya Mehta's independent value-investing holdings.
  - Daily dividend payouts credited directly to cash balance.
- **Statistical Dynamics Tests (`tests/dynamics/stockModel.test.ts` & `tests/engine/market.test.ts`)**:
  - Verifies kurtosis, volatility clustering, noise properties, and 100-day simulation stability.

### Fixed
- **EBITDA Enterprise Valuation Spike Bug (7,000+ Cr)**:
  - Eliminated single-day lump-sum milestone multiplier bug where a single day's project completion was multiplied by 365.
  - Switched to rolling 30-day trailing average run rate (`history30d`).
  - Added 90%/10% Exponential Moving Average (EMA) smoothing and strict $\pm 6\%$ daily valuation circuit clamps.
  - Added automated sanity assertions ensuring enterprise valuation remains realistic under continuous gameplay.

### Added
- **Founder Setup & Onboarding Registry**:
  - Interactive startup modal allowing players to customize founder name, city, flagship company, and upload personal photos for the player, wife, and rival.
  - Image upload support storing lightweight data URLs directly in state and persistence.
- **Player Flagship Company & Departments (`/src/engine/company/`)**:
  - 6 Departments: Marketing, HR, Operations, R&D, Finance, Management with tunable daily budgets.
  - Full Employee system with skills (1-10), daily salaries, morale tracking, and hire/fire/train/promote commands.
  - Client project pipeline with work unit progression, deadline tracking, client default risk, and major revenue milestones.
  - Proprietary product lines generating recurring daily income with Section 7.2 volatility caps.
  - Financial statements: Comprehensive Daily P&L and Balance Sheet with 12x EBITDA corporate valuation.
- **Company Tab Redesign**:
  - Sub-navigation for Overview & P&L, Departments Hub, Workforce Management, Projects Pipeline, Products, and Strategy Levers.
- Unit tests in `tests/engine/company.test.ts` verifying 100-day company operations.

---

## [0.1.0] - Foundation

### Added
- Complete project foundation: Vite, React 18, TypeScript (strict mode), Tailwind CSS, Zustand, Immer, Vitest.
- Headless simulation engine (`/src/engine`) with zero React/DOM dependencies.
- Mandatory dynamics math toolkit (`/src/engine/dynamics/`):
  - `Rng` class with Mulberry32 seeded PRNG, FNV-1a stream hasher, Normal (Box-Muller), Gamma (Marsaglia-Tsang), Beta, Student-t, Laplace, Lognormal, Poisson, and Pareto distributions.
  - Stochastic primitives: Ornstein-Uhlenbeck (exact discretization), Markov regime switching, Cholesky decomposition, and stressed correlation.
  - Mathematical models scaffolding: `stockModel.ts`, `earningsModel.ts`, `projects.ts`, `trustModel.ts`, `lean.ts`, and `stats.ts`.
- Core game clock with day/slot advancement, calendar dates (starting Jan 1, 2026), weekends, and 60-day announcement cycle tracking.
- Save & Load system with IndexedDB multi-slot persistence, localStorage fallback, and JSON export/import.
- Web Worker simulation bridge architecture for off-thread fast computation.
- Mobile-first fintech UI shell:
  - Top bar with game clock, day/slot counters, net worth, cash, and announcement countdown.
  - Day skipper controls (Advance Slot, Advance Day, Skip 7 Days, Auto-play with 1x/2x/4x speeds).
  - Bottom navigation bar on mobile with "More" sheet and desktop responsive layout.
  - Tab shell: Dashboard, Company, Market, People, Institutions, Startups, Wife, News, Finance, Settings.
  - Working Settings tab with save slots (Slot 1, 2, 3), JSON export/import, theme toggle (Dark/Light), Indian number formatting toggle (Lakh/Crore vs Millions/Billions).
- Unit tests for RNG distributions, stochastic processes, clock, and save serialization.
- ESLint rule banning `Math.random` and `Date.now` in `src/engine/**/*.ts`.
- GitHub Actions workflow for automatic deployment to GitHub Pages.
