// BACKUP — not wired in; see import-readings-server.ts.
//
// "Import readings into a fresh database": the fallback for a file the normal import can't take
// (made by a newer app version, or its migration fails). The upload is ATTACHed as `up` to a
// freshly migrated database, and only user data is copied across. Every id is translated by its
// stable name-based key (parsha name + aliyah number, occasion name, …), never copied raw, and a
// row whose key has no match in this version is skipped. Plain SQL, so the server and the native
// app share it.

export interface ReadingsImportSummary {
  imported:       number;
  skipped:        Record<string, number>; // per table, rows whose key had no match
  droppedColumns: string[];               // "table.column" in the upload this version doesn't know
}

// Keyed by table; each selects only the columns this version knows, so extra columns in a newer
// file are ignored. The WHERE clauses skip a row whose optional reference didn't match, rather
// than silently nulling it.
export const COPY_READINGS_SQL: Record<string, string> = {
  readings: `
    INSERT INTO readings (aliyah_id, date_read, occasion, location, reading_type, pair_id, created_at)
    SELECT a.id, r.date_read, r.occasion, r.location, r.reading_type, pp.id, r.created_at
    FROM up.readings r
    JOIN up.aliyot   ua  ON ua.id  = r.aliyah_id
    JOIN up.parshiot uap ON uap.id = ua.parsha_id
    JOIN parshiot    p   ON p.name = uap.name
    JOIN aliyot      a   ON a.parsha_id = p.id AND a.aliyah = ua.aliyah
    LEFT JOIN up.parsha_pairs upp ON upp.id  = r.pair_id
    LEFT JOIN parsha_pairs    pp  ON pp.name = upp.name
    WHERE r.pair_id IS NULL OR pp.id IS NOT NULL`,

  special_readings: `
    INSERT INTO special_readings (occasion_aliyah_id, date_read, note, location, created_at)
    SELECT oa.id, s.date_read, s.note, s.location, s.created_at
    FROM up.special_readings s
    JOIN up.occasion_aliyot uoa ON uoa.id  = s.occasion_aliyah_id
    JOIN up.occasions       uo  ON uo.id   = uoa.occasion_id
    JOIN occasions          o   ON o.name  = uo.name
    JOIN occasion_aliyot    oa  ON oa.occasion_id = o.id AND oa.aliyah_key = uoa.aliyah_key AND oa.is_shabbat_variant = uoa.is_shabbat_variant`,

  weekday_readings: `
    INSERT INTO weekday_readings (weekday_aliyah_id, date_read, note, location, created_at)
    SELECT wa.id, w.date_read, w.note, w.location, w.created_at
    FROM up.weekday_readings w
    JOIN up.weekday_aliyot uwa  ON uwa.id  = w.weekday_aliyah_id
    JOIN up.parshiot       uwap ON uwap.id = uwa.parsha_id
    JOIN parshiot          p    ON p.name  = uwap.name
    JOIN weekday_aliyot    wa   ON wa.parsha_id = p.id AND wa.aliyah_num = uwa.aliyah_num`,

  hosafot_readings: `
    INSERT INTO hosafot_readings (sefer, parsha_id_1, parsha_id_2, occasion_id, is_double_parsha, chapter_start, verse_start, chapter_end, verse_end, pseukim, date_read, note, location, created_at)
    SELECT h.sefer, p1.id, p2.id, o.id, h.is_double_parsha, h.chapter_start, h.verse_start, h.chapter_end, h.verse_end, h.pseukim, h.date_read, h.note, h.location, h.created_at
    FROM up.hosafot_readings h
    LEFT JOIN up.parshiot  up1 ON up1.id  = h.parsha_id_1
    LEFT JOIN parshiot     p1  ON p1.name = up1.name
    LEFT JOIN up.parshiot  up2 ON up2.id  = h.parsha_id_2
    LEFT JOIN parshiot     p2  ON p2.name = up2.name
    LEFT JOIN up.occasions uo  ON uo.id   = h.occasion_id
    LEFT JOIN occasions    o   ON o.name  = uo.name
    WHERE (h.parsha_id_1 IS NULL OR p1.id IS NOT NULL)
      AND (h.parsha_id_2 IS NULL OR p2.id IS NOT NULL)
      AND (h.occasion_id IS NULL OR o.id  IS NOT NULL)`,
};

export const countRowsSql = (table: string, schema: 'main' | 'up') => `SELECT COUNT(*) AS n FROM ${schema}.${table}`;
export const columnsSql   = (table: string, schema: 'main' | 'up') => `SELECT name FROM pragma_table_info('${table}', '${schema}')`;

// Builds the summary from per-table row counts and column names, gathered by the caller with
// countRowsSql/columnsSql on whichever driver it has.
export function summarizeReadingsImport(
  counts:  Record<string, { source: number; copied: number }>,
  columns: Record<string, { source: string[]; known: string[] }>,
): ReadingsImportSummary {
  const tables = Object.keys(COPY_READINGS_SQL);
  return {
    imported:       tables.reduce((sum, t) => sum + counts[t]!.copied, 0),
    skipped:        Object.fromEntries(tables.map(t => [t, counts[t]!.source - counts[t]!.copied]).filter(([, n]) => n)),
    droppedColumns: tables.flatMap(t => columns[t]!.source.filter(c => !columns[t]!.known.includes(c)).map(c => `${t}.${c}`)),
  };
}
