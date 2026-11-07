import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { Users } from 'lucide-react';

export const PeopleTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat } = useUIStore();

  const rival = state.people['rival'];
  const wife = state.people['wife'];

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          The Rich List & Market Participants
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          30+ AI Investors, Industrialists & Competitors · Roadmap: Person detail sheets in v0.4
        </p>
      </div>

      {/* Top Rivals Duel */}
      <div className="space-y-3">
        {/* Rival Pinned Top */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/30 to-gray-900 border border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-sm overflow-hidden shrink-0">
              {rival?.avatarUrl ? (
                <img src={rival.avatarUrl} alt={rival.name} className="w-full h-full object-cover" />
              ) : (
                (rival?.name ?? 'VS').substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-gray-100">
                  {rival?.name ?? 'Vikram Singhania'}
                </span>
                <span className="bg-rose-900/60 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Arch Rival
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                City: {rival?.city} · Personality: {rival?.personality} · Focus: {rival?.industryFocus.join(', ')}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-gray-800 sm:pl-4">
            <div className="text-[11px] text-gray-400">Net Worth</div>
            <div className="text-base font-bold text-gray-100 tabular-nums">
              {formatMoney(rival?.netWorth ?? 120000000, numberFormat)}
            </div>
          </div>
        </div>

        {/* Wife Pinned */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-gray-900 border border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm overflow-hidden shrink-0">
              {wife?.avatarUrl ? (
                <img src={wife.avatarUrl} alt={wife.name} className="w-full h-full object-cover" />
              ) : (
                (wife?.name ?? 'AM').substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-gray-100">
                  {wife?.name ?? 'Ananya Mehta'}
                </span>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Wife / Ally
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                City: {wife?.city} · Personality: {wife?.personality} · Focus: {wife?.industryFocus.join(', ')}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-gray-800 sm:pl-4">
            <div className="text-[11px] text-gray-400">Net Worth</div>
            <div className="text-base font-bold text-gray-100 tabular-nums">
              {formatMoney(wife?.netWorth ?? 60000000, numberFormat)}
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-gray-900 border border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm overflow-hidden shrink-0">
              {state.player.avatarUrl ? (
                <img src={state.player.avatarUrl} alt={state.player.name} className="w-full h-full object-cover" />
              ) : (
                state.player.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-gray-100">
                  {state.player.name}
                </span>
                <span className="bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Player Founder
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                City: {state.player.city || 'Mumbai'} · Charm: {state.player.charm}/100 · Reputation: {state.player.reputation}/100
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-gray-800 sm:pl-4">
            <div className="text-[11px] text-gray-400">Net Worth</div>
            <div className="text-base font-bold text-gray-100 tabular-nums">
              {formatMoney(state.player.netWorth, numberFormat)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
