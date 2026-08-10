import type { Database } from 'better-sqlite3';
import { READINGS_SQL, SPECIAL_READINGS_SQL, WEEKDAY_ALIYOT_SQL, HOSAFOT_READINGS_SQL } from '../db/queries.js';

interface StdRow     { date_read: string; parsha_en: string; aliyah: number; pair_name: string; location: string }
interface SpecialRow { date_read: string; parsha_en: string; aliyah_key: string; occasion_en: string; location: string }
interface WeekdayRow { parsha_en: string; aliyah_num: number; all_dates: string; location: string }
interface HosafahRow { date_read: string; parsha1_en: string; sefer: string; occasion_en: string; location: string }

function collectEntries(rawDb: Database): { date_read: string; label: string; location: string }[] {
  const entries: { date_read: string; label: string; location: string }[] = [];

  for (const r of rawDb.prepare(READINGS_SQL).all() as StdRow[]) {
    const parsha = r.pair_name || r.parsha_en;
    entries.push({ date_read: r.date_read, label: `${parsha} – Aliyah ${r.aliyah}`, location: r.location });
  }

  for (const r of rawDb.prepare(SPECIAL_READINGS_SQL).all() as SpecialRow[]) {
    entries.push({ date_read: r.date_read, label: `${r.parsha_en} – ${r.occasion_en} (${r.aliyah_key})`, location: r.location });
  }

  for (const r of rawDb.prepare(WEEKDAY_ALIYOT_SQL).all() as WeekdayRow[]) {
    if (!r.all_dates) continue;
    for (const d of r.all_dates.split(','))
      entries.push({ date_read: d.trim(), label: `${r.parsha_en} – Weekday Aliyah ${r.aliyah_num}`, location: r.location });
  }

  for (const r of rawDb.prepare(HOSAFOT_READINGS_SQL).all() as HosafahRow[]) {
    const base = r.parsha1_en || r.sefer;
    const tag  = r.occasion_en ? ` (${r.occasion_en})` : '';
    entries.push({ date_read: r.date_read, label: `${base} – Hosafah${tag}`, location: r.location });
  }

  return entries;
}

export async function buildCalendarFeed(rawDb: Database): Promise<string> {
  const { default: ical } = await import('ical-generator');
  const cal = ical({ name: 'Torah Readings' });

  // Group by (date, location) so same-day readings at different locations become separate events.
  // Readings with no location recorded group together under an empty-string key.
  const byDateLocation = new Map<string, { date: string; location: string; labels: string[] }>();
  for (const { date_read, label, location } of collectEntries(rawDb)) {
    const key   = `${date_read}\0${location}`;
    const entry = byDateLocation.get(key) ?? { date: date_read, location, labels: [] };
    entry.labels.push(label);
    byDateLocation.set(key, entry);
  }

  // Sort by date then location so IDs are stable regardless of insertion order.
  const groups = [...byDateLocation.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.location.localeCompare(b.location)
  );

  // Track how many events exist per date so we can assign unique IDs when there are multiple.
  const dateCounts = new Map<string, number>();
  for (const { date } of groups) dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1);
  const dateIdx   = new Map<string, number>();

  for (const { date, location, labels } of groups) {
    const [y, m, d] = date.split('-').map(Number) as [number, number, number];
    const parshas   = [...new Set(labels.map(l => l.split(' – ')[0]))].join(', ');
    const n         = (dateIdx.get(date) ?? 0) + 1;
    dateIdx.set(date, n);
    const id        = dateCounts.get(date) === 1
      ? `torah-${date}@torah-tracker`
      : `torah-${date}-${n}@torah-tracker`;

    cal.createEvent({
      id,
      start:       new Date(y, m - 1, d),
      end:         new Date(y, m - 1, d),
      allDay:      true,
      summary:     `Torah Reading – ${parshas}`,
      description: labels.join('\n'),
      ...(location ? { location } : {}),
    });
  }

  return cal.toString();
}
