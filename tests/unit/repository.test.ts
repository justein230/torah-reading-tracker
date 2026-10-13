// @vitest-environment node

import { beforeEach, describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createDb } from '../../src/db/drizzle-server';
import { initDb } from '../../src/db/init';
import { createRepository, RepoError, cleanText, cleanOrNull, isUniqueConstraint, type Repository } from '../../src/db/repository';
import { localDateStr } from '../../src/utils/dates';
import { MIGRATIONS_DIR } from '../helpers/migrations';

// The repository is what both the server and the native app run, so this suite exercises the
// shared logic (validation, 404/409 mapping, reading-type rules, cleaning) against a real,
// migrated and seeded in-memory database.

let raw: InstanceType<typeof Database>;
let repo: Repository;

beforeEach(() => {
  raw = new Database(':memory:');
  raw.pragma('foreign_keys = OFF');
  initDb(raw, MIGRATIONS_DIR);
  raw.pragma('foreign_keys = ON');
  repo = createRepository(createDb(raw), async (sql, params = []) => raw.prepare(sql).all(...params));
});

const one = <T = Record<string, unknown>>(sql: string, ...params: unknown[]) => raw.prepare(sql).get(...params) as T;
const aliyah = () => one<{ parsha: string; aliyah: number }>('SELECT p.name AS parsha, a.aliyah FROM aliyot a JOIN parshiot p ON p.id = a.parsha_id ORDER BY a.id LIMIT 1');
const rejection = async (work: Promise<unknown>) => work.then(() => null, (e: unknown) => e as RepoError);

const hosafah = (over: Record<string, unknown> = {}) => ({
  sefer: one<{ name: string }>('SELECT name FROM sefarim LIMIT 1').name,
  chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 3, pseukim: 3, date_read: '2025-01-01', ...over,
});

describe('text cleaning', () => {
  it('strips control characters and trims', () => {
    expect(cleanText('  a\u0000b\nc\u007F ')).toBe('abc');
  });

  it.each([
    [undefined, null], [null, null], ['', null], ['\u0001\u0002', null], [' Shul ', 'Shul'],
  ])('cleanOrNull(%j) → %j', (input, expected) => {
    expect(cleanOrNull(input)).toBe(expected);
  });
});

describe('isUniqueConstraint', () => {
  it.each([
    [{ code: 'SQLITE_CONSTRAINT_UNIQUE' }, true],                                  // better-sqlite3
    [new Error('UNIQUE constraint failed: readings.aliyah_id'), true],             // Capacitor plugin
    [{ cause: { code: 'SQLITE_CONSTRAINT_UNIQUE' } }, true],                       // wrapped by Drizzle
    [new Error('something else'), false],
    [null, false],
    ['UNIQUE constraint failed', false],
  ])('%j → %s', (e, expected) => {
    expect(isUniqueConstraint(e)).toBe(expected);
  });
});

describe('fetchMeta', () => {
  it('returns every sefer with its per-chapter verse counts, plus parshiot and pairs', async () => {
    const meta = await repo.fetchMeta();
    expect(meta.sefarim.length).toBeGreaterThan(0);
    expect(meta.sefarim.every(s => s.chapter_verses.length > 0)).toBe(true);
    expect(meta.parshiot).toHaveLength(54);
    expect(meta.pairs.length).toBeGreaterThan(0);
  });
});

describe('standard readings', () => {
  it('records the first reading of an aliyah as standard, then later ones as additional', async () => {
    const a = aliyah();
    const first  = await repo.postReading({ ...a, date_read: '2025-01-01' });
    const second = await repo.postReading({ ...a, date_read: '2025-02-01' });
    expect(first.reading_type).toBe('standard');
    expect(second.reading_type).toBe('additional');
  });

  it('honours a requested double_parsha only for the first reading', async () => {
    const a = aliyah();
    expect((await repo.postReading({ ...a, date_read: '2025-01-01', reading_type: 'double_parsha' })).reading_type).toBe('double_parsha');
    expect((await repo.postReading({ ...a, date_read: '2025-02-01', reading_type: 'double_parsha' })).reading_type).toBe('additional');
  });

  it.each([
    ['parsha', { parsha: '' }, 'parsha is required'],
    ['several fields', { parsha: '', aliyah: 0 }, 'parsha, aliyah are required'],
  ])('400s when %s missing', async (_label, over, detail) => {
    const err = await rejection(repo.postReading({ ...aliyah(), date_read: '2025-01-01', ...over }));
    expect(err).toMatchObject({ status: 400, detail });
  });

  it('404s on an unknown aliyah', async () => {
    const err = await rejection(repo.postReading({ parsha: 'Nope', aliyah: 1, date_read: '2025-01-01' }));
    expect(err).toMatchObject({ status: 404, detail: 'Aliyah not found' });
  });

  it('409s on the same aliyah and date twice', async () => {
    const body = { ...aliyah(), date_read: '2025-01-01' };
    await repo.postReading(body);
    const err = await rejection(repo.postReading(body));
    expect(err).toBeInstanceOf(RepoError);
    expect(err).toMatchObject({ status: 409, detail: 'This aliyah was already recorded on that date.' });
  });

  it('cleans occasion and location, storing empty ones as NULL', async () => {
    const { id } = await repo.postReading({ ...aliyah(), date_read: '2025-01-01', occasion: 'Pesach\u0000', location: '\u0001' });
    expect(one('SELECT occasion, location FROM readings WHERE id = ?', id)).toEqual({ occasion: 'Pesach', location: null });
  });

  it('updates occasion and location, and 404s for a missing id', async () => {
    const { id } = await repo.postReading({ ...aliyah(), date_read: '2025-01-01' });
    await repo.putReading(id, { occasion: ' Shabbat ', location: '' });
    expect(one('SELECT occasion, location FROM readings WHERE id = ?', id)).toEqual({ occasion: 'Shabbat', location: null });
    expect(await rejection(repo.putReading(999999, {}))).toMatchObject({ status: 404, detail: 'Reading not found' });
  });

  it('deletes a reading, and 404s a second time', async () => {
    const { id } = await repo.postReading({ ...aliyah(), date_read: '2025-01-01' });
    await repo.deleteReading(id);
    expect(one('SELECT COUNT(*) AS n FROM readings').n).toBe(0);
    expect(await rejection(repo.deleteReading(id))).toMatchObject({ status: 404 });
  });
});

describe('special readings', () => {
  const occasionAliyah = () => one<{ id: number }>('SELECT id FROM occasion_aliyot LIMIT 1').id;

  it('creates, rejects duplicates, and deletes', async () => {
    const body = { occasion_aliyah_id: occasionAliyah(), date_read: '2025-01-01', note: 'n' };
    const { id } = await repo.postSpecialReading(body);
    expect(await rejection(repo.postSpecialReading(body))).toMatchObject({ status: 409 });
    await repo.deleteSpecialReading(id);
    expect(await rejection(repo.deleteSpecialReading(id))).toMatchObject({ status: 404, detail: 'Special reading not found' });
  });

  it('400s without date_read and 404s for an unknown occasion aliyah', async () => {
    expect(await rejection(repo.postSpecialReading({ occasion_aliyah_id: occasionAliyah(), date_read: '' }))).toMatchObject({ status: 400 });
    expect(await rejection(repo.postSpecialReading({ occasion_aliyah_id: 999999, date_read: '2025-01-01' }))).toMatchObject({ status: 404, detail: 'Occasion aliyah not found' });
  });
});

describe('weekday readings', () => {
  const weekdayAliyah = () => one<{ id: number }>('SELECT id FROM weekday_aliyot LIMIT 1').id;

  it('creates, edits (empty note/location become NULL) and deletes', async () => {
    const { id } = await repo.postWeekdayReading({ weekday_aliyah_id: weekdayAliyah(), date_read: '2025-01-01', note: 'x', location: 'y' });
    await repo.putWeekdayReading(id, { date_read: '2025-01-02', note: '', location: undefined });
    expect(one('SELECT date_read, note, location FROM weekday_readings WHERE id = ?', id)).toEqual({ date_read: '2025-01-02', note: null, location: null });
    await repo.deleteWeekdayReading(id);
    expect(one('SELECT COUNT(*) AS n FROM weekday_readings').n).toBe(0);
  });

  it('400s an edit without date_read and 404s a missing id', async () => {
    expect(await rejection(repo.putWeekdayReading(1, { date_read: '' }))).toMatchObject({ status: 400 });
    expect(await rejection(repo.putWeekdayReading(999999, { date_read: '2025-01-01' }))).toMatchObject({ status: 404, detail: 'Weekday reading not found' });
  });
});

describe('hosafot readings', () => {
  it('creates, edits and deletes', async () => {
    const { id } = await repo.postHosafah(hosafah({ chapter_start: '2' }));
    expect(one('SELECT chapter_start FROM hosafot_readings WHERE id = ?', id)).toEqual({ chapter_start: 2 });
    await repo.putHosafah(id, { date_read: '2025-03-03', note: ' n ' });
    expect(one('SELECT date_read, note, location FROM hosafot_readings WHERE id = ?', id)).toEqual({ date_read: '2025-03-03', note: 'n', location: null });
    await repo.deleteHosafah(id);
    expect(await rejection(repo.deleteHosafah(id))).toMatchObject({ status: 404, detail: 'Hosafah reading not found' });
  });

  it.each(['chapter_start', 'verse_start', 'chapter_end', 'verse_end', 'pseukim'])('400s when %s is not a positive integer', async field => {
    expect(await rejection(repo.postHosafah(hosafah({ [field]: 'abc' })))).toMatchObject({ status: 400, detail: `${field} must be a positive integer` });
    expect(await rejection(repo.postHosafah(hosafah({ [field]: -1 })))).toMatchObject({ status: 400 });
  });

  it('400s when required fields are missing', async () => {
    expect(await rejection(repo.postHosafah(hosafah({ sefer: '', date_read: '' })))).toMatchObject({ status: 400, detail: 'sefer, date_read are required' });
  });
});

describe('fetchLocationStats', () => {
  it('splits readings into past and upcoming around today (local)', async () => {
    const a = aliyah();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await repo.postReading({ ...a, date_read: localDateStr(), location: 'Shul' });
    await repo.postReading({ ...a, date_read: localDateStr(tomorrow), location: 'Shul' });
    expect(await repo.fetchLocationStats()).toEqual([{ location: 'Shul', count: 2, past_count: 1, upcoming_count: 1 }]);
  });
});

describe('fetchOccasions', () => {
  it('maps snake_case columns to the camelCase OccasionRecord', async () => {
    const [first] = await repo.fetchOccasions();
    expect(Object.keys(first ?? {}).sort()).toEqual(['category', 'id', 'name', 'nameEn', 'sortOrder']);
  });
});
