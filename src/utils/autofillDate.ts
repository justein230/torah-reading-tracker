/** Adds `days` (may be negative) to a YYYY-MM-DD date. Computed in UTC so DST never shifts the result. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y as number, (m as number) - 1, (d as number) + days)).toISOString().slice(0, 10);
}

export type AutofillDirection = 'recent' | 'upcoming';

/**
 * Picks the date the autofill should suggest from every date a reading occurs on.
 * `recent` is the latest one on or before `today` (logging something just read); `upcoming` is
 * the earliest one on or after `today` (logging ahead of time). Either falls back to the other
 * side when its own has no date, e.g. a reading that has not happened yet.
 *
 * @param dates YYYY-MM-DD strings, in any order
 * @param today YYYY-MM-DD
 */
export function pickAutofillDate(
  dates: readonly string[] | undefined,
  today: string,
  direction: AutofillDirection = 'recent',
): string | undefined {
  let past: string | undefined;
  let upcoming: string | undefined;
  for (const date of dates ?? []) {
    if (date < today) { if (!past || date > past) past = date; }
    else if (date > today) { if (!upcoming || date < upcoming) upcoming = date; }
    else { past = upcoming = date; }
  }
  return direction === 'recent' ? past ?? upcoming : upcoming ?? past;
}

/** Days before a Shabbat on which its parsha is read on a weekday: Monday, then Thursday. */
const WEEKDAY_OFFSETS_BEFORE_SHABBAT = [5, 2] as const;
/** Shabbat Mincha reads the *next* Shabbat's parsha, so it sits one week earlier. */
const SHABBAT_MINCHA_OFFSET = 7;

export interface WeekdayReadingBlockers {
  /** Dates whose morning service has its own Torah reading (Chol HaMoed, Rosh Chodesh, fasts…); it replaces Mon/Thu's. */
  morningReadingDates: ReadonlySet<string>;
  /** Shabbatot whose Mincha has a different Torah reading (Yom Kippur). */
  noMinchaDates: ReadonlySet<string>;
}

/**
 * Where a parsha's weekday (aliyot 1–3) reading falls for one Shabbat: the Monday before, or the
 * Thursday if Monday's morning has a holiday reading, or else Shabbat Mincha of the week before.
 * Only morning readings displace Mon/Thu; a fast-day Mincha or an erev reading does not.
 * Returns undefined when every option is taken.
 */
export function weekdayReadingDateFor(shabbat: string, blockers: WeekdayReadingBlockers): string | undefined {
  for (const offset of WEEKDAY_OFFSETS_BEFORE_SHABBAT) {
    const candidate = shiftDate(shabbat, -offset);
    if (!blockers.morningReadingDates.has(candidate)) return candidate;
  }
  const mincha = shiftDate(shabbat, -SHABBAT_MINCHA_OFFSET);
  return blockers.noMinchaDates.has(mincha) ? undefined : mincha;
}

/** Every date a parsha's weekday reading occurs on, one per Shabbat it was read. */
export function weekdayReadingDates(shabbatDates: readonly string[] | undefined, blockers: WeekdayReadingBlockers): string[] {
  return (shabbatDates ?? []).flatMap(s => weekdayReadingDateFor(s, blockers) ?? []);
}
