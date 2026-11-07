import React, { useState } from 'react';
import { Card } from '../components/Card';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { exportSaveToFile, importSaveFromFile } from '../../engine';
import { formatMoney } from '../../utils/format';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Coins,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { state, saveSlots, saveGame, loadGame, dispatch, applyImportedState } = useGameStore();
  const {
    theme,
    setTheme,
    numberFormat,
    setNumberFormat,
    showToast,
  } = useUIStore();

  const [playerNameInput, setPlayerNameInput] = useState(state.player.name);

  const handleSaveSlot = async (slot: string) => {
    try {
      await saveGame(slot);
      showToast(`Game saved successfully to ${slot.toUpperCase()}!`, 'success');
    } catch {
      showToast('Failed to save game.', 'error');
    }
  };

  const handleLoadSlot = async (slot: string) => {
    try {
      const ok = await loadGame(slot);
      if (ok) {
        showToast(`Game loaded from ${slot.toUpperCase()}!`, 'success');
      } else {
        showToast(`No save found in ${slot.toUpperCase()}.`, 'warning');
      }
    } catch {
      showToast('Failed to load game.', 'error');
    }
  };

  const handleExport = () => {
    try {
      exportSaveToFile(state, `empire_ledger_day_${state.day}.json`);
      showToast('Save file exported!', 'success');
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedState = await importSaveFromFile(file);
      await applyImportedState(importedState);
      showToast('Save file imported successfully!', 'success');
    } catch {
      showToast('Failed to parse or import save file.', 'error');
    }
  };

  const handleRenamePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerNameInput.trim()) return;
    dispatch({ type: 'RENAME_PLAYER', name: playerNameInput.trim() });
    showToast(`Player name updated to ${playerNameInput.trim()}!`, 'success');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to restart from Day 1? Current progress will be reset.')) {
      dispatch({ type: 'RESET_GAME' });
      showToast('Game has been reset to Day 1.', 'info');
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Settings & Save Management
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Multi-slot persistence, display preferences & game controls
        </p>
      </div>

      {/* Save / Load Slots */}
      <Card title="Persistence & Save Slots" subtitle="IndexedDB / LocalStorage">
        <div className="space-y-3">
          {['autosave', 'slot1', 'slot2', 'slot3'].map((slotKey) => {
            const meta = saveSlots[slotKey];
            const isAuto = slotKey === 'autosave';

            return (
              <div
                key={slotKey}
                className="p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-200">
                      {isAuto ? 'Auto-Save' : `Slot ${slotKey.replace('slot', '')}`}
                    </span>
                    {meta && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {meta
                      ? `Day ${meta.day} · ${meta.dateStr} · Net Worth: ${formatMoney(meta.playerNetWorth, numberFormat)}`
                      : 'Empty Slot'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isAuto && (
                    <button
                      onClick={() => handleSaveSlot(slotKey)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition active:scale-95 flex items-center gap-1 min-h-[36px]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  )}
                  <button
                    onClick={() => handleLoadSlot(slotKey)}
                    disabled={!meta}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center gap-1 min-h-[36px] ${
                      meta
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                        : 'bg-gray-900 text-gray-600 border border-gray-900 cursor-not-allowed'
                    }`}
                  >
                    Load
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* JSON Export / Import */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-2.5 items-center justify-between">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 min-h-[40px]"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export JSON Save</span>
          </button>

          <label className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer min-h-[40px]">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import JSON Save</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      </Card>

      {/* Formatting & UI Preferences */}
      <Card title="Interface & Preferences" subtitle="Customise Game Experience">
        <div className="space-y-4">
          {/* Number Formatting */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-gray-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Number Formatting
              </span>
              <p className="text-[11px] text-gray-400">
                Choose between Indian (Lakh / Crore) and Standard (Million / Billion)
              </p>
            </div>

            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setNumberFormat('indian')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  numberFormat === 'indian'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Lakh / Cr
              </button>
              <button
                onClick={() => setNumberFormat('standard')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  numberFormat === 'standard'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                M / B
              </button>
            </div>
          </div>

          {/* Theme Preference */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div>
              <span className="font-semibold text-xs text-gray-200 flex items-center gap-1.5">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                Theme Mode
              </span>
              <p className="text-[11px] text-gray-400">
                Fintech dark palette is recommended for mobile battery efficiency
              </p>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition"
            >
              {theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
            </button>
          </div>

          {/* Player Name */}
          <div className="pt-3 border-t border-gray-800">
            <form onSubmit={handleRenamePlayer} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] text-gray-400 mb-1 font-medium">
                  Player / Founder Name
                </label>
                <input
                  type="text"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="mt-auto sm:mt-5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-semibold transition"
              >
                Update Name
              </button>
            </form>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" subtitle="Reset or Reinitialize">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-xs text-rose-400">Restart Simulation</span>
            <p className="text-[11px] text-gray-400">
              Resets entire game state back to Day 1.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-semibold transition flex items-center gap-1 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Game
          </button>
        </div>
      </Card>
    </div>
  );
};
