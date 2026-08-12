import React, { useMemo } from 'react';
import './ReadingLog.css';
import { Box, Modal, ActionIcon, Group, Text } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { fmtDate } from '../utils.js';
import { TODAY_STR } from '../api.js';
import { EmptyState } from './shared/EmptyState.js';
import { CollapsibleRow } from './shared/CollapsibleRow.js';
import { ReadingRow } from './shared/ReadingRow.js';
import { AddReadingForm } from './AddReadingForm.js';
import { useReadingCrud, readingKey } from '../hooks/useReadingCrud.js';
import {
  collectReadings, collectSpecialEntries, collectWeekdayEntries, collectHosafotEntries,
  groupDoubleParsha, type DisplayEntry, type CombinedAliyah,
} from '../utils/logEntries.js';
import type { LogEntry, SeferMeta } from '../types/index.js';

/** A closure that returns the edit/delete controls for one display row, or null when not actionable. */
type RowActions = (e: DisplayEntry) => React.ReactNode;

/** Pseukim/pct of a displayed top-level row, with maftir (aliyah 8) excluded to avoid double-counting. */
const countablePseukim = (r: DisplayEntry): number => (Number(r.aliyah) === 8 ? 0 : r.pseukim);
const countablePct     = (r: DisplayEntry): number => (Number(r.aliyah) === 8 ? 0 : r.pct);

/**
 * Builds a compact verse-range string for a set of entries. Entries are sorted by start position,
 * then adjacent ranges are merged: same-chapter (verseEnd + 1 == verseStart_next) or
 * cross-chapter (chapterEnd + 1 == chapterStart_next). Non-adjacent ranges are comma-separated.
 * Maftir (aliyah 8) is excluded to avoid double-counting.
 */
function buildVerseRangeStr(entries: DisplayEntry[]): string {
  const withVerses = entries
    .filter(e =>
      Number(e.aliyah) !== 8 &&
      (e.chapterStart ?? 0) > 0 && (e.verseStart ?? 0) > 0 &&
      (e.chapterEnd   ?? 0) > 0 && (e.verseEnd   ?? 0) > 0,
    )
    .sort((a, b) => {
      const dc = (a.chapterStart ?? 0) - (b.chapterStart ?? 0);
      return dc === 0 ? (a.verseStart ?? 0) - (b.verseStart ?? 0) : dc;
    });

  if (withVerses.length === 0) return '';

  type Range = [number, number, number, number]; // [cs, vs, ce, ve]
  const merged: Range[] = [[
    withVerses[0]!.chapterStart!, withVerses[0]!.verseStart!,
    withVerses[0]!.chapterEnd!,   withVerses[0]!.verseEnd!,
  ]];

  for (let i = 1; i < withVerses.length; i++) {
    const e    = withVerses[i]!;
    const prev = merged[merged.length - 1]!;
    const [, , pce, pve] = prev;
    const [ncs, nvs, nce, nve] = [e.chapterStart!, e.verseStart!, e.chapterEnd!, e.verseEnd!];
    const contiguous =
      (pce === ncs && pve + 1 === nvs) ||
      (pce + 1 === ncs);
    if (contiguous) { prev[2] = nce; prev[3] = nve; }
    else            { merged.push([ncs, nvs, nce, nve]); }
  }

  return merged.map(([cs, vs, ce, ve]) => `${cs}:${vs}–${ce}:${ve}`).join(', ');
}

interface DayCardProps {
  dateStr: string;
  day: DisplayEntry[];
  dayPseukim: number;
  dayPct: number;
  sefers: string[];
  occasions: string[];
  mainColor: string;
  rowActions?: RowActions;
}

function DayCard({ dateStr, day, dayPseukim, dayPct, sefers, occasions, mainColor, rowActions }: Readonly<DayCardProps>) {
  const { SEFER_MAP } = useApp();
  const verseRangeStr = buildVerseRangeStr(day);
  const parshiot = [...new Set(day.map(r => r.parsha).filter(Boolean))];

  const summary = (
    <>
      <div className="ri-date">{fmtDate(dateStr)}</div>
      <div className="ri-parsha">
        <div className="ri-parsha-text">
          <div className="ri-parsha-count">
            <span>{day.length} aliyot</span>
            {parshiot.length > 0 && (
              <>
                <span className="ri-count-sep">·</span>
                <span className="hebrew heb">{parshiot.join(' · ')}</span>
              </>
            )}
          </div>
          <div className="sub">
            {sefers.map((s, i) => (
              <span key={s}>
                {i > 0 && ', '}
                <span style={{ color: SEFER_MAP[s]?.color ?? '#888' }}>{SEFER_MAP[s]?.en ?? s}</span>
              </span>
            ))}
            {occasions.length > 0 && ' · ' + occasions.join(', ')}
            {verseRangeStr && ' · ' + verseRangeStr}
          </div>
        </div>
        <div className="ri-stats">
          <span className="ri-tag">{dayPseukim} pseukim</span>
          <span className="ri-pct">{dayPct.toFixed(2)}%</span>
        </div>
      </div>
    </>
  );

  return (
    <CollapsibleRow summary={summary} accentColor={mainColor}>
      <div className="day-breakdown">
        {day.map(r => <ReadingRow key={`${r.parsha}-${r.aliyah}`} r={r as LogEntry} compact actions={rowActions?.(r)} />)}
      </div>
    </CollapsibleRow>
  );
}

/** One double-parsha combined aliyah: summary row that expands to its component weekend aliyot. */
function CombinedAliyahCard({ group, rowActions }: Readonly<{ group: CombinedAliyah; rowActions?: RowActions }>) {
  const { SEFER_MAP } = useApp();
  const s = group.summary;
  const seferMeta = SEFER_MAP[s.sefer];
  const mainColor = seferMeta?.color ?? '#888';
  const verseRangeStr = buildVerseRangeStr(group.components);

  // Mirror DayCard's summary markup so .collapsible-summary styles its direct children correctly.
  const summary = (
    <>
      <div className="ri-date">{fmtDate(s.displayDate)}</div>
      <div className="ri-parsha">
        <div className="ri-parsha-text">
          <div className="hebrew heb">
            {s.pairName} — עליה {s.combinedAliyah}
            {s.reread && (
              <span className="reread-badge" style={{ color: mainColor, background: `${mainColor}22` }}>↺ RE-READ</span>
            )}
          </div>
          <div className="sub">
            {s.pairNameEn} · Aliyah {s.combinedAliyah} · <span style={{ color: mainColor }}>{seferMeta?.en ?? s.sefer}</span>
            {verseRangeStr && ' · ' + verseRangeStr}
          </div>
        </div>
        <div className="ri-stats">
          <span className="ri-tag">{s.pseukim} pseukim</span>
          <span className="ri-pct">{s.pct.toFixed(2)}%</span>
        </div>
      </div>
    </>
  );

  return (
    <CollapsibleRow summary={summary} accentColor={mainColor}>
      <div className="day-breakdown">
        {group.components.map(c => (
          <ReadingRow key={`${c.parsha}-${c.aliyah}-${c.displayDate}`} r={c} compact actions={rowActions?.(c)} />
        ))}
      </div>
    </CollapsibleRow>
  );
}

function groupReadingsByYear(readings: DisplayEntry[]): { yearOrder: number[]; byYear: Record<number, DisplayEntry[]> } {
  const yearOrder: number[] = [];
  const byYear: Record<number, DisplayEntry[]> = {};
  for (const r of readings) {
    const yr = r.displayYear ?? 0;
    let arr = byYear[yr];
    if (!arr) { arr = []; byYear[yr] = arr; yearOrder.push(yr); }
    arr.push(r);
  }
  return { yearOrder, byYear };
}

interface DayGroup {
  dateStr: string;
  combined: CombinedAliyah[];
  singles: DisplayEntry[];
}

/** Group a year's entries by date, then split each day into double-parsha groups + singles. */
function groupYearByDate(group: DisplayEntry[]): DayGroup[] {
  const dateOrder: string[] = [];
  const byDate: Record<string, DisplayEntry[]> = {};
  for (const r of group) {
    let dayArr = byDate[r.displayDate];
    if (!dayArr) { dayArr = []; byDate[r.displayDate] = dayArr; dateOrder.push(r.displayDate); }
    dayArr.push(r);
  }
  return dateOrder.map(dateStr => ({ dateStr, ...groupDoubleParsha(byDate[dateStr] ?? []) }));
}

interface YearGroupProps {
  yr: number;
  group: DisplayEntry[];
  SEFER_MAP: Record<string, SeferMeta>;
  rowActions?: RowActions;
}

function YearGroup({ yr, group, SEFER_MAP, rowActions }: Readonly<YearGroupProps>) {
  const days = groupYearByDate(group);

  // Year totals run over the displayed top-level rows (combined summaries + singles) so a
  // double-parsha combined aliyah is counted once, not once per component.
  const topEntries = days.flatMap(d => [...d.combined.map(c => c.summary), ...d.singles]);
  const totalPseukim = topEntries.reduce((s, r) => s + countablePseukim(r), 0);
  const totalPct     = topEntries.reduce((s, r) => s + countablePct(r), 0);

  return (
    <div className="year-group">
      <div className="year-label">
        {yr}
        <span className="yr-stats">{topEntries.length} aliyot · {totalPseukim} pseukim · {totalPct.toFixed(2)}%</span>
      </div>
      {days.map(({ dateStr, combined, singles }) => (
        <React.Fragment key={dateStr}>
          {combined.map(g => <CombinedAliyahCard key={`${g.summary.pairNameEn}-${g.summary.combinedAliyah}`} group={g} rowActions={rowActions} />)}
          {renderSingles(dateStr, singles, combined.length > 0, SEFER_MAP, rowActions)}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Renders the non-double-parsha entries of a day. When combined cards already occupy the day,
 * singles render as individual rows alongside them; otherwise the usual single-row / DayCard
 * collapse applies.
 */
function renderSingles(
  dateStr: string,
  singles: DisplayEntry[],
  hasCombined: boolean,
  SEFER_MAP: Record<string, SeferMeta>,
  rowActions?: RowActions,
): React.ReactNode {
  if (singles.length === 0) return null;

  if (hasCombined || singles.length === 1) {
    return singles.map(r => <ReadingRow key={`${r.displayDate}-${r.parsha}-${r.aliyah}`} r={r} actions={rowActions?.(r)} />);
  }

  const dayPseukim = singles.reduce((s, r) => s + countablePseukim(r), 0);
  const dayPct     = singles.reduce((s, r) => s + countablePct(r), 0);
  const sefers     = [...new Set(singles.map(r => r.sefer))];
  const occasions  = [...new Set(singles.map(r => r.occasion).filter(Boolean))];
  const mainColor  = SEFER_MAP[sefers[0] ?? '']?.color ?? '#888';
  return (
    <DayCard dateStr={dateStr} day={singles} dayPseukim={dayPseukim} dayPct={dayPct} sefers={sefers} occasions={occasions} mainColor={mainColor} rowActions={rowActions} />
  );
}

/** The paired edit/delete controls rendered in a row's actions slot. */
function editDeleteIcons(onEdit: () => void, onDelete: () => void): React.ReactNode {
  return (
    <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
      <ActionIcon variant="subtle" onClick={onEdit} title="Edit">✏️</ActionIcon>
      <ActionIcon variant="subtle" color="red" onClick={onDelete} title="Delete">🗑️</ActionIcon>
    </Group>
  );
}

export default function ReadingLog() {
  const { allRows, SEFER_MAP, filters, specialReadings, weekdayAliyot, occasionAliyot, hosafotReadings, stats } = useApp();
  const crud = useReadingCrud();

  const readings = [
    ...collectReadings(allRows, filters),
    ...collectSpecialEntries(specialReadings, occasionAliyot, stats, filters),
    ...collectWeekdayEntries(weekdayAliyot, stats, filters),
    ...collectHosafotEntries(hosafotReadings, stats, filters),
  ].sort((a, b) => (b.displayDate ?? '').localeCompare(a.displayDate ?? ''));

  // Resolve a display row's `recordId` back to its full source record so edit/delete get the object
  // their handlers expect. Standard rows carry no id and are looked up by parsha|aliyah|date instead.
  const specialById = useMemo(() => new Map(specialReadings.map(sr => [sr.id, sr] as const)), [specialReadings]);
  const weekdayById = useMemo(() => new Map(weekdayAliyot.map(wa => [wa.readingId, wa] as const)), [weekdayAliyot]);
  const hosafahById = useMemo(() => new Map(hosafotReadings.map(hr => [hr.id, hr] as const)), [hosafotReadings]);

  function standardActions(e: DisplayEntry): React.ReactNode {
    const rec = crud.readingsById.get(readingKey(e.parsha, e.aliyah, e.displayDate));
    if (!rec) return null;
    const color = SEFER_MAP[e.sefer]?.color ?? 'var(--muted)';
    return editDeleteIcons(() => crud.edit.startEdit(rec), () => crud.confirmDelete(rec, color));
  }

  function holidayActions(e: DisplayEntry): React.ReactNode {
    const sr = e.recordId == null ? undefined : specialById.get(e.recordId);
    if (!sr) return null;
    return editDeleteIcons(() => crud.edit.startEditSpecial(sr), () => crud.confirmDeleteSpecial(sr));
  }

  function weekdayActions(e: DisplayEntry): React.ReactNode {
    const wa = e.recordId == null ? undefined : weekdayById.get(e.recordId);
    if (!wa) return null;
    return editDeleteIcons(() => crud.edit.startEditWeekday(wa), () => crud.confirmDeleteWeekday(wa.readingId, `${wa.parshaEn} · aliyah ${wa.aliyahNum}`));
  }

  function hosafahActions(e: DisplayEntry): React.ReactNode {
    const hr = e.recordId == null ? undefined : hosafahById.get(e.recordId);
    if (!hr) return null;
    const verseRange = `${hr.chapterStart}:${hr.verseStart}–${hr.chapterEnd}:${hr.verseEnd}`;
    return editDeleteIcons(() => crud.edit.startEditHosafah(hr), () => crud.confirmDeleteHosafah(hr.id, `${hr.parsha1En} · ${verseRange}`));
  }

  function rowActionsFor(e: DisplayEntry): React.ReactNode {
    if (e.isDoubleParsha) return null; // aggregate summary — edit/delete live on the component rows
    switch (e.kind) {
      case 'standard': return standardActions(e);
      case 'holiday':  return holidayActions(e);
      case 'weekday':  return weekdayActions(e);
      case 'hosafah':  return hosafahActions(e);
      default:         return null;
    }
  }

  const rowActions: RowActions | undefined = crud.canWrite ? rowActionsFor : undefined;

  const upcoming = [...readings.filter(r => r.displayDate > TODAY_STR)]
    .sort((a, b) => new Date(a.displayDate).getTime() - new Date(b.displayDate).getTime());
  const past = [...readings.filter(r => r.displayDate <= TODAY_STR)]
    .sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

  const { yearOrder: pastYears,     byYear: byYearPast }     = groupReadingsByYear(past);
  const { yearOrder: upcomingYears, byYear: byYearUpcoming } = groupReadingsByYear(upcoming);

  return (
    <Box>
      {crud.canWrite && (
        <>
          <div className="add-reading-section">
            <CollapsibleRow summary={<Text fw={600}>Add a Reading</Text>}>
              <div className="add-reading-body">
                <AddReadingForm
                  form={crud.add.form} setField={crud.add.setField} editId={null} recreate={false} locked={false} msg={crud.add.msg}
                  formTitle="Add Reading" submitLabel="Add Reading"
                  doRecreate={() => {}} submit={() => void crud.add.submit()} resetForm={crud.add.reset}
                  parshaOptions={crud.addOptions.parshaOptions} aliyahOptions={crud.addOptions.aliyahOptions}
                  inModal
                />
              </div>
            </CollapsibleRow>
          </div>
          <Modal opened={crud.edit.open} onClose={crud.edit.close} title={crud.edit.formTitle} size="lg" centered>
            <AddReadingForm
              form={crud.edit.form} setField={crud.edit.setField} editId={crud.edit.editId} recreate={crud.edit.recreate} locked={crud.edit.locked} msg={crud.edit.msg}
              formTitle={crud.edit.formTitle} submitLabel={crud.edit.submitLabel}
              doRecreate={crud.edit.doRecreate} submit={() => void crud.edit.submit()} resetForm={crud.edit.close}
              parshaOptions={crud.editOptions.parshaOptions} aliyahOptions={crud.editOptions.aliyahOptions}
              inModal
            />
          </Modal>
        </>
      )}

      {readings.length === 0 ? (
        <EmptyState icon="📖" message="No readings match the current filters." />
      ) : (
        <>
          {upcomingYears.length > 0 && (
            <div className="upcoming-section">
              <div className="upcoming-hdr">Upcoming Readings</div>
              {upcomingYears.map(yr => (
                <YearGroup key={yr} yr={yr} group={byYearUpcoming[yr]!} SEFER_MAP={SEFER_MAP} rowActions={rowActions} />
              ))}
            </div>
          )}
          {pastYears.map(yr => (
            <YearGroup key={yr} yr={yr} group={byYearPast[yr]!} SEFER_MAP={SEFER_MAP} rowActions={rowActions} />
          ))}
        </>
      )}
    </Box>
  );
}
