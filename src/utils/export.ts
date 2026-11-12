import { Capacitor } from '@capacitor/core';
import { getTodayStr } from '../api.js';
import { bytesToBase64 } from './base64.js';
import { DB_EXPORT_FORMAT, EXCEL_EXPORT_FORMAT } from './exportFileName.js';
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

const DEFAULT_EXCEL_EXPORT_NAME = `${EXCEL_EXPORT_FORMAT.defaultBase}${EXCEL_EXPORT_FORMAT.ext}`;

// The readings workbook (Portions + Summary sheets) as an .xlsx blob.
async function buildExcelBlob(): Promise<Blob> {
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
  return writeExcelFile(sheets).toBlob();
}

async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

// Native: opens the share sheet on a cache copy named `fileName`. Web/Electron: downloads it.
export async function exportExcel(fileName: string = DEFAULT_EXCEL_EXPORT_NAME): Promise<void> {
  const blob = await buildExcelBlob();

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { shareFile } = await import('./share.js');
    await Filesystem.writeFile({ path: fileName, data: await blobToBase64(blob), directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await shareFile({ url: uri, title: 'Torah Readings', dialogTitle: 'Export Readings' });
  } else {
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

const DEFAULT_DB_EXPORT_NAME = `${DB_EXPORT_FORMAT.defaultBase}${DB_EXPORT_FORMAT.ext}`;

// The live on-device db file, as a file:// url.
async function nativeDbUrl(): Promise<string> {
  const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
  const { url } = await CapacitorSQLite.getUrl({ database: 'torah' });
  if (!url) throw new Error('Could not locate the database on device.');
  return url;
}

// Native: opens the share sheet on a copy of the db named `fileName`. Web/Electron: downloads it.
export async function exportDb(fileName: string = DEFAULT_DB_EXPORT_NAME): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { shareFile } = await import('./share.js');
    // Share a cache copy, not the live file: Android's share sheet can only read files under the
    // FileProvider roots in android/app/src/main/res/xml/file_paths.xml, and databases/ isn't one.
    await Filesystem.copy({ from: await nativeDbUrl(), to: fileName, toDirectory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await shareFile({ url: uri, title: 'Torah Readings DB', dialogTitle: 'Export Torah DB' });
  } else {
    const res = await fetch('/api/export/db');
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

export type SaveToDocumentsResult = 'saved' | 'exists';

// Saved exports go in their own folder inside Documents, so they're easy to find and don't mix
// with the user's other files.
export const DOCUMENTS_EXPORT_FOLDER = 'Torah Tracker';

// Where saveDbToDocuments / saveExcelToDocuments put `fileName`, relative to Documents.
export function documentsExportPath(fileName: string): string {
  return `${DOCUMENTS_EXPORT_FOLDER}/${fileName}`;
}

// Android only: puts a file into Documents/Torah Tracker (creating the folder if needed), where
// file managers and the Files app can see it. `write` creates the file at the Documents-relative
// path it is given. Unless `overwrite` is set, an existing file of that name is left alone
// and 'exists' is returned so the caller can ask first. On Android 11+ an app may only replace
// files it created itself, so overwriting an older export from a previous install fails.
// (Not offered on iOS: there the SQLite plugin keeps the live db in Documents, and the share
// sheet's "Save to Files" already does this.) Android 10 and older need the storage permission,
// which the Filesystem plugin requests itself.
async function saveToDocuments(
  fileName: string, overwrite: boolean, write: (path: string) => Promise<void>,
): Promise<SaveToDocumentsResult> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const path   = documentsExportPath(fileName);
  const target = { path, directory: Directory.Documents };
  const exists = await Filesystem.stat(target).then(() => true, () => false);
  if (exists) {
    if (!overwrite) return 'exists';
    await Filesystem.deleteFile(target);
  } else {
    // mkdir rejects when the folder already exists; if it failed for any other reason, the
    // write below fails too and reports it.
    await Filesystem.mkdir({ path: DOCUMENTS_EXPORT_FOLDER, directory: Directory.Documents, recursive: true })
      .catch(() => {});
  }
  await write(path);
  return 'saved';
}

export async function saveDbToDocuments(fileName: string, overwrite = false): Promise<SaveToDocumentsResult> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  return saveToDocuments(fileName, overwrite, async path => {
    await Filesystem.copy({ from: await nativeDbUrl(), to: path, toDirectory: Directory.Documents });
  });
}

export async function saveExcelToDocuments(fileName: string, overwrite = false): Promise<SaveToDocumentsResult> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  return saveToDocuments(fileName, overwrite, async path => {
    const data = await blobToBase64(await buildExcelBlob());
    await Filesystem.writeFile({ path, data, directory: Directory.Documents });
  });
}
