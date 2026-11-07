import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { DaySkipper } from '../layout/DaySkipper';
import {
  TrendingUp,
  Wallet,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat, setActiveTab } = useUIStore();

  const rival = state.people['rival'];
  const wife = state.people['wife'];

  const playerNetWorth = state.player.netWorth;
  const rivalNetWorth = rival?.netWorth ?? 120000000;
  const netWorthRatio = (playerNetWorth / Math.max(1, rivalNetWorth)).toFixed(2);

  const moodLabel =
    state.macro.marketMood > 0.4
      ? 'Bullish Euphoria'
      : state.macro.marketMood > 0.1
      ? 'Mildly Bullish'
      : state.macro.marketMood > -0.2
      ? 'Neutral / Choppy'
      : 'Bearish Correction';

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner: v0.1 Foundation Active */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-gray-900 border border-blue-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-100 text-sm sm:text-base">
              Empire Ledger — Foundation (v0.1)
            </h2>
            <p className="text-xs text-gray-400">
              Welcome, <span className="text-gray-200 font-semibold">{state.player.name}</span>. Headless simulation engine & dynamics math active.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className="text-xs font-semibold px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition"
        >
          Manage Save Slots
        </button>
      </div>

      {/* Top Financial Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Net Worth"
          value={formatMoney(state.player.netWorth, numberFormat)}
          subValue={`Ratio vs Rival: ${netWorthRatio}x (Win at 8.0x)`}
          icon={<Wallet className="w-4 h-4" />}
        />
        <StatTile
          label="Liquid Cash"
          value={formatMoney(state.player.cash, numberFormat)}
          subValue="Zero debt liabilities"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        />
        <StatTile
          label="Rival's Worth"
          value={formatMoney(rivalNetWorth, numberFormat)}
          subValue={`${rival?.name ?? 'Rival'}`}
          icon={<Flame className="w-4 h-4 text-rose-400" />}
        />
        <StatTile
          label="BSE Index"
          value={state.market.indexLevel.toLocaleString()}
          change={state.market.dailyReturn}
          subValue={moodLabel}
        />
      </div>

      {/* Time Controls & Day Progression */}
      <DaySkipper />

      {/* Key Players Duel Snapshot: Rival & Wife */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rival Card */}
        <Card
          title={`Main Rival: ${rival?.name ?? 'Vikram Singhania'}`}
          subtitle="Industrialist & Tech Competitor"
          action={
            <button
              onClick={() => setActiveTab('people')}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              Inspect <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-800/60">
              <div className="w-11 h-11 rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center overflow-hidden shrink-0">
                {rival?.avatarUrl ? (
                  <img src={rival.avatarUrl} alt={rival.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-rose-400">
                    {(rival?.name ?? 'VS').substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-gray-100">{rival?.name}</span>
                <p className="text-[10px] text-gray-400">Arch Competitor · Tech & Infra</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Net Worth</span>
              <span className="font-bold text-gray-100 tabular-nums">
                {formatMoney(rival?.netWorth ?? 120000000, numberFormat)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Cash Reserves</span>
              <span className="font-medium text-emerald-400 tabular-nums">
                {formatMoney(rival?.cash ?? 50000000, numberFormat)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Charm & Reputation</span>
              <span className="font-medium text-purple-400">
                {rival?.charm ?? 75}/100 · {rival?.reputation ?? 70}/100
              </span>
            </div>
            <p className="text-xs text-gray-400 italic bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/60">
              "{rival?.bio}"
            </p>
          </div>
        </Card>

        {/* Wife Card */}
        <Card
          title={`Partner: ${wife?.name ?? 'Ananya Mehta'}`}
          subtitle="Independent Investor & Strategic Ally"
          action={
            <button
              onClick={() => setActiveTab('wife')}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-800/60">
              <div className="w-11 h-11 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center overflow-hidden shrink-0">
                {wife?.avatarUrl ? (
                  <img src={wife.avatarUrl} alt={wife.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-emerald-400">
                    {(wife?.name ?? 'AM').substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-gray-100">{wife?.name}</span>
                <p className="text-[10px] text-gray-400">Strategic Ally · Value Investor</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Net Worth</span>
              <span className="font-bold text-gray-100 tabular-nums">
                {formatMoney(wife?.netWorth ?? 60000000, numberFormat)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Trust in You</span>
              <span className="font-semibold text-emerald-400">
                {state.relationships['player:wife']?.trust ?? 85}% (Solid)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Investment Lean</span>
              <span className="font-semibold text-blue-400">
                Backing Player (+75%)
              </span>
            </div>
            <p className="text-xs text-gray-400 italic bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/60">
              "{wife?.bio}"
            </p>
          </div>
        </Card>
      </div>

      {/* Live News Ticker Snapshot */}
      <Card
        title="Dalal Street Wire — Latest Reports"
        subtitle={`Day ${state.day} Edition`}
        action={
          <button
            onClick={() => setActiveTab('news')}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            All News <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-2.5">
          {state.news[0]?.articles.map((art) => (
            <div
              key={art.id}
              className="p-3 bg-gray-950/50 rounded-lg border border-gray-800/70 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  {art.section}
                </span>
                <span className="text-[10px] text-gray-500">{art.sourceName}</span>
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-100">
                {art.headline}
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {art.body}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
