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
