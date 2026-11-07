import { describe, it, expect } from 'vitest';
import { createInitialState, tick, reduce } from '../../src/engine';

describe('Market Engine and Trading (v0.3)', () => {
  it('initializes with 24 listed companies across 8 sectors', () => {
    const state = createInitialState(1001);
    const listed = Object.values(state.companies).filter(c => c.listed);
    expect(listed.length).toBe(24);

    const sectors = new Set(listed.map(c => c.sector));
    expect(sectors.size).toBe(8);
    expect(state.market.indexLevel).toBeGreaterThan(20000);

    for (const c of listed) {
      expect(c.symbol).toBeDefined();
      expect(c.price).toBeGreaterThan(0);
      expect(c.sharesOutstanding).toBeGreaterThan(1000000);
      expect(c.priceHistory.length).toBeGreaterThanOrEqual(30);
    }
  });

  it('executes BUY_SHARES order with square-root price impact and cash deduction', () => {
    const s0 = createInitialState(1002);
    const targetComp = Object.values(s0.companies).find(c => c.listed && c.id === 'comp_inft')!;
    const initialCash = s0.player.cash;
    const initialPrice = targetComp.price;

    const sharesToBuy = 1000;
    const { state: s1, events } = reduce(s0, {
      type: 'BUY_SHARES',
      companyId: targetComp.id,
      shares: sharesToBuy,
    });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('SHARES_BOUGHT');

    // Player cash decreased by at least shares * initialPrice
    expect(s1.player.cash).toBeLessThan(initialCash - sharesToBuy * initialPrice * 0.99);

    // Holding exists
    const holding = s1.player.holdings.find(h => h.companyId === targetComp.id);
    expect(holding).toBeDefined();
    expect(holding!.shares).toBe(sharesToBuy);
    expect(holding!.avgCost).toBeGreaterThanOrEqual(initialPrice);

    // Price impacted upwards
    const updatedComp = s1.companies[targetComp.id];
    expect(updatedComp.price).toBeGreaterThanOrEqual(initialPrice);
  });

  it('executes SELL_SHARES order with cash credit and price impact downward', () => {
    const s0 = createInitialState(1003);
    const targetComp = Object.values(s0.companies).find(c => c.listed && c.id === 'comp_inft')!;

    // First buy
    const { state: s1 } = reduce(s0, {
      type: 'BUY_SHARES',
      companyId: targetComp.id,
      shares: 2000,
    });

    const cashAfterBuy = s1.player.cash;
    const priceAfterBuy = s1.companies[targetComp.id].price;

    // Then sell half
    const { state: s2, events: sellEvents } = reduce(s1, {
      type: 'SELL_SHARES',
      companyId: targetComp.id,
      shares: 1000,
    });

    expect(sellEvents.length).toBe(1);
    expect(sellEvents[0].type).toBe('SHARES_SOLD');
    expect(s2.player.cash).toBeGreaterThan(cashAfterBuy);

    const holding = s2.player.holdings.find(h => h.companyId === targetComp.id);
    expect(holding).toBeDefined();
    expect(holding!.shares).toBe(1000);

    // Selling shifts price downwards
    expect(s2.companies[targetComp.id].price).toBeLessThanOrEqual(priceAfterBuy);
  });

  it('rejects order with insufficient cash or shares', () => {
    const s0 = createInitialState(1004);
    const targetComp = Object.values(s0.companies).find(c => c.listed && c.id === 'comp_inft')!;

    // Try to buy 100 million shares (exceeds cash)
    const { state: sFailBuy, events: buyFailEvents } = reduce(s0, {
      type: 'BUY_SHARES',
      companyId: targetComp.id,
      shares: 100000000,
    });

    expect(buyFailEvents[0].type).toBe('TRADE_ERROR');
    expect(sFailBuy.player.cash).toBe(s0.player.cash);

    // Try to sell shares not owned
    const { state: sFailSell, events: sellFailEvents } = reduce(s0, {
      type: 'SELL_SHARES',
      companyId: targetComp.id,
      shares: 500,
    });

    expect(sellFailEvents[0].type).toBe('TRADE_ERROR');
    expect(sFailSell.player.cash).toBe(s0.player.cash);
  });

  it('simulates 100 days of market trading without crashes, NaNs, or valuation explosions', () => {
    let state = createInitialState(2026);

    // Buy a diversified portfolio
    const listed = Object.values(state.companies).filter(c => c.listed);
    const pick1 = listed[0];
    const pick2 = listed[5];

    state = reduce(state, { type: 'BUY_SHARES', companyId: pick1.id, shares: 500 }).state;
    state = reduce(state, { type: 'BUY_SHARES', companyId: pick2.id, shares: 800 }).state;

    for (let day = 1; day <= 100; day++) {
      const step = tick(state, state.seed);
      state = step.state;

      // Assertions on market index
      expect(state.market.indexLevel).toBeGreaterThan(5000);
      expect(state.market.indexLevel).toBeLessThan(100000);
      expect(Number.isFinite(state.market.indexLevel)).toBe(true);

      // Assertions on player net worth and valuation
      expect(state.player.netWorth).toBeGreaterThan(0);
      expect(Number.isFinite(state.player.netWorth)).toBe(true);

      // Verify no valuation explosion (bug hunt assertion: must remain < ₹1,000 Cr in first 100 days)
      const playerVal = state.companies['company_player'].price * state.companies['company_player'].sharesOutstanding;
      expect(playerVal).toBeLessThan(10000000000); // Strict check: < 1000 Cr

      // Verify listed stock prices are valid numbers
      for (const comp of Object.values(state.companies)) {
        expect(Number.isFinite(comp.price)).toBe(true);
        expect(comp.price).toBeGreaterThan(0);
        expect(comp.price).toBeLessThan(1000000);
      }
    }

    // After 100 days, check history
    expect(state.history.days.length).toBe(101);
    expect(state.history.marketIndex.length).toBe(101);
  });
});
