import { fmtDate, fmtAliyah, fmtPct } from './format.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, SeferMeta, TipData, TipRow } from '../types/index.js';

// Pure builders for the aliyah tooltip: each takes a mapped record (plus whatever lookup it needs)
// and returns the whole TipData, so the content can be tested without a DOM. The hook in
// AliyahTooltip.tsx only decides when to show it and where.

const dateRow   = (k: string, date: string): TipRow => ({ k, v: fmtDate(date) });
const rereadRow = (dates: string[]): TipRow => ({ k: 'Re-read on', v: dates.map(fmtDate).join(', ') });
const versesRow = (r: { chapterStart: number; verseStart: number; chapterEnd: number; verseEnd: number }): TipRow =>
  ({ k: 'Verses', v: `${r.chapterStart}:${r.verseStart}–${r.chapterEnd}:${r.verseEnd}` });
const pctOfTorahRow = (pseukim: number, torahTotal: number): TipRow =>
  ({ k: '% of Torah', v: torahTotal ? fmtPct(pseukim, torahTotal) + '%' : '—' });
const earliest = (dates: string[]): string => [...dates].sort((a, b) => a.localeCompare(b))[0]!;

export function standardTip(r: MappedRow, seferMap: Record<string, SeferMeta>, tlit: Record<string, string>): TipData {
  const seferMeta = seferMap[r.sefer];
  const rows: TipRow[] = [
    { k: 'Sefer',       hebrew: r.sefer,  suffix: ` (${seferMeta?.en ?? r.sefer})` },
    { k: 'Parsha',      hebrew: r.parsha, suffix: ` — ${tlit[r.parsha] ?? ''}` },
    { k: 'Aliyah',      v: fmtAliyah(r.aliyah) },
    { k: 'Pseukim',     v: r.pseukim },
    { k: '% of Parsha', v: (r.parshaPct ?? 0).toFixed(1) + '%' },
    { k: '% of Torah',  v: r.pct.toFixed(2) + '%' },
  ];
  if (r.chapterStart > 0)               rows.push(versesRow(r));
  if (r.isRead)                         rows.push(dateRow(r.isReadFuture ? 'Upcoming' : 'Read', r.orig));
  if (!r.isRead && r.partialOrig)       rows.push(dateRow('Partial read', r.partialOrig));
  if (!r.isRead && r.futurePartialOrig) rows.push(dateRow('Scheduled Partial', r.futurePartialOrig));
  if (r.occasion)                       rows.push({ k: 'Occasion', v: r.occasion });
  if (r.hasFuture)                      rows.push(rereadRow(r.futDates));
  if (r.pairName)                       rows.push({ k: 'Double Parsha', hebrew: r.pairName });
  return { _color: seferMeta?.color ?? '#888', _tlit: tlit[r.parsha] ?? r.parsha, _aliyah: fmtAliyah(r.aliyah), _tipRows: rows };
}

export function occasionTip(oa: MappedOccasionAliyah, occasionName: string, torahTotal: number, today: string): TipData {
  const rows: TipRow[] = [
    { k: 'Sefer',  hebrew: oa.sefer,  suffix: ` (${oa.seferEn})` },
    { k: 'Parsha', hebrew: oa.parsha, suffix: ` — ${oa.parshaEn}` },
    { k: 'Pseukim', v: oa.pseukim },
    pctOfTorahRow(oa.pseukim, torahTotal),
    versesRow(oa),
  ];
  if (oa.isReadPast)                      rows.push(dateRow('Read', oa.orig));
  if (oa.isReadFuture)                    rows.push(dateRow('Upcoming', oa.orig));
  if (!oa.isReadPast && oa.partialOrig)   rows.push(dateRow('Partial read', oa.partialOrig));
  if (!oa.isRead && oa.futurePartialOrig) rows.push(dateRow('Scheduled Partial', oa.futurePartialOrig));
  if (oa.hasFuture)                       rows.push(rereadRow(oa.allDates.filter(d => d > today)));
  return { _color: oa.seferColor, _tlit: occasionName, _aliyah: fmtAliyah(oa.aliyahKey), _tipRows: rows };
}

export function weekdayTip(
  wa: MappedWeekdayAliyah,
  torahTotal: number,
  today: string,
  coveredBy?: { date: string; label: string },
): TipData {
  const rows: TipRow[] = [
    { k: 'Sefer',  hebrew: wa.sefer,  suffix: ` (${wa.seferEn})` },
    { k: 'Parsha', hebrew: wa.parsha, suffix: ` — ${wa.parshaEn}` },
    { k: 'Pseukim', v: wa.pseukim },
    pctOfTorahRow(wa.pseukim, torahTotal),
    versesRow(wa),
  ];
  if (wa.isReadPast)   rows.push(dateRow('Read', wa.dateRead));
  if (wa.isReadFuture) rows.push(dateRow('Upcoming', wa.dateRead));
  if (wa.hasFuture)    rows.push(rereadRow(wa.allDates.filter(d => d > today)));
  if (!wa.dateRead) {
    if (coveredBy)                 rows.push(dateRow(coveredBy.label, coveredBy.date));
    else {
      if (wa.partialOrig)          rows.push(dateRow('Partial read', wa.partialOrig));
      if (wa.futurePartialOrig)    rows.push(dateRow('Scheduled Partial', wa.futurePartialOrig));
    }
  }
  return { _color: wa.seferColor, _tlit: wa.parshaEn, _aliyah: `Weekday ${wa.aliyahNum}`, _tipRows: rows };
}

/** One combined aliyah of a double parsha, made of the individual `rows` it covers. */
export function doublePairTip(
  pairNameHeb: string,
  pairNameEn: string,
  combinedAliyahNum: number,
  rows: MappedRow[],
  color: string,
  pairTotalPseukim: number,
  tlit: Record<string, string>,
): TipData {
  const torahPct      = rows.reduce((s, r) => s + r.pct, 0).toFixed(2);
  const aliyahPseukim = rows.reduce((s, r) => s + r.pseukim, 0);
  const first = rows[0];
  const last  = rows.at(-1);
  const tipRows: TipRow[] = [
    { k: 'Double Parsha',      hebrew: pairNameHeb, suffix: ` (${pairNameEn})` },
    { k: 'Aliyah',             v: combinedAliyahNum },
    { k: 'Pseukim',            v: aliyahPseukim },
    { k: '% of Double Parsha', v: pairTotalPseukim ? fmtPct(aliyahPseukim, pairTotalPseukim, 1) + '%' : '—' },
    { k: '% of Torah',         v: `${torahPct}%` },
    { k: 'Verses',             v: first && last ? `${first.chapterStart}:${first.verseStart}–${last.chapterEnd}:${last.verseEnd}` : '—' },
  ];

  const firstRead   = rows.find(r => r.readAsDouble && r.isReadPast);
  const firstFuture = rows.find(r => r.readAsDouble && r.isReadFuture);
  if (firstRead)   tipRows.push(dateRow('Read', firstRead.orig));
  if (firstFuture) tipRows.push(dateRow('Upcoming', firstFuture.orig));
  if (!firstRead && !firstFuture) {
    const partialDates = rows.flatMap(r => [r.isReadPast ? r.orig : '', r.partialOrig]).filter(Boolean);
    if (partialDates.length) tipRows.push(dateRow('Partial read', earliest(partialDates)));
    const futurePartialDates = rows.map(r => r.futurePartialOrig).filter(Boolean);
    if (futurePartialDates.length) tipRows.push(dateRow('Scheduled Partial', earliest(futurePartialDates)));
  }

  const rereadDates = [...new Set(rows.flatMap(r => r.futDates))].sort((a, b) => a.localeCompare(b));
  if (rereadDates.length) tipRows.push(rereadRow(rereadDates));
  tipRows.push({ k: 'Regular Aliyot', v: rows.map(r => `${tlit[r.parsha] ?? r.parsha} ${r.aliyah}`).join(', ') });
  return { _color: color, _tlit: pairNameEn, _aliyah: `Aliyah ${combinedAliyahNum}`, _tipRows: tipRows };
}
