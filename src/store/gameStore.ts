import { create } from 'zustand';
import { GameState, Command, createInitialState, saveToSlot, loadFromSlot, listSaveSlots, SaveMetadata, getClockInfo } from '../engine';
import { simBridge } from '../worker/bridge';

interface GameStore {
  state: GameState;
  isReady: boolean;
  saveSlots: Record<string, SaveMetadata>;
  init: () => Promise<void>;
  dispatch: (command: Command) => Promise<void>;
  saveGame: (slot: string) => Promise<void>;
  loadGame: (slot: string) => Promise<boolean>;
  refreshSaveSlots: () => Promise<void>;
  applyImportedState: (newState: GameState) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  isReady: false,
  saveSlots: {},

  init: async () => {
    // Try to load auto-save slot if available
    const autoSave = await loadFromSlot('autosave');
    const initialState = autoSave ? autoSave.state : createInitialState();

    const activeState = await simBridge.init(initialState);
    const slots = await listSaveSlots();

    // Subscribe to background state updates from the worker
    simBridge.onState((updatedState) => {
      set({ state: updatedState });
    });

    set({ state: activeState, isReady: true, saveSlots: slots });
  },

  dispatch: async (command: Command) => {
    const res = await simBridge.dispatch(command);
    set({ state: res.state });

    // Auto-save on day advancement
    if (command.type === 'ADVANCE_DAY' || (command.type === 'ADVANCE_SLOT' && res.state.day > get().state.day)) {
      const clock = getClockInfo(res.state.day, res.state.slot);
      await saveToSlot('autosave', res.state, clock.dateStr);
      const slots = await listSaveSlots();
      set({ saveSlots: slots });
    }
  },

  saveGame: async (slot: string) => {
    const cur = get().state;
    const clock = getClockInfo(cur.day, cur.slot);
    await saveToSlot(slot, cur, clock.dateStr);
    const slots = await listSaveSlots();
    set({ saveSlots: slots });
  },

  loadGame: async (slot: string) => {
    const loaded = await loadFromSlot(slot);
    if (loaded) {
      await simBridge.setState(loaded.state);
      set({ state: loaded.state });
      return true;
    }
    return false;
  },

  refreshSaveSlots: async () => {
    const slots = await listSaveSlots();
    set({ saveSlots: slots });
  },

  applyImportedState: async (newState: GameState) => {
    await simBridge.setState(newState);
    set({ state: newState });
    const clock = getClockInfo(newState.day, newState.slot);
    await saveToSlot('autosave', newState, clock.dateStr);
    const slots = await listSaveSlots();
    set({ saveSlots: slots });
  },
}));
