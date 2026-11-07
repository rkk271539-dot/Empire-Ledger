import { openDB, IDBPDatabase } from 'idb';
import { GameState } from '../core/types';
import { serializeState, deserializeState } from './serialize';

const DB_NAME = 'empire_ledger_db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

export interface SaveMetadata {
  slot: string;
  day: number;
  playerNetWorth: number;
  dateStr: string;
  timestamp: number;
}

async function getDB(): Promise<IDBPDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveToSlot(slot: string, state: GameState, dateStr: string): Promise<SaveMetadata> {
  const jsonStr = serializeState(state);
  const meta: SaveMetadata = {
    slot,
    day: state.day,
    playerNetWorth: state.player.netWorth,
    dateStr,
    timestamp: state.day,
  };

  const payload = {
    meta,
    data: jsonStr,
  };

  try {
    const db = await getDB();
    if (db) {
      await db.put(STORE_NAME, payload, slot);
      return meta;
    }
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
  }

  // Fallback to localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`save_${slot}`, JSON.stringify(payload));
  }
  return meta;
}

export async function loadFromSlot(slot: string): Promise<{ state: GameState; meta: SaveMetadata } | null> {
  try {
    const db = await getDB();
    if (db) {
      const res = await db.get(STORE_NAME, slot);
      if (res) {
        return {
          state: deserializeState(res.data),
          meta: res.meta,
        };
      }
    }
  } catch (err) {
    console.warn('IndexedDB load failed, falling back to localStorage:', err);
  }

  // Fallback to localStorage
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(`save_${slot}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        state: deserializeState(parsed.data),
        meta: parsed.meta,
      };
    }
  }

  return null;
}

export async function listSaveSlots(): Promise<Record<string, SaveMetadata>> {
  const slots: Record<string, SaveMetadata> = {};

  try {
    const db = await getDB();
    if (db) {
      const keys = await db.getAllKeys(STORE_NAME);
      for (const k of keys) {
        const item = await db.get(STORE_NAME, k);
        if (item && item.meta) {
          slots[String(k)] = item.meta;
        }
      }
      return slots;
    }
  } catch (err) {
    console.warn('IndexedDB list failed, falling back to localStorage:', err);
  }

  // Fallback to localStorage
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('save_')) {
        const slot = key.replace('save_', '');
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.meta) {
            slots[slot] = item.meta;
          }
        } catch {
          // ignore corrupted items
        }
      }
    }
  }

  return slots;
}

export function exportSaveToFile(state: GameState, filename = 'empire_ledger_save.json'): void {
  const jsonStr = serializeState(state);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importSaveFromFile(file: File): Promise<GameState> {
  const text = await file.text();
  return deserializeState(text);
}
