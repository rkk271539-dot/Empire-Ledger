export const SLOTS = ['Morning', 'Noon', 'Evening', 'Night'] as const;
export type SlotIndex = 0 | 1 | 2 | 3;
export type SlotName = typeof SLOTS[number];

export interface ClockInfo {
  day: number;
  slot: SlotIndex;
  slotName: SlotName;
  dateStr: string; // e.g., "15 Jan 2026"
  dayOfWeek: string; // "Monday", etc.
  isWeekend: boolean;
  cycleDay: number; // 1 to 60
  daysUntilAnnouncement: number; // countdown
}

const START_DATE = new Date(2026, 0, 1); // 1 Jan 2026
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getClockInfo(day: number, slot: SlotIndex = 0): ClockInfo {
  // Day 1 corresponds to START_DATE
  const targetTime = START_DATE.getTime() + (day - 1) * MS_PER_DAY;
  const date = new Date(targetTime);
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const dateStr = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  // 60-day reporting cycle
  const cycleDay = ((day - 1) % 60) + 1;
  const daysUntilAnnouncement = 60 - cycleDay;

  return {
    day,
    slot,
    slotName: SLOTS[slot],
    dateStr,
    dayOfWeek,
    isWeekend,
    cycleDay,
    daysUntilAnnouncement,
  };
}

export function nextSlot(currentSlot: SlotIndex): { nextSlot: SlotIndex; dayAdvanced: boolean } {
  if (currentSlot < 3) {
    return { nextSlot: (currentSlot + 1) as SlotIndex, dayAdvanced: false };
  }
  return { nextSlot: 0, dayAdvanced: true };
}
