import { Card, Text, Badge, ActionIcon, Group } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { EmptyState } from './shared/EmptyState.js';
import { ReadingRow } from './shared/ReadingRow.js';
import { TODAY_STR } from '../api.js';
import type { ReadingRecord, SpecialReadingRecord, MappedWeekdayAliyah, MappedHosafah, LogEntry } from '../types/index.js';

interface ManageListProps {
  readings: ReadingRecord[];
  specialReadings: SpecialReadingRecord[];
  weekdayAliyot: MappedWeekdayAliyah[];
  hosafotReadings: MappedHosafah[];
  onEdit: (r: ReadingRecord) => void;
  onDelete: (r: ReadingRecord, color: string) => void;
  onDeleteSpecial: (sr: SpecialReadingRecord) => void;
  onEditSpecial: (sr: SpecialReadingRecord) => void;
  onEditWeekday: (wa: MappedWeekdayAliyah) => void;
  onDeleteWeekday: (readingId: number, label: string) => void;
  onEditHosafah: (hr: MappedHosafah) => void;
  onDeleteHosafah: (id: number, label: string) => void;
}

type AnyReading =
  | { kind: 'standard'; r: ReadingRecord }
  | { kind: 'holiday';  sr: SpecialReadingRecord }
  | { kind: 'weekday';  wa: MappedWeekdayAliyah }
  | { kind: 'hosafah';  hr: MappedHosafah };

export function ManageList({ readings, specialReadings, weekdayAliyot, hosafotReadings, onEdit, onDelete, onDeleteSpecial, onEditSpecial, onEditWeekday, onDeleteWeekday, onEditHosafah, onDeleteHosafah }: Readonly<ManageListProps>) {
  const { allRows, occasionAliyot, SEFER_MAP, stats } = useApp();

  // Determine which readings are re-reads by scanning chronologically.
  // A reading is a re-read if the same parsha+aliyah was already recorded
  // on an earlier date. We use the stored reading_type only as a fallback
  // label; the actual re-read status is derived from the data itself so that
  // it stays correct even if the stored type is wrong or migrated.
  const rereads = new Set<number>();
  const seenAliyahs = new Set<string>();
  [...readings]
    .sort((a, b) => (a.date_read ?? '').localeCompare(b.date_read ?? ''))
    .forEach(r => {
      const key = `${r.parsha}|${r.aliyah}`;
      if (seenAliyahs.has(key)) rereads.add(r.id);
      else seenAliyahs.add(key);
    });

  const merged: AnyReading[] = [
    ...readings.map(r          => ({ kind: 'standard' as const, r,  date: r.date_read  ?? '' })),
    ...specialReadings.map(sr  => ({ kind: 'holiday'  as const, sr, date: sr.dateRead ?? '' })),
    ...weekdayAliyot.filter(wa => wa.dateRead !== '').map(wa => ({ kind: 'weekday' as const, wa, date: wa.dateRead })),
    ...hosafotReadings.map(hr  => ({ kind: 'hosafah'  as const, hr, date: hr.dateRead })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card className="card-surface">
      <Text fw={600} mb={16}>All Readings</Text>
      {merged.length ? merged.map(entry => {
        if (entry.kind === 'standard') {
          const { r } = entry;
          const enriched  = allRows.find(a => a.parsha === r.parsha && a.aliyah === r.aliyah);
          const color     = SEFER_MAP[r.sefer]?.color ?? 'var(--muted)';
          const isReread  = rereads.has(r.id);
          const baseLabel = r.reading_type === 'double_parsha' ? 'double parsha' : 'standard';
          const row: LogEntry = {
            sefer: r.sefer, parsha: r.parsha, aliyah: r.aliyah,
            pseukim: enriched?.pseukim ?? 0, pct: enriched?.pct ?? 0,
            occasion: r.occasion || '', location: r.location || '',
            reread: false, displayDate: r.date_read || '',
            chapterStart: enriched?.chapterStart, verseStart: enriched?.verseStart,
            chapterEnd:   enriched?.chapterEnd,   verseEnd:   enriched?.verseEnd,
          };
          const actions = (
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Badge variant="light" size="sm">{baseLabel}</Badge>
              {isReread && <Badge variant="light" size="sm" color="orange">re-read</Badge>}
              {r.date_read && r.date_read > TODAY_STR && (
                <Badge variant="light" size="sm" color="blue">Future</Badge>
              )}
              <ActionIcon variant="subtle" onClick={() => onEdit(r)} title="Edit">✏️</ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => onDelete(r, color)} title="Delete">🗑️</ActionIcon>
            </Group>
          );
          return <ReadingRow key={`s-${r.id}`} r={row} actions={actions} />;
        }

        if (entry.kind === 'holiday') {
          const { sr } = entry;
          const oa    = occasionAliyot.find(o => o.id === sr.occasionAliyahId);
          const row: LogEntry = {
            sefer: oa?.sefer ?? '', parsha: oa?.parsha ?? sr.parsha,
            aliyah: sr.aliyahKey,
            pseukim: sr.pseukim, pct: stats ? sr.pseukim / stats.totalPseukim * 100 : 0,
            occasion: sr.occasionEn, note: sr.note, location: sr.location,
            reread: false, displayDate: sr.dateRead,
            chapterStart: oa?.chapterStart, verseStart: oa?.verseStart,
            chapterEnd:   oa?.chapterEnd,   verseEnd:   oa?.verseEnd,
          };
          const actions = (
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Badge variant="light" size="sm" color="violet">Holiday</Badge>
              {sr.dateRead > TODAY_STR && <Badge variant="light" size="sm" color="blue">Future</Badge>}
              <ActionIcon variant="subtle" onClick={() => onEditSpecial(sr)} title="Edit">✏️</ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => onDeleteSpecial(sr)} title="Delete">🗑️</ActionIcon>
            </Group>
          );
          return <ReadingRow key={`h-${sr.id}`} r={row} actions={actions} />;
        }

        if (entry.kind === 'weekday') {
          const { wa } = entry;
          const waRow: LogEntry = {
            sefer: wa.sefer, parsha: wa.parsha, aliyah: wa.aliyahNum,
            pseukim: wa.pseukim, pct: stats ? wa.pseukim / stats.totalPseukim * 100 : 0,
            occasion: '', note: wa.note, location: wa.location,
            reread: false, displayDate: wa.dateRead,
            chapterStart: wa.chapterStart, verseStart: wa.verseStart,
            chapterEnd:   wa.chapterEnd,   verseEnd:   wa.verseEnd,
          };
          const waActions = (
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Badge variant="light" size="sm" color="teal">Weekday</Badge>
              {wa.isReadFuture && <Badge variant="light" size="sm" color="blue">Future</Badge>}
              <ActionIcon variant="subtle" onClick={() => onEditWeekday(wa)} title="Edit">✏️</ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => onDeleteWeekday(wa.readingId, `${wa.parshaEn} · aliyah ${wa.aliyahNum}`)} title="Delete">🗑️</ActionIcon>
            </Group>
          );
          return <ReadingRow key={`w-${wa.id}`} r={waRow} actions={waActions} />;
        }

        const { hr } = entry;
        const verseRange = `${hr.chapterStart}:${hr.verseStart}–${hr.chapterEnd}:${hr.verseEnd}`;
        const hrRow: LogEntry = {
          sefer: hr.sefer, parsha: hr.parsha1, aliyah: 'hosafah',
          pseukim: hr.pseukim, pct: stats ? hr.pseukim / stats.totalPseukim * 100 : 0,
          occasion: hr.note,
          note: hr.occasionEn ? `${verseRange} · ${hr.occasionEn}` : verseRange,
          location: hr.location,
          reread: false, displayDate: hr.dateRead,
        };
        const hrActions = (
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Badge variant="light" size="sm" color="grape">Hosafah</Badge>
            <ActionIcon variant="subtle" onClick={() => onEditHosafah(hr)} title="Edit">✏️</ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => onDeleteHosafah(hr.id, `${hr.parsha1En} · ${verseRange}`)} title="Delete">🗑️</ActionIcon>
          </Group>
        );
        return <ReadingRow key={`hr-${hr.id}`} r={hrRow} actions={hrActions} />;
      }) : <EmptyState message="No readings on file." />}
    </Card>
  );
}
