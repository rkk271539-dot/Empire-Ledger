import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { Company } from '../../engine/core/types';
import { calculatePortfolioSummary } from '../../engine/market/portfolio';
import { Sparkline } from '../components/PriceChart';
import { TradeModal } from '../components/TradeModal';
import {
  TrendingUp,
  TrendingDown,
  Search,
  SlidersHorizontal,
  Briefcase,
  Layers,
  Heart,
  Activity,
} from 'lucide-react';
import sectorsConfig from '../../data/config/sectors.json';

type MarketView = 'listings' | 'portfolio' | 'wife';
type SortField = 'mcap' | 'price' | 'change' | 'pe' | 'dividend';

export const MarketTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat } = useUIStore();

  const [activeView, setActiveView] = useState<MarketView>('listings');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('mcap');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [activeTradeCompany, setActiveTradeCompany] = useState<Company | null>(null);

  // Filter listed companies only
  const listedCompanies = useMemo(() => {
    return Object.values(state.companies).filter((c): c is Company => Boolean(c.listed));
  }, [state.companies]);

  // Player portfolio metrics
  const playerPortfolio = useMemo(() => {
    return calculatePortfolioSummary(state.player.holdings, state.companies);
  }, [state.player.holdings, state.companies]);

  // Wife portfolio metrics
  const wife = state.people['wife'];
  const wifePortfolio = useMemo(() => {
    return calculatePortfolioSummary(wife?.holdings || [], state.companies);
  }, [wife?.holdings, state.companies]);

  // Filtered & sorted listed companies
  const displayedCompanies = useMemo(() => {
    let result = listedCompanies;

    if (selectedSector !== 'all') {
      result = result.filter(c => c.sector.toLowerCase() === selectedSector.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.symbol && c.symbol.toLowerCase().includes(q)) ||
          c.sector.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'mcap':
          valA = a.price * a.sharesOutstanding;
          valB = b.price * b.sharesOutstanding;
          break;
        case 'price':
          valA = a.price;
          valB = b.price;
          break;
        case 'change': {
          const histA = a.priceHistory;
          const pA0 = histA.length >= 2 ? histA[histA.length - 2] : a.price;
          valA = (a.price - pA0) / pA0;

          const histB = b.priceHistory;
          const pB0 = histB.length >= 2 ? histB[histB.length - 2] : b.price;
          valB = (b.price - pB0) / pB0;
          break;
        }
        case 'pe':
          valA = a.financials.peRatio || 0;
          valB = b.financials.peRatio || 0;
          break;
        case 'dividend':
          valA = a.financials.dividendYield || 0;
          valB = b.financials.dividendYield || 0;
          break;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [listedCompanies, selectedSector, searchQuery, sortBy, sortAsc]);

  const regimeName = ['Calm', 'Normal', 'Stressed'][state.market.regime ?? 1];
  const regimeBadgeColor = [
    'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    'bg-blue-950/60 text-blue-400 border-blue-800/60',
    'bg-rose-950/60 text-rose-400 border-rose-800/60',
  ][state.market.regime ?? 1];

  const indexReturn = state.market.dailyReturn || 0;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Empire 24 Stock Exchange
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time equity market driven by Section 18A Heston stochastic volatility & order-flow impact
          </p>
        </div>

        {/* Market Status Pill */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${regimeBadgeColor}`}>
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Regime: {regimeName}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-gray-900 border-gray-800 text-gray-300">
            Fee: 0.1% STT
          </span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Empire 24 Index"
          value={state.market.indexLevel.toLocaleString()}
          change={indexReturn}
          subValue={`Day ${state.day} Close`}
        />
        <StatTile
          label="My Portfolio"
          value={formatMoney(playerPortfolio.totalCurrentValue, numberFormat)}
          change={playerPortfolio.totalInvested > 0 ? playerPortfolio.totalPnLPercent / 100 : undefined}
          subValue={playerPortfolio.totalInvested > 0 ? `Unrealized: ${formatMoney(playerPortfolio.totalUnrealizedPnL, numberFormat)}` : 'No open positions'}
        />
        <StatTile
          label="Liquid Cash"
          value={formatMoney(state.player.cash, numberFormat)}
          subValue="Available to deploy"
        />
        <StatTile
          label="Wife's Portfolio"
          value={formatMoney(wifePortfolio.totalCurrentValue, numberFormat)}
          subValue={`Ananya: ${wife?.holdings?.length || 0} stocks held`}
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
        <button
          onClick={() => setActiveView('listings')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            activeView === 'listings'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Listed Companies ({listedCompanies.length})
        </button>

        <button
          onClick={() => setActiveView('portfolio')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            activeView === 'portfolio'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          My Portfolio ({state.player.holdings.length})
        </button>

        <button
          onClick={() => setActiveView('wife')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
            activeView === 'wife'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          Wife's Portfolio ({wife?.holdings?.length || 0})
        </button>
      </div>

      {/* ===================== VIEW 1: LISTED COMPANIES ===================== */}
      {activeView === 'listings' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by company name, ticker symbol, or sector..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortField)}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-blue-500 pr-8 cursor-pointer appearance-none"
                >
                  <option value="mcap">Sort: Market Cap</option>
                  <option value="price">Sort: Share Price</option>
                  <option value="change">Sort: 1D Gain/Loss</option>
                  <option value="pe">Sort: P/E Ratio</option>
                  <option value="dividend">Sort: Dividend Yield</option>
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className="px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 hover:border-gray-700 transition"
              >
                {sortAsc ? 'Asc ↑' : 'Desc ↓'}
              </button>
            </div>
          </div>

          {/* Sector Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSector('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedSector === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-950/80 text-gray-400 hover:text-gray-200 border border-gray-800/80'
              }`}
            >
              All Sectors ({listedCompanies.length})
            </button>
            {sectorsConfig.map(sec => {
              const count = listedCompanies.filter(c => c.sector.toLowerCase() === sec.id.toLowerCase()).length;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSector(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedSector.toLowerCase() === sec.id.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-950/80 text-gray-400 hover:text-gray-200 border border-gray-800/80'
                  }`}
                >
                  {sec.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedCompanies.map(comp => {
              const hist = comp.priceHistory ?? [comp.price];
              const prev = hist.length >= 2 ? hist[hist.length - 2] : comp.price;
              const chg = comp.price - prev;
              const chgPct = prev > 0 ? (chg / prev) * 100 : 0;
              const isUp = chg >= 0;
              const owned = state.player.holdings.find(h => h.companyId === comp.id);

              return (
                <div
                  key={comp.id}
                  onClick={() => setActiveTradeCompany(comp)}
                  className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-900/40 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 flex-shrink-0 group-hover:scale-105 transition">
                        {comp.symbol || comp.id.substring(5, 9).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-100 group-hover:text-blue-400 transition">
                            {comp.name}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-300 border border-gray-700/80">
                            {comp.sector}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {comp.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-sm text-gray-100">
                        ₹{comp.price.toFixed(2)}
                      </div>
                      <div className={`text-[11px] font-semibold flex items-center justify-end ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {isUp ? '+' : ''}{chgPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Sparkline & Details Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3 text-gray-400 font-mono">
                      <span>MCap: {formatMoney(comp.price * comp.sharesOutstanding, numberFormat)}</span>
                      <span>P/E: {comp.financials.peRatio ? `${comp.financials.peRatio.toFixed(1)}x` : '-'}</span>
                      {owned && (
                        <span className="text-blue-400 font-semibold">
                          Hold: {owned.shares.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Sparkline data={hist} width={70} height={20} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTradeCompany(comp);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: MY PORTFOLIO ===================== */}
      {activeView === 'portfolio' && (
        <div className="space-y-4">
          {/* Portfolio Summary Card */}
          <Card title="Portfolio Performance" subtitle="Equity Holdings and P&L Breakdown">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Invested Capital</span>
                <span className="text-base font-bold text-gray-100 font-mono mt-0.5 block">
                  {formatMoney(playerPortfolio.totalInvested, numberFormat)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Current Value</span>
                <span className="text-base font-bold text-gray-100 font-mono mt-0.5 block">
                  {formatMoney(playerPortfolio.totalCurrentValue, numberFormat)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Total Unrealized P&L</span>
                <span
                  className={`text-base font-bold font-mono mt-0.5 block ${
                    playerPortfolio.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {playerPortfolio.totalUnrealizedPnL >= 0 ? '+' : ''}
                  {formatMoney(playerPortfolio.totalUnrealizedPnL, numberFormat)} ({playerPortfolio.totalPnLPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Today's Day Gain</span>
                <span
                  className={`text-base font-bold font-mono mt-0.5 block ${
                    playerPortfolio.todayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {playerPortfolio.todayPnL >= 0 ? '+' : ''}
                  {formatMoney(playerPortfolio.todayPnL, numberFormat)} ({playerPortfolio.todayPnLPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </Card>

          {/* Holdings List */}
          {playerPortfolio.holdings.length === 0 ? (
            <Card title="Your Equity Holdings" subtitle="Active Positions">
              <div className="text-center py-10 space-y-3">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="text-sm font-bold text-gray-300">No Stocks in Portfolio</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  You haven't purchased shares yet. Open the "Listed Companies" tab above to research the 24 market leaders and buy equity!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('listings')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Explore Listed Stocks
                </button>
              </div>
            </Card>
          ) : (
            <Card title="Your Equity Holdings" subtitle={`${playerPortfolio.holdings.length} Active Positions`}>
              <div className="space-y-3">
                {playerPortfolio.holdings.map(h => {
                  const company = state.companies[h.companyId];
                  const isUp = h.unrealizedPnL >= 0;

                  return (
                    <div
                      key={h.companyId}
                      className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
                          {h.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-100 flex items-center gap-2">
                            {h.name}
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                              {h.sector}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            {h.shares.toLocaleString()} shares · Avg Buy: ₹{h.avgCost.toFixed(2)} · Live: ₹{h.currentPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-gray-400">Current Value</div>
                          <div className="font-mono font-bold text-sm text-gray-100">
                            {formatMoney(h.currentValue, numberFormat)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-400">Unrealized P&L</div>
                          <div className={`font-mono font-bold text-xs flex items-center justify-end ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isUp ? '+' : ''}{formatMoney(h.unrealizedPnL, numberFormat)} ({isUp ? '+' : ''}{h.unrealizedPnLPercent.toFixed(2)}%)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTradeCompany(company || null)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
                        >
                          Trade
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===================== VIEW 3: WIFE'S PORTFOLIO ===================== */}
      {activeView === 'wife' && (
        <div className="space-y-4">
          <Card title="Ananya Mehta's Portfolio" subtitle="Independent Value Investor Archetype">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-950/60 border border-gray-800 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                AM
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                  Ananya Mehta
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50">
                    Spouse & Value Investor
                  </span>
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Focuses on high-quality Pharma and FMCG cash cows with wide moats and sustained dividend yields. She manages her investments independently.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Her Total Net Worth</span>
                <span className="text-base font-bold text-gray-100 font-mono mt-0.5 block">
                  {formatMoney(wife?.netWorth || 60000000, numberFormat)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Portfolio Valuation</span>
                <span className="text-base font-bold text-gray-100 font-mono mt-0.5 block">
                  {formatMoney(wifePortfolio.totalCurrentValue, numberFormat)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                <span className="text-gray-400 text-xs block">Liquid Reserves</span>
                <span className="text-base font-bold text-gray-100 font-mono mt-0.5 block">
                  {formatMoney(wife?.cash || 25000000, numberFormat)}
                </span>
              </div>
            </div>
          </Card>

          {wifePortfolio.holdings.length > 0 && (
            <Card title="Her Equity Allocations" subtitle="Blue-Chip Pharma and FMCG Holdings">
              <div className="space-y-3">
                {wifePortfolio.holdings.map(h => {
                  const comp = state.companies[h.companyId];
                  return (
                    <div
                      key={h.companyId}
                      className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center font-bold text-xs text-rose-300">
                          {h.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-200">{h.name}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {h.shares.toLocaleString()} shares @ ₹{h.currentPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-gray-100">
                          {formatMoney(h.currentValue, numberFormat)}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          Yield: {comp?.financials.dividendYield ? `${(comp.financials.dividendYield * 100).toFixed(1)}%` : '2.0%'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===================== TRADE MODAL ===================== */}
      <TradeModal
        company={activeTradeCompany}
        isOpen={Boolean(activeTradeCompany)}
        onClose={() => setActiveTradeCompany(null)}
      />
    </div>
  );
};
