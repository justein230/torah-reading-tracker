import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema.js';

type CapacitorConn = Awaited<ReturnType<import('@capacitor-community/sqlite').SQLiteConnection['createConnection']>>;

export function createNativeDb(getConn: () => Promise<CapacitorConn>) {
  return drizzle(async (sql, params, method) => {
    const conn = await getConn();
    if (method === 'run') {
      await conn.run(sql, params as (string | number | null)[]);
      return { rows: [] };
    }
    const result = await conn.query(sql, params as (string | number | null)[]);
    const rows = (result.values ?? []).map(row =>
      Object.values(row as Record<string, unknown>)
    );
    // .get() wants the matched row itself (or undefined), not a one-element array of rows.
    return { rows: (method === 'get' ? rows[0] : rows) as unknown[] };
  }, { schema });
}

export type NativeDb = ReturnType<typeof createNativeDb>;
