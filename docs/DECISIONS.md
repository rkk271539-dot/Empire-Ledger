# Design Decisions Log

This document records architectural, algorithmic, and game design decisions when resolving ambiguities according to Section 0.7 of `GAME_SPEC.md`.

---

## Decision 001: Clock Sub-Slots & Tick Granularity
- **Context**: Spec defines "1 day = 1 tick. Optional 4 slots per day (Morning / Noon / Evening / Night)".
- **Choice**: Implemented 4 slots per day in state (`slot: 0 | 1 | 2 | 3`). Advancing a slot updates player action opportunities. Advancing a day executes the daily simulation tick (macro, market, earnings, people, news). Controls allow advancing single slot, skipping a day, or skipping a 7-day week.
- **Rationale**: Gives fine control for life/management events in later versions while keeping daily deterministic ticks simple and clean.

## Decision 002: Storage Strategy (IndexedDB with LocalStorage Fallback)
- **Context**: State can grow large with price history and news records.
- **Choice**: Used `idb` for IndexedDB multi-slot storage with automatic fallback to `localStorage` when running in environments without IndexedDB (e.g., node test environments or restricted webviews). Added JSON file export and import.
- **Rationale**: Maximum compatibility across mobile browsers, desktop, and testing harnesses.

## Decision 003: Deterministic RNG Streams (18A.1)
- **Context**: Need reproducible bugs, parallel execution without stream contamination, and independent streams per entity and day.
- **Choice**: Strict adherence to Mulberry32 seeded PRNG with FNV-1a hash for named streams: `Rng.stream(seed, name, day)`.
- **Rationale**: Adding new entities or modifying order of operations does not alter existing entity streams.

## Decision 004: Engine Isolation & Worker Support
- **Context**: Section 2.2: "Engine is headless. /src/engine has zero React/DOM imports."
- **Choice**: Pure TypeScript engine with message-based worker bridge (`sim.worker.ts` and `bridge.ts`). Can also run synchronously in main thread if web workers are disabled or during testing.
- **Rationale**: Keeps UI smooth at 60fps even during 60-day fast-forwards on low-powered mobile devices.

## Decision 005: Avatar & Photo Persistence
- **Context**: User requested ability to upload custom photos for player, wife, rival at game start.
- **Choice**: Implemented local FileReader conversion to base64 Data URLs with 2MB client-side limit, stored directly in the player and person state objects.
- **Rationale**: Completely offline and portable across IndexedDB saves and JSON export/import without requiring external image hosting services.

## Decision 006: Project Capacity Distribution
- **Context**: Section 7.2 and 18A.5 define work capacity and projects pipeline.
- **Choice**: Workforce capacity is calculated from Operations and R&D employees' `skill * productivity * (0.6 + 0.4 * morale)` scaled by Operations department efficiency, and distributed across active projects.
- **Rationale**: Links workforce hiring, training, and morale directly to tangible contract delivery speed and company cash flow.

## Decision 007: Enterprise Valuation Smoothing & Circuit Clamps
- **Context**: Milestone project deliveries generated large lump-sum cash payments (e.g. ₹2.5 Cr) on single days. When multiplied by 365, this artificially inflated daily EBITDA to over ₹900 Cr and valuation to ₹7,000+ Cr overnight.
- **Choice**: 
  1. Spreads revenue and EBITDA across a rolling 30-day moving window (`history30d`).
  2. Applies an Exponential Moving Average (EMA: 90% previous, 10% target) to valuation updates.
  3. Enforces a daily $\pm 6\%$ circuit clamp on enterprise valuation shifts.
- **Rationale**: Reflects realistic financial market appraisal of project-based revenue streams where single lump-sum milestones do not imply permanent 365-day recurring earnings.

## Decision 008: Square-Root Market Order Execution & Trading Fees
- **Context**: Section 18A.4 specifies square-root order-flow impact ($0.65\times$ permanent, $0.35\times$ temporary).
- **Choice**: Player orders execute at an effective price $P \times \exp(\pm 0.5 \times \text{impact})$ with permanent and temporary impact applied immediately to the stock state. A 0.1% transaction fee (brokerage + STT) is deducted on trades and configured in `balance.json`.
- **Rationale**: Prevents infinite liquidity arbitrage, reflects real-world market friction, and aligns directly with quantitative equity market microstructure.
