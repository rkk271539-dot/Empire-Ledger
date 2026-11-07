import React from 'react';
import { FastForward, Play, Pause, Clock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { getClockInfo } from '../../engine';

export const DaySkipper: React.FC = () => {
  const { state, dispatch } = useGameStore();
  const { autoPlay, autoPlaySpeed, toggleAutoPlay, setAutoPlaySpeed } = useUIStore();
  const clock = getClockInfo(state.day, state.slot);

  const handleAdvanceSlot = () => {
    dispatch({ type: 'ADVANCE_SLOT' });
  };

  const handleAdvanceDay = (count = 1) => {
    dispatch({ type: 'ADVANCE_DAY', count });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm text-gray-200">Time Machine & Simulation</span>
        </div>
        <div className="text-xs text-gray-400">
          Cycle: <span className="text-amber-400 font-bold">{clock.cycleDay}/60</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={handleAdvanceSlot}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-800 hover:bg-gray-700/80 border border-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition active:scale-95 min-h-[44px]"
        >
          <span>Next Slot</span>
          <span className="text-[10px] text-gray-400">({clock.slotName})</span>
        </button>

        <button
          onClick={() => handleAdvanceDay(1)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition active:scale-95 min-h-[44px]"
        >
          <FastForward className="w-4 h-4" />
          <span>Skip 1 Day</span>
        </button>

        <button
          onClick={() => handleAdvanceDay(7)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-800 hover:bg-gray-700/80 border border-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition active:scale-95 min-h-[44px]"
        >
          <FastForward className="w-4 h-4 text-purple-400" />
          <span>Skip 1 Week</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleAutoPlay}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition active:scale-95 min-h-[44px] ${
              autoPlay
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-gray-800 hover:bg-gray-700/80 text-gray-300 border border-gray-700'
            }`}
          >
            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{autoPlay ? 'Pause' : 'Auto'}</span>
          </button>

          <button
            onClick={() => {
              const nextSpeed = autoPlaySpeed === 1 ? 2 : autoPlaySpeed === 2 ? 4 : 1;
              setAutoPlaySpeed(nextSpeed);
            }}
            className="px-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-xs font-bold min-h-[44px] min-w-[36px]"
            title="Auto-Play Speed"
          >
            {autoPlaySpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};
