/**
 * Builds demo databases for store screenshots, with none of the real reading history:
 * a freshly migrated db per profile, filled with generated readings (src/utils/demoReadings.ts).
 *
 *   npm run db:demo                          # every profile
 *   npm run db:demo -- showcase              # one profile
 *   npm run db:demo -- showcase --as-of 2026-11-02 --seed 7
 *
 * Writes demo/torah-demo-<profile>.db, replacing any earlier one. Never touches torah.db.
 */
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import Database from 'better-sqlite3';
import { initDb } from '../src/db/init.js';
import { createDb } from '../src/db/drizzle-server.js';
import { createRepository } from '../src/db/repository.js';
import { loadDemoReference, writeDemoPlan } from '../src/db/demoSeed.js';
import { DEMO_PROFILES, mulberry32, planDemoReadings, type DemoProfileName } from '../src/utils/demoReadings.js';
import { localDateStr } from '../src/utils/dates.js';
import { SEDRA_CACHE } from '../src/data/sedraCache.js';
import { HOLIDAY_CACHE } from '../src/data/holidayCache.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { 'as-of': { type: 'string' }, seed: { type: 'string', default: '5778' } },
});
const asOf  = values['as-of'] ?? localDateStr();
const seed  = Number(values.seed);
const names = (positionals.length ? positionals : Object.keys(DEMO_PROFILES)) as DemoProfileName[];
for (const name of names) {
  if (!(name in DEMO_PROFILES)) throw new Error(`Unknown profile "${name}". Profiles: ${Object.keys(DEMO_PROFILES).join(', ')}`);
}

const { version: appVersion } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
fs.mkdirSync(path.join(ROOT, 'demo'), { recursive: true });

for (const name of names) {
  const dbPath = path.join(ROOT, 'demo', `torah-demo-${name}.db`);
  fs.rmSync(dbPath, { force: true });

  const raw = new Database(dbPath);
  raw.pragma('journal_mode = DELETE');
  raw.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
  initDb(raw, path.join(ROOT, 'drizzle'), () => {}, { appVersion });
  raw.pragma('foreign_keys = ON');

  const db   = createDb(raw);
  const repo = createRepository(db, async (sql, params = []) => raw.prepare(sql).all(...params));
  const plan = planDemoReadings(await loadDemoReference(db), { sedra: SEDRA_CACHE, holidays: HOLIDAY_CACHE }, DEMO_PROFILES[name], asOf, mulberry32(seed));
  raw.exec('BEGIN'); // one transaction: thousands of separately-synced inserts take minutes
  await writeDemoPlan(repo, plan);
  raw.exec('COMMIT');

  const count = (sql: string) => (raw.prepare(sql).get() as { n: number }).n;
  const read  = count(`SELECT COUNT(DISTINCT aliyah_id) n FROM readings r JOIN aliyot a ON a.id = r.aliyah_id WHERE a.aliyah != 8 AND r.date_read <= '${asOf}'`);
  console.log(`${name.padEnd(9)} ${String(read).padStart(3)}/378 aliyot read by ${asOf} · `
    + `${plan.readings.length} readings (${count("SELECT COUNT(*) n FROM readings WHERE reading_type = 'additional'")} re-reads, `
    + `${plan.readings.filter(r => r.date_read > asOf).length} upcoming) · ${plan.special.length} holiday · `
    + `${plan.weekday.length} weekday · ${plan.hosafot.length} hosafot → ${path.relative(ROOT, dbPath)}`);
  raw.close();
}
