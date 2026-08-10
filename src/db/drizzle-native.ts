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
    return { rows };
  }, { schema });
}

export type NativeDb = ReturnType<typeof createNativeDb>;
