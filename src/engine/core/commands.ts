export type Command =
  | { type: 'ADVANCE_SLOT' }
  | { type: 'ADVANCE_DAY'; count?: number }
  | { type: 'SET_SLOT'; slot: 0 | 1 | 2 | 3 }
  | { type: 'RENAME_PLAYER'; name: string }
  | { type: 'RESET_GAME'; seed?: number };
