import { Capacitor } from '@capacitor/core';
import { getTodayStr } from '../api.js';
import type { Row, CellObject } from 'write-excel-file/browser';

export interface AliyotRow {
  sefer: string;
  parsha: string;
  aliyah: number;
  double_parsha: string;
  pseukim: number;
  pct: number;
  orig: string;
  fut: string;
  occasion: string;
}

export interface SeferRow {
  name: string;
  name_en: string;
}

const PCT_FMT = '0.00%';

// 1-based column index → letter ('A', 'B', ...)
function colLetter(n: number): string {
  return String.fromCodePoint(64 + n);
}

export function buildSheetData(
  rows: AliyotRow[], sefarim: SeferRow[], today: string = getTodayStr(),
): { portions: Row[]; summary: Row[] } {
  const SEFER_ORDER = sefarim.map(s => s.name);
  const SEFER_EN    = Object.fromEntries(sefarim.map(s => [s.name, s.name_en]));
  const dataCols    = SEFER_ORDER.length + 1; // sefarim + Total

  // ── Sheet 1: Portions ──────────────────────────────────────────────────────
  const portions: Row[] = [
    [
      'Sefer', 'Parsha', 'Aliyah', 'Double Parsha', 'Pseukim',
      'Original Date Read', 'Future Dates Read', 'Occasion', 'Percent',
    ],
    ...rows.map((r): Row => [
      r.sefer, r.parsha, r.aliyah, r.double_parsha || '',
      r.pseukim, r.orig || '', r.fut || '', r.occasion || '',
      { value: r.pct / 100, format: PCT_FMT }, // pct is 0–100; divide so Excel % format (×100) displays correctly
    ]),
  ];

  // ── Sheet 2: Summary ───────────────────────────────────────────────────────
  // "past" = the standard reading has already happened; "committed" = read already OR
  // scheduled for a future date (mirrors isReadPast/isReadFuture in src/api.ts). Reread
  // dates (r.fut) are a separate concept and don't factor into either count.
  const past      = (r: AliyotRow) => !!r.orig && r.orig <= today;
  const committed = (r: AliyotRow) => !!r.orig;

  const makePseukimRow = (label: string, pred: (r: AliyotRow) => boolean): Row => {
    const vals = SEFER_ORDER.map(s =>
      rows.filter(r => r.sefer === s && pred(r)).reduce((n, r) => n + r.pseukim, 0),
    );
    return [label, ...vals, vals.reduce((a, b) => a + b, 0)];
  };

  const makeAliyotRow = (label: string, pred: (r: AliyotRow) => boolean): Row => {
    const vals = SEFER_ORDER.map(s => rows.filter(r => r.sefer === s && pred(r)).length);
    return [label, ...vals, vals.reduce((a, b) => a + b, 0)];
  };

  const formulaRow = (label: string, formula: (col: string) => string, fmt?: string): Row => [
    label,
    ...Array.from({ length: dataCols }, (_, i) => {
      const col: CellObject = { value: `=${formula(colLetter(i + 2))}`, type: 'Formula' };
      if (fmt) col.format = fmt;
      return col;
    }),
  ];

  const summary: Row[] = [
    ['Titles', ...SEFER_ORDER.map(s => SEFER_EN[s] ?? s), 'Total'],           // row  1
    makePseukimRow('Pseukim Read (past)',   past),                             // row  2
    makePseukimRow('Pseukim Read (Future)', committed),                        // row  3
    makePseukimRow('Pseukim Total',         () => true),                       // row  4
    formulaRow('% Read',            col => `${col}$2/${col}$4`,  PCT_FMT),    // row  5
    formulaRow('% Read (Future)',   col => `${col}$3/${col}$4`,  PCT_FMT),    // row  6
    formulaRow('Pseukim Remaining', col => `${col}$4-${col}$2`),              // row  7
    [''],                                                                      // row  8
    makeAliyotRow('Aliyot Read (past)',   past),                               // row  9
    makeAliyotRow('Aliyot Read (Future)', committed),                          // row 10
    makeAliyotRow('Aliyot Total',         () => true),                         // row 11
    formulaRow('% Read',            col => `${col}$9/${col}$11`,  PCT_FMT),   // row 12
    formulaRow('% Read (Future)',   col => `${col}$10/${col}$11`, PCT_FMT),   // row 13
    formulaRow('Aliyot Remaining',  col => `${col}$11-${col}$9`),             // row 14
  ];

  return { portions, summary };
}

export async function exportExcel(): Promise<void> {
  const { fetchAliyot, fetchMeta } = await import('../api.js');

  const [rows, meta] = await Promise.all([fetchAliyot(), fetchMeta()]);
  const aliyotRows: AliyotRow[] = rows.map(r => ({
    sefer:         r.sefer,
    parsha:        r.parsha,
    aliyah:        Number(r.aliyah),
    double_parsha: r.pair_name ?? '',
    pseukim:       r.pseukim,
    pct:           r.pct,
    orig:          r.orig ?? '',
    fut:           r.fut ?? '',
    occasion:      r.occasion ?? '',
  }));

  const { portions, summary } = buildSheetData(aliyotRows, meta.sefarim);
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const sheets = [
    { data: portions, sheet: 'Portions' },
    { data: summary, sheet: 'Summary' },
  ];
  const fileName = `torah-readings-${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const blob    = await writeExcelFile(sheets).toBlob();
    const base64  = Buffer.from(await blob.arrayBuffer()).toString('base64');
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ url: uri, title: 'Torah Readings', dialogTitle: 'Export Readings' });
  } else {
    const blob = await writeExcelFile(sheets).toBlob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

export async function exportDb(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
    const { Share } = await import('@capacitor/share');
    const { url } = await CapacitorSQLite.getUrl({ database: 'torah' });
    await Share.share({ url, title: 'Torah Readings DB', dialogTitle: 'Export Torah DB' });
  } else {
    const res = await fetch('/api/export/db');
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'torah.db';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
