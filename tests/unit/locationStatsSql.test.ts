import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { LOCATION_STATS_SQL } from '../../src/db/queries.js';

// Only the two columns the query reads, in each of the four reading tables it unions.
function dbWithReadings(rows: Record<string, Array<[string | null, string]>>) {
  const db = new Database(':memory:');
  for (const table of ['readings', 'special_readings', 'weekday_readings', 'hosafot_readings']) {
    db.exec(`CREATE TABLE ${table} (location TEXT, date_read TEXT)`);
    for (const [location, date] of rows[table] ?? []) {
      db.prepare(`INSERT INTO ${table} (location, date_read) VALUES (?, ?)`).run(location, date);
    }
  }
  return db;
}

// Both platforms pass today's local date as two positional parameters (past bucket, upcoming bucket).
const statsFor = (db: ReturnType<typeof dbWithReadings>, today: string) =>
  db.prepare(LOCATION_STATS_SQL).all(today, today);

describe('LOCATION_STATS_SQL', () => {
  it('splits readings into past (today included) and upcoming by the bound date', () => {
    const db = dbWithReadings({ readings: [['Shul', '2026-06-14'], ['Shul', '2026-06-15'], ['Shul', '2026-06-16']] });
    expect(statsFor(db, '2026-06-15')).toEqual([{ location: 'Shul', count: 3, past_count: 2, upcoming_count: 1 }]);
  });

  it('counts all four reading tables, and groups a missing location under an empty name', () => {
    const db = dbWithReadings({
      readings:         [['Shul', '2026-01-01']],
      special_readings: [['Shul', '2099-01-01']],
      weekday_readings: [[null,   '2026-01-02']],
      hosafot_readings: [['Home', '2099-01-02']],
    });
    expect(statsFor(db, '2026-06-15')).toEqual([
      { location: 'Shul', count: 2, past_count: 1, upcoming_count: 1 },
      { location: '',     count: 1, past_count: 1, upcoming_count: 0 },
      { location: 'Home', count: 1, past_count: 0, upcoming_count: 1 },
    ]);
  });
});
