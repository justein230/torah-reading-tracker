// @vitest-environment node

import { beforeAll, describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createDb } from '../../src/db/drizzle-server';
import { initDb } from '../../src/db/init';
import { createRepository } from '../../src/db/repository';
import { loadDemoReference, writeDemoPlan } from '../../src/db/demoSeed';
import { DEMO_PROFILES, mulberry32, planDemoReadings, type DemoPlan, type DemoReference, type DemoProfileName } from '../../src/utils/demoReadings';
import { holidayDatesFromEntries } from '../../src/utils/occasionDates';
import { mapRow, enrichRows } from '../../src/api';
import { computeStats } from '../../src/compute';
import { buildMetaLookups } from '../../src/utils/metaLookups';
import { localDateStr } from '../../src/utils/dates';
import { SEDRA_CACHE } from '../../src/data/sedraCache';
import { HOLIDAY_CACHE } from '../../src/data/holidayCache';
import { MIGRATIONS_DIR } from '../helpers/migrations';
import { groupBy } from '../../src/utils/format';
import type { Filters } from '../../src/types/index.js';

// The demo databases behind the store screenshots. The plan must only use real dates, never hit a
// unique constraint, and — written through the repository and read back through the app's own
// stats pipeline — show exactly the coverage it planned.

const CAL   = { sedra: SEDRA_CACHE, holidays: HOLIDAY_CACHE };
// mapRow judges past/future against the real clock, so plan as of today for the stats checks.
const AS_OF = localDateStr();
const NO_FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: true, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

function migratedDb() {
  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = OFF');
  initDb(raw, MIGRATIONS_DIR);
  raw.pragma('foreign_keys = ON');
  const db = createDb(raw);
  return { raw, db, repo: createRepository(db, async (sql, params = []) => raw.prepare(sql).all(...params)) };
}

let ref: DemoReference;
const plans = {} as Record<DemoProfileName, DemoPlan>;

beforeAll(async () => {
  ref = await loadDemoReference(migratedDb().db);
  for (const name of Object.keys(DEMO_PROFILES) as DemoProfileName[]) {
    plans[name] = planDemoReadings(ref, CAL, DEMO_PROFILES[name], AS_OF, mulberry32(1));
  }
});

const isStandard = (a: { aliyah: number }) => a.aliyah !== 8;
/** Distinct non-maftir aliyot the plan reads on or before AS_OF. */
function plannedRead(plan: DemoPlan): Set<string> {
  const maftir = new Set(ref.aliyot.filter(a => !isStandard(a)).map(a => `${a.parsha}|${a.aliyah}`));
  return new Set(plan.readings.filter(r => r.date_read <= AS_OF).map(r => `${r.parsha}|${r.aliyah}`).filter(k => !maftir.has(k)));
}

describe('mulberry32', () => {
  it('repeats for a seed and differs between seeds', () => {
    const take = (seed: number) => { const r = mulberry32(seed); return [r(), r(), r()]; };
    expect(take(42)).toEqual(take(42));
    expect(take(42)).not.toEqual(take(43));
    expect(take(42).every(x => x >= 0 && x < 1)).toBe(true);
  });
});

describe('planDemoReadings', () => {
  it('is deterministic for a seed', () => {
    const again = planDemoReadings(ref, CAL, DEMO_PROFILES.showcase, AS_OF, mulberry32(1));
    expect(again).toEqual(plans.showcase);
    expect(planDemoReadings(ref, CAL, DEMO_PROFILES.showcase, AS_OF, mulberry32(2))).not.toEqual(plans.showcase);
  });

  it('plans nothing for the empty profile', () => {
    expect(plans.empty).toEqual({ readings: [], special: [], weekday: [], hosafot: [] });
  });

  it.each(Object.keys(DEMO_PROFILES) as DemoProfileName[])('%s: reads each aliyah on a real date of its parsha', name => {
    const parshaEn = new Map(ref.aliyot.map(a => [a.parsha, a.parshaEn]));
    const pairEn   = new Map(ref.pairs.map(p => [p.id, p.nameEn]));
    // The parshiot (English) read on each Shabbat: the week's own name, or both halves of a pair.
    const halves   = new Map(ref.pairs.map(p => [p.nameEn, [p.parsha1Id, p.parsha2Id].map(id => ref.aliyot.find(a => a.parshaId === id)!.parshaEn)]));
    const sedraOn  = new Map(SEDRA_CACHE.map(([d, n]) => [d, n]));
    const simchatTorah = new Set(holidayDatesFromEntries(HOLIDAY_CACHE, ['Simchat Torah']).occasionDates['Simchat Torah']);
    for (const r of plans[name].readings) {
      const week = sedraOn.get(r.date_read) ?? '';
      if (r.reading_type === 'double_parsha') expect(week).toBe(pairEn.get(r.pair_id!));
      else if (parshaEn.get(r.parsha) === 'Vezot Haberakhah') expect(simchatTorah.has(r.date_read)).toBe(true);
      else expect(halves.get(week) ?? [week]).toContain(parshaEn.get(r.parsha));
    }
  });

  it.each(Object.keys(DEMO_PROFILES) as DemoProfileName[])('%s: holiday readings fall on that occasion\'s dates', name => {
    const occasionOf = new Map(ref.occasionAliyot.map(oa => [oa.id, oa.occasionEn]));
    const { occasionDates } = holidayDatesFromEntries(HOLIDAY_CACHE, [...new Set(occasionOf.values())]);
    for (const s of plans[name].special) {
      expect(occasionDates[occasionOf.get(s.occasion_aliyah_id)!]).toContain(s.date_read);
    }
  });

  it.each(Object.keys(DEMO_PROFILES) as DemoProfileName[])('%s: never repeats an (aliyah, date) or a weekday aliyah', name => {
    const { readings, special, weekday } = plans[name];
    const keys = (rows: { date_read: string }[], id: (r: never) => string | number) => rows.map(r => `${id(r as never)}|${r.date_read}`);
    expect(new Set(keys(readings, (r: { parsha: string; aliyah: number }) => `${r.parsha}|${r.aliyah}`)).size).toBe(readings.length);
    expect(new Set(keys(special, (r: { occasion_aliyah_id: number }) => r.occasion_aliyah_id)).size).toBe(special.length);
    expect(new Set(weekday.map(w => w.weekday_aliyah_id)).size).toBe(weekday.length);
  });

  it('showcase: a fraction of the Torah read, a few readings scheduled ahead', () => {
    const plan = plans.showcase;
    const read = plannedRead(plan);
    expect(read.size / 378).toBeGreaterThan(0.15);
    expect(read.size / 378).toBeLessThan(0.45);
    expect(plan.readings.some(r => r.date_read > AS_OF)).toBe(true);
    expect(plan.special.every(r => r.date_read <= AS_OF)).toBe(true);
    expect(plan.readings.some(r => r.reading_type === 'double_parsha')).toBe(true);
    expect(plan.weekday.length).toBeGreaterThan(0);
    expect(plan.special.length).toBeGreaterThan(0);
    expect(plan.hosafot).toHaveLength(DEMO_PROFILES.showcase.hosafot);
  });

  it.each(['starter', 'showcase'] as const)('%s: 1–3 aliyot a sitting', name => {
    // A combined aliyah of a double week spans several aliyot, so count those by combined number.
    const unit = new Map(ref.aliyot.map(a => [`${a.parsha}|${a.aliyah}`, a]));
    const sittings = groupBy([...plans[name].readings, ...plans[name].special.map(s => ({ ...s, kind: 'special' }))], r => r.date_read);
    for (const [, rows] of sittings) {
      const units = new Set(rows.map(r => 'occasion_aliyah_id' in r ? `oa${r.occasion_aliyah_id}`
        : r.reading_type === 'double_parsha' ? `c${unit.get(`${r.parsha}|${r.aliyah}`)!.combinedAliyah}` : `${r.parsha}|${r.aliyah}`));
      expect(units.size).toBeLessThanOrEqual(3);
    }
  });

  it('complete: every aliyah read by the as-of date', () => {
    expect(plannedRead(plans.complete).size).toBe(378);
  });

  it('starter: a few weeks of partial readings', () => {
    const read = plannedRead(plans.starter);
    expect(read.size).toBeGreaterThan(5);
    expect(read.size).toBeLessThan(30);
  });
});

/** Seeds a fresh db with `plan` and runs it through the app's own load → stats pipeline. */
async function seededStats(plan: DemoPlan) {
  const { raw, repo } = migratedDb();
  raw.exec('BEGIN');
  await writeDemoPlan(repo, plan);
  raw.exec('COMMIT');
  const rows = enrichRows((await repo.fetchAliyot()).map(mapRow));
  const { SEFER_ORDER, SEFER_MAP } = buildMetaLookups(await repo.fetchMeta(), rows);
  return { raw, stats: computeStats(rows, [], SEFER_ORDER, SEFER_MAP, NO_FILTERS) };
}

const pos = (chapter: number, verse: number) => chapter * 1000 + verse;

describe('a seeded demo database', () => {
  it.each(['starter', 'showcase'] as const)('%s: the app counts each planned aliyah once, plus those inside one', async name => {
    // Standard readings only, so the expected count needs no holiday-coverage rules: an aliyah is
    // read when it, or another aliyah of its parsha containing its verses (a maftir inside
    // aliyah 7), was read by today. Each is counted once however often it was read.
    const plan = { ...plans[name], special: [], weekday: [], hosafot: [] };
    const readRows = ref.aliyot.filter(a => plan.readings.some(r => r.date_read <= AS_OF && r.parsha === a.parsha && r.aliyah === a.aliyah));
    const expected = ref.aliyot.filter(a => readRows.some(o => o.parshaId === a.parshaId
      && pos(o.chapterStart, o.verseStart) <= pos(a.chapterStart, a.verseStart)
      && pos(o.chapterEnd, o.verseEnd) >= pos(a.chapterEnd, a.verseEnd)));

    const { stats } = await seededStats(plan);
    expect(stats.totalAliyot).toBe(ref.aliyot.length);
    expect(stats.readAliyot).toBe(expected.length);
  });

  it.each(['showcase', 'complete'] as const)('%s: every write is accepted and re-reads are recorded as additional', async name => {
    const { raw, stats } = await seededStats(plans[name]);
    if (name === 'complete') expect(stats.readAliyot).toBe(ref.aliyot.length);

    // The first reading of each aliyah counts; every later one is recorded as a re-read.
    const types = raw.prepare('SELECT reading_type, COUNT(*) n FROM readings GROUP BY reading_type').all() as { reading_type: string; n: number }[];
    const distinct = (raw.prepare('SELECT COUNT(DISTINCT aliyah_id) n FROM readings').get() as { n: number }).n;
    const counted  = types.filter(t => t.reading_type !== 'additional').reduce((s, t) => s + t.n, 0);
    expect(counted).toBe(distinct);
    expect(types.reduce((s, t) => s + t.n, 0)).toBe(plans[name].readings.length);
  });

  it('showcase: a few hundred pseukim a year', async () => {
    // Everything read in each full past year: Shabbat, holiday, weekday and hosafot.
    const { raw } = await seededStats(plans.showcase);
    const perYear = raw.prepare(`
      SELECT substr(date_read, 1, 4) year, SUM(pseukim) n FROM (
        SELECT r.date_read, a.pseukim FROM readings r JOIN aliyot a ON a.id = r.aliyah_id
        UNION ALL SELECT s.date_read, oa.pseukim FROM special_readings s JOIN occasion_aliyot oa ON oa.id = s.occasion_aliyah_id
        UNION ALL SELECT w.date_read, wa.pseukim FROM weekday_readings w JOIN weekday_aliyot wa ON wa.id = w.weekday_aliyah_id
        UNION ALL SELECT date_read, pseukim FROM hosafot_readings
      ) GROUP BY year`).all() as { year: string; n: number }[];
    const fullYears = perYear.filter(y => y.year < AS_OF.slice(0, 4));
    expect(fullYears).toHaveLength(3);
    for (const { n } of fullYears) {
      expect(n).toBeGreaterThan(300);
      expect(n).toBeLessThan(650);
    }
  });
});
