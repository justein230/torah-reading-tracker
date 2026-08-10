import { buildSheetData, type AliyotRow, type SeferRow } from './export.js';

// Node-only: kept out of export.ts so the browser bundle never traverses
// write-excel-file/node's node:fs/node:stream imports (see exportExcel for the
// browser counterpart, which uses write-excel-file/browser).
export async function buildExportBuffer(
  rows: AliyotRow[], sefarim: SeferRow[], today?: string,
): Promise<Buffer> {
  const { default: writeExcelFile } = await import('write-excel-file/node');
  const { portions, summary } = buildSheetData(rows, sefarim, today);
  return writeExcelFile([
    { data: portions, sheet: 'Portions' },
    { data: summary, sheet: 'Summary' },
  ]).toBuffer();
}
