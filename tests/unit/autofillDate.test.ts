// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { pickAutofillDate, shiftDate, weekdayReadingDateFor, weekdayReadingDates } from '../../src/utils/autofillDate.ts';

describe('shiftDate', () => {
  it('moves forward and backward across month and year boundaries', () => {
    expect(shiftDate('2026-01-02', -5)).toBe('2025-12-28');
    expect(shiftDate('2026-02-27', 3)).toBe('2026-03-02');
  });

  it('handles a leap day', () => {
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('is unaffected by a DST change', () => {
    expect(shiftDate('2026-03-08', 1)).toBe('2026-03-09');
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
  });
});

describe('pickAutofillDate', () => {
  it('picks the latest date on or before today', () => {
    expect(pickAutofillDate(['2024-03-03', '2025-03-14', '2026-03-03'], '2025-12-01')).toBe('2025-03-14');
  });

  it('treats today itself as past', () => {
    expect(pickAutofillDate(['2025-01-01', '2025-06-01', '2025-09-01'], '2025-06-01')).toBe('2025-06-01');
  });

  it('falls back to the earliest upcoming date when none has happened', () => {
    expect(pickAutofillDate(['2027-03-03', '2026-03-03'], '2025-01-01')).toBe('2026-03-03');
  });

  it('does not depend on input order', () => {
    expect(pickAutofillDate(['2026-01-01', '2024-01-01', '2025-01-01'], '2026-06-01')).toBe('2026-01-01');
  });

  it('returns undefined for no dates', () => {
    expect(pickAutofillDate([], '2026-01-01')).toBeUndefined();
    expect(pickAutofillDate(undefined, '2026-01-01')).toBeUndefined();
  });

  describe('upcoming direction', () => {
    const dates = ['2024-03-03', '2025-03-14', '2026-03-03', '2027-03-23'];

    it('picks the earliest date on or after today', () => {
      expect(pickAutofillDate(dates, '2025-12-01', 'upcoming')).toBe('2026-03-03');
    });

    it('treats today itself as upcoming', () => {
      expect(pickAutofillDate(dates, '2026-03-03', 'upcoming')).toBe('2026-03-03');
    });

    it('falls back to the latest past date when nothing is left', () => {
      expect(pickAutofillDate(dates, '2030-01-01', 'upcoming')).toBe('2027-03-23');
    });

    it('does not depend on input order', () => {
      expect(pickAutofillDate([...dates].reverse(), '2025-12-01', 'upcoming')).toBe('2026-03-03');
    });
  });
});

describe('weekdayReadingDateFor', () => {
  // Shabbat 2026-10-10 → Monday 10-05, Thursday 10-08, previous Shabbat 10-03.
  const none = { morningReadingDates: new Set<string>(), noMinchaDates: new Set<string>() };

  it('uses the Monday before Shabbat in an ordinary week', () => {
    expect(weekdayReadingDateFor('2026-10-10', none)).toBe('2026-10-05');
  });

  it('crosses a month boundary', () => {
    expect(weekdayReadingDateFor('2026-11-07', none)).toBe('2026-11-02');
    expect(weekdayReadingDateFor('2026-10-03', none)).toBe('2026-09-28');
  });

  it('falls to Thursday when Monday morning has its own reading (e.g. Rosh Chodesh)', () => {
    const blockers = { ...none, morningReadingDates: new Set(['2026-10-05']) };
    expect(weekdayReadingDateFor('2026-10-10', blockers)).toBe('2026-10-08');
  });

  it('falls to Shabbat Mincha when Monday and Thursday are both taken', () => {
    const blockers = { ...none, morningReadingDates: new Set(['2026-10-05', '2026-10-08']) };
    expect(weekdayReadingDateFor('2026-10-10', blockers)).toBe('2026-10-03');
  });

  it('is not displaced by a reading that is not a morning Torah reading (erev, Mincha)', () => {
    // Such days are simply absent from morningReadingDates.
    expect(weekdayReadingDateFor('2026-10-10', none)).toBe('2026-10-05');
  });

  it('returns undefined when the Shabbat Mincha fallback is Yom Kippur', () => {
    const blockers = {
      morningReadingDates: new Set(['2024-10-14', '2024-10-17']),
      noMinchaDates:       new Set(['2024-10-12']),
    };
    expect(weekdayReadingDateFor('2024-10-19', blockers)).toBeUndefined();
  });
});

describe('weekdayReadingDates', () => {
  const none = { morningReadingDates: new Set<string>(), noMinchaDates: new Set<string>() };

  it('maps every Shabbat the parsha was read to its weekday date, skipping unresolvable ones', () => {
    expect(weekdayReadingDates(['2025-10-18', '2026-10-17'], none)).toEqual(['2025-10-13', '2026-10-12']);
  });

  it('returns nothing for an unknown parsha', () => {
    expect(weekdayReadingDates(undefined, none)).toEqual([]);
  });
});
