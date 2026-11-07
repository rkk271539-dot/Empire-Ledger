import { GameState } from '../core/types';

export const CURRENT_SCHEMA_VERSION = 1;

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(jsonStr: string): GameState {
  const parsed = JSON.parse(jsonStr) as GameState;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid save data format');
  }

  if (typeof parsed.schemaVersion !== 'number') {
    throw new Error('Missing schemaVersion in save data');
  }

  // Future migration hooks can run here if parsed.schemaVersion < CURRENT_SCHEMA_VERSION

  return parsed;
}
