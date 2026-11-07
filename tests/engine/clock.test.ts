import { describe, it, expect } from 'vitest';
import { getClockInfo, nextSlot } from '../../src/engine/core/clock';

describe('Game Clock & Time System (Section 5)', () => {
  it('computes correct calendar info for Day 1', () => {
    const clock = getClockInfo(1, 0);
    expect(clock.day).toBe(1);
    expect(clock.slot).toBe(0);
    expect(clock.slotName).toBe('Morning');
    expect(clock.dateStr).toBe('1 Jan 2026');
    expect(clock.dayOfWeek).toBe('Thursday');
    expect(clock.isWeekend).toBe(false);
    expect(clock.cycleDay).toBe(1);
    expect(clock.daysUntilAnnouncement).toBe(59);
  });

  it('cycles through slots and advances day at slot 3', () => {
    expect(nextSlot(0)).toEqual({ nextSlot: 1, dayAdvanced: false });
    expect(nextSlot(1)).toEqual({ nextSlot: 2, dayAdvanced: false });
    expect(nextSlot(2)).toEqual({ nextSlot: 3, dayAdvanced: false });
    expect(nextSlot(3)).toEqual({ nextSlot: 0, dayAdvanced: true });
  });

  it('correctly tracks 60-day corporate announcement cycle countdown', () => {
    const day60 = getClockInfo(60, 0);
    expect(day60.cycleDay).toBe(60);
    expect(day60.daysUntilAnnouncement).toBe(0);

    const day61 = getClockInfo(61, 0);
    expect(day61.cycleDay).toBe(1);
    expect(day61.daysUntilAnnouncement).toBe(59);
  });
});
