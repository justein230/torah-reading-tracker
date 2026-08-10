import { isSeferAllowed } from '../compute.js';
import type {
  MappedRow, MappedHosafah, MappedWeekdayAliyah, MappedOccasionAliyah,
  SpecialReadingRecord, Filters, Stats, LogEntry,
} from '../types/index.js';

/** A LogEntry tagged with the year it should be grouped under in the reading log. */
export type DisplayEntry = LogEntry & { displayYear: number | null };

const yearOf = (dateStr: string): number => new Date(dateStr + 'T00:00:00').getFullYear();

const yearAllowed = (year: number, filters: Filters): boolean =>
  !filters.years.length || filters.years.includes(year);

const pctOf = (pseukim: number, stats: Stats | null): number =>
  stats ? (pseukim / stats.totalPseukim) * 100 : 0;

/** Push one re-read entry per scheduled future date that passes the year filter. */
export function addFutureReadings(readings: DisplayEntry[], r: MappedRow, filters: Filters): void {
  for (const dateStr of r.futDates) {
    const rereadYear = yearOf(dateStr);
    if (yearAllowed(rereadYear, filters)) {
      readings.push({ ...r, displayDate: dateStr, displayYear: rereadYear, reread: true });
    }
  }
}

/**
 * Standard (Shabbat) aliyot. Gated on `directOrig` rather than `orig`: an aliyah whose only
 * read date came from holiday-coverage (its verses read divided across a holiday, never in
 * their standard division) has an empty `directOrig` and is suppressed here — the holiday
 * readings that produced it surface separately via collectSpecialEntries.
 */
export function collectReadings(allRows: MappedRow[], filters: Filters): DisplayEntry[] {
  const readings: DisplayEntry[] = [];
  for (const r of allRows) {
    if (!isSeferAllowed(r.sefer, filters)) continue;
    if (r.directOrig !== '') {
      const year = yearOf(r.directOrig);
      if (yearAllowed(year, filters)) {
        readings.push({ ...r, readAsDouble: r.readAsDouble, displayDate: r.directOrig, displayYear: year, reread: false });
      }
    }
    if (filters.includeFutureDates && r.hasFuture) addFutureReadings(readings, r, filters);
  }
  return readings;
}

/** Holiday (special) readings — mirrors ManageList's holiday branch. */
export function collectSpecialEntries(
  specialReadings: SpecialReadingRecord[],
  occasionAliyot: MappedOccasionAliyah[],
  stats: Stats | null,
  filters: Filters,
): DisplayEntry[] {
  const entries: DisplayEntry[] = [];
  for (const sr of specialReadings) {
    if (!sr.dateRead) continue;
    const oa    = occasionAliyot.find(o => o.id === sr.occasionAliyahId);
    const sefer = oa?.sefer ?? '';
    if (!isSeferAllowed(sefer, filters)) continue;
    const year = yearOf(sr.dateRead);
    if (!yearAllowed(year, filters)) continue;
    entries.push({
      sefer,
      parsha:      oa?.parsha ?? sr.parsha,
      aliyah:      sr.aliyahKey,
      pseukim:     sr.pseukim,
      pct:         pctOf(sr.pseukim, stats),
      occasion:    sr.occasionEn,
      note:        sr.note,
      location:    sr.location,
      reread:      false,
      displayDate: sr.dateRead,
      displayYear: year,
      chapterStart: oa?.chapterStart, verseStart: oa?.verseStart,
      chapterEnd:   oa?.chapterEnd,   verseEnd:   oa?.verseEnd,
    });
  }
  return entries;
}

/** Weekday readings — mirrors ManageList's weekday branch. */
export function collectWeekdayEntries(
  weekdayAliyot: MappedWeekdayAliyah[],
  stats: Stats | null,
  filters: Filters,
): DisplayEntry[] {
  const entries: DisplayEntry[] = [];
  for (const wa of weekdayAliyot) {
    if (wa.dateRead === '') continue;
    if (!isSeferAllowed(wa.sefer, filters)) continue;
    const year = yearOf(wa.dateRead);
    if (!yearAllowed(year, filters)) continue;
    entries.push({
      sefer:       wa.sefer,
      parsha:      wa.parsha,
      aliyah:      wa.aliyahNum,
      pseukim:     wa.pseukim,
      pct:         pctOf(wa.pseukim, stats),
      occasion:    '',
      note:        wa.note,
      location:    wa.location,
      reread:      false,
      displayDate: wa.dateRead,
      displayYear: year,
      chapterStart: wa.chapterStart, verseStart: wa.verseStart,
      chapterEnd:   wa.chapterEnd,   verseEnd:   wa.verseEnd,
    });
  }
  return entries;
}

/** Hosafot (added/split aliyot). */
export function collectHosafotEntries(
  hosafotReadings: MappedHosafah[],
  stats: Stats | null,
  filters: Filters,
): DisplayEntry[] {
  const entries: DisplayEntry[] = [];
  for (const hr of hosafotReadings) {
    if (!hr.dateRead) continue;
    if (!isSeferAllowed(hr.sefer, filters)) continue;
    const year = yearOf(hr.dateRead);
    if (!yearAllowed(year, filters)) continue;
    const verseRange = `${hr.chapterStart}:${hr.verseStart}–${hr.chapterEnd}:${hr.verseEnd}`;
    entries.push({
      sefer:       hr.sefer,
      parsha:      hr.parsha1,
      aliyah:      'hosafah',
      pseukim:     hr.pseukim,
      pct:         pctOf(hr.pseukim, stats),
      occasion:    hr.note,
      note:        hr.occasionEn ? `${verseRange} · ${hr.occasionEn}` : verseRange,
      location:    hr.location,
      reread:      false,
      displayDate: hr.dateRead,
      displayYear: year,
    });
  }
  return entries;
}

/** A double-parsha combined aliyah: one summary row plus the component weekend aliyot it spans. */
export interface CombinedAliyah {
  summary: DisplayEntry;
  components: DisplayEntry[];
}

/**
 * Splits a single day's entries into double-parsha combined-aliyah groups and loose singles.
 * Only aliyot actually read as part of a double parsha (readAsDouble) are grouped — pair
 * membership alone is not enough, since a pairable parsha's aliyot carry pair metadata even when
 * read standalone. Each group's summary aggregates the pseukim/pct of the components actually
 * read (so partial reads stay honest), and is marked re-read only when every component is.
 */
export function groupDoubleParsha(day: DisplayEntry[]): { combined: CombinedAliyah[]; singles: DisplayEntry[] } {
  const singles: DisplayEntry[] = [];
  const groups = new Map<string, DisplayEntry[]>();
  const order: string[] = [];

  for (const e of day) {
    if (e.readAsDouble && e.pairNameEn && e.combinedAliyah != null) {
      const key = `${e.pairNameEn}|${e.combinedAliyah}`;
      let arr = groups.get(key);
      if (!arr) { arr = []; groups.set(key, arr); order.push(key); }
      arr.push(e);
    } else {
      singles.push(e);
    }
  }

  const combined: CombinedAliyah[] = order.map(key => {
    const components = groups.get(key)!;
    const first      = components[0]!;
    const summary: DisplayEntry = {
      sefer:          first.sefer,
      parsha:         first.parsha,
      pairName:       first.pairName,
      pairNameEn:     first.pairNameEn,
      combinedAliyah: first.combinedAliyah,
      isDoubleParsha: true,
      aliyah:         first.combinedAliyah ?? '',
      pseukim:        components.reduce((s, c) => s + c.pseukim, 0),
      pct:            components.reduce((s, c) => s + c.pct, 0),
      occasion:       '',
      location:       '',
      reread:         components.every(c => c.reread),
      displayDate:    first.displayDate,
      displayYear:    first.displayYear,
    };
    return { summary, components };
  });

  return { combined, singles };
}
