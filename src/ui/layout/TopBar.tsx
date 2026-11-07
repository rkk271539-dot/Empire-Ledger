import React from 'react';
import { Calendar, Bell, FastForward, Play, Pause } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { getClockInfo } from '../../engine';
import { formatMoney } from '../../utils/format';

export const TopBar: React.FC = () => {
  const { state, dispatch } = useGameStore();
  const { numberFormat, autoPlay, toggleAutoPlay, setFounderSetupOpen } = useUIStore();
  const clock = getClockInfo(state.day, state.slot);

  const handleAdvanceSlot = () => {
    dispatch({ type: 'ADVANCE_SLOT' });
  };

  const handleAdvanceDay = () => {
    dispatch({ type: 'ADVANCE_DAY', count: 1 });
  };

  return (
    <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Founder Avatar & Day/Date Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFounderSetupOpen(true)}
            title="Edit Founder & Empire Profile"
            className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-400 transition shrink-0 active:scale-95"
          >
            {state.player.avatarUrl ? (
              <img
                src={state.player.avatarUrl}
                alt={state.player.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-blue-400">
                {state.player.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-gray-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                Day {clock.day}
              </span>
              <span className="bg-blue-950/80 text-blue-400 border border-blue-800/60 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {clock.slotName}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 font-medium">
              {clock.dateStr} · {clock.dayOfWeek}
            </span>
          </div>

          {/* Announcement Countdown Pill */}
          <div className="hidden md:flex items-center gap-1.5 bg-gray-900 border border-gray-800 text-xs px-2.5 py-1 rounded-full text-gray-300">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycle:</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {clock.daysUntilAnnouncement}d to 60d Report
            </span>
          </div>
        </div>

        {/* Center/Right: Financial Quick Stats */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col text-right">
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider">
              Net Worth
            </span>
            <span className="text-sm sm:text-base font-bold text-gray-100 tabular-nums">
              {formatMoney(state.player.netWorth, numberFormat)}
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider">
              Cash
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
              {formatMoney(state.player.cash, numberFormat)}
            </span>
          </div>

          {/* Quick Advancement Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-800">
            <button
              onClick={handleAdvanceSlot}
              title="Advance 1 Slot (Morning -> Noon -> Evening -> Night)"
              className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold rounded-lg text-gray-200 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
            >
              +Slot
            </button>
            <button
              onClick={handleAdvanceDay}
              title="Advance 1 Full Day"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg text-white transition-colors min-h-[38px] flex items-center gap-1 shadow-sm active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Next Day</span>
            </button>
            <button
              onClick={toggleAutoPlay}
              title={autoPlay ? 'Pause Auto-Play' : 'Start Auto-Play'}
              className={`p-2 rounded-lg border text-xs font-semibold transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 ${
                autoPlay
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-400 border-gray-800'
              }`}
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
