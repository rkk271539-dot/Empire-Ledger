import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from '../../src/engine';
import { serializeState, deserializeState, CURRENT_SCHEMA_VERSION } from '../../src/engine/save/serialize';

describe('Save Serialization & State Integrity (Section 14)', () => {
  it('creates initial state with current schema version', () => {
    const state = createInitialState(42);
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.day).toBe(1);
    expect(state.slot).toBe(0);
    expect(state.player.cash).toBeGreaterThan(0);
  });

  it('serializes and deserializes state without loss of data', () => {
    const original = createInitialState(101);
    const step1 = reduce(original, { type: 'ADVANCE_DAY', count: 5 });

    const json = serializeState(step1.state);
    const restored = deserializeState(json);

    expect(restored.day).toBe(6);
    expect(restored.seed).toBe(original.seed);
    expect(restored.player.name).toBe(original.player.name);
    expect(restored.history.days.length).toBe(6);
  });

  it('rejects invalid or corrupted save payloads', () => {
    expect(() => deserializeState('invalid json string')).toThrow();
    expect(() => deserializeState('{"noSchema": true}')).toThrow();
  });
});
