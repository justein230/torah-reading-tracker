// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import readExcelFile from 'read-excel-file/node';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

import { buildExportBuffer } from '../../src/utils/export-server';

const SEFARIM = [
  { name: 'בְּרֵאשִׁית', name_en: 'Genesis' },
  { name: 'שְׁמוֹת',     name_en: 'Exodus'  },
];

const ROWS = [
  { sefer: 'בְּרֵאשִׁית', parsha: 'Bereishit', aliyah: 1, double_parsha: '', pseukim: 100, pct: 1.5, orig: '2024-01-01', fut: '', occasion: 'Shabbat' },
  { sefer: 'בְּרֵאשִׁית', parsha: 'Bereishit', aliyah: 2, double_parsha: '', pseukim:  80, pct: 1.2, orig: '',           fut: '', occasion: '' },
  { sefer: 'שְׁמוֹת',     parsha: 'Shemot',    aliyah: 1, double_parsha: '', pseukim:  90, pct: 1.3, orig: '2024-03-01', fut: '', occasion: '' },
];

// Fixed "today" so future-dated rows stay future regardless of when the suite runs.
const TODAY = '2024-06-01';

// One row already read (past), one scheduled for a future Shabbat, one reread-only
// (fut set, orig empty) which shouldn't count toward either past or future.
const MIXED_ROWS = [
  { sefer: 'בְּרֵאשִׁית', parsha: 'Bereishit', aliyah: 1, double_parsha: '', pseukim: 100, pct: 1.5, orig: '2024-01-01', fut: '',           occasion: '' },
  { sefer: 'בְּרֵאשִׁית', parsha: 'Bereishit', aliyah: 2, double_parsha: '', pseukim:  50, pct: 0.7, orig: '2024-12-01', fut: '',           occasion: '' },
  { sefer: 'שְׁמוֹת',     parsha: 'Shemot',    aliyah: 1, double_parsha: '', pseukim:  30, pct: 0.4, orig: '',           fut: '2024-09-01', occasion: '' },
];

async function readSheets(rows = ROWS, today?: string) {
  const buf = await buildExportBuffer(rows, SEFARIM, today);
  return readExcelFile(buf);
}

describe('buildExportBuffer', () => {
  it('returns a non-empty Buffer', async () => {
    const buf = await buildExportBuffer(ROWS, SEFARIM);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it('workbook has exactly two sheets: Portions and Summary', async () => {
    const sheets = await readSheets();
    expect(sheets.map(s => s.sheet)).toEqual(['Portions', 'Summary']);
  });

  it('Portions sheet has correct headers', async () => {
    const [portions] = await readSheets();
    expect(portions!.data[0]).toEqual([
      'Sefer', 'Parsha', 'Aliyah', 'Double Parsha', 'Pseukim',
      'Original Date Read', 'Future Dates Read', 'Occasion', 'Percent',
    ]);
  });

  it('Portions sheet has one data row per input row', async () => {
    const [portions] = await readSheets();
    expect(portions!.data).toHaveLength(ROWS.length + 1); // header + data rows
  });

  it('pct is divided by 100 for Excel percent format', async () => {
    const [portions] = await readSheets();
    expect(portions!.data[1]?.[8]).toBeCloseTo(0.015, 5); // 1.5 / 100; index 8 = Percent
  });

  it('Summary sheet header row contains sefer English names and Total', async () => {
    const [, summary] = await readSheets();
    expect(summary!.data[0]).toContain('Genesis');
    expect(summary!.data[0]).toContain('Exodus');
    expect(summary!.data[0]).toContain('Total');
  });

  it('Summary pseukim-read row sums only rows with an orig date', async () => {
    // ROWS: orig rows are [0] (Genesis, 100 pseukim) and [2] (Exodus, 90 pseukim)
    const [, summary] = await readSheets();
    const row = summary!.data[1];
    expect(row?.[1]).toBe(100); // Genesis (col B)
    expect(row?.[2]).toBe(90);  // Exodus  (col C)
    expect(row?.[3]).toBe(190); // Total   (col D)
  });

  it('handles empty rows array without throwing', async () => {
    const buf = await buildExportBuffer([], SEFARIM);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('Future row counts a future-scheduled orig; Past row does not', async () => {
    // MIXED_ROWS[1] (Genesis, 50 pseukim) has orig after TODAY, so it's committed
    // (scheduled) but not yet past. Past should exclude it; Future should include it.
    const [, summary] = await readSheets(MIXED_ROWS, TODAY);
    const pastRow   = summary!.data[1]; // Pseukim Read (past)
    const futureRow = summary!.data[2]; // Pseukim Read (Future)
    expect(pastRow?.[1]).toBe(100);   // Genesis: only the already-read aliyah
    expect(futureRow?.[1]).toBe(150); // Genesis: read + scheduled
    expect(pastRow?.[1]).not.toBe(futureRow?.[1]);
  });

  it('a reread-only row (fut set, no orig) counts toward neither past nor future', async () => {
    const [, summary] = await readSheets(MIXED_ROWS, TODAY);
    const futureRow = summary!.data[2]; // Pseukim Read (Future)
    expect(futureRow?.[2]).toBe(0); // Exodus: orig is empty, so not committed
  });
});
