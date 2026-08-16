import { useState, useEffect, useMemo } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useApp } from '../context/AppContext.js';
import { fetchReadings, deleteReading, deleteSpecialReading, deleteWeekdayReading, postWeekdayReading, putWeekdayReading, postHosafah, deleteHosafah, putHosafah } from '../api.js';
import { validateForm, submitReading, applyFieldChange } from '../utils/manage-utils.js';
import { fmtAliyah, fmtLongDate, toDateStr } from '../utils.js';
import { buildGroupedOptions } from '../utils/form-options.js';
import type { ManageForm, MappedRow, ParshaPair, ReadingRecord, SpecialReadingRecord, MappedWeekdayAliyah, MappedHosafah } from '../types/index.js';

export const EMPTY_FORM: ManageForm = {
  parsha: '', aliyah: [], date: null, occasion: '', location: '',
  readingType: 'standard', pairId: null,
  occasionId: null, occasionAliyahIds: [], isShabbatVariant: false,
  hosafahSefer: '', hosafahParshaId1: null, hosafahParshaId2: null,
  hosafahOccasionId: null, hosafahIsDoubleParsha: false,
  hosafahChapterStart: '', hosafahVerseStart: '', hosafahChapterEnd: '', hosafahVerseEnd: '', hosafahPseukim: '',
};

const ERR_UNREACHABLE = 'The server could not be reached. Check your connection and try again.';

/** Key used to recover a standard reading's DB id from a display row: unique per (aliyah, date). */
export const readingKey = (parsha: string | number, aliyah: string | number, date: string): string =>
  `${parsha}|${aliyah}|${date}`;

function buildEditForm(r: ReadingRecord): ManageForm {
  return {
    ...EMPTY_FORM,
    parsha:      r.parsha,
    aliyah:      [String(r.aliyah)],
    date:        r.date_read ? new Date(r.date_read + 'T00:00:00') : null,
    occasion:    r.occasion || '',
    location:    r.location || '',
    readingType: r.reading_type === 'double_parsha' ? 'double_parsha' : 'standard',
  };
}

function openErrorModal(message: string) {
  modals.open({
    title: 'Could not save reading',
    children: (
      <Stack gap={16}>
        <Text size="sm" c="dimmed">{message}</Text>
        <Button fullWidth onClick={() => modals.closeAll()}>OK</Button>
      </Stack>
    ),
  });
}

function runWithErrorModal(action: () => Promise<void>, fallback: string): void {
  void (async () => {
    try { await action(); }
    catch (e: unknown) { openErrorModal((e as { detail?: string }).detail ?? fallback); }
  })();
}

function confirmDeleteReading(opts: {
  title: string;
  body: React.ReactNode;
  onDelete: () => Promise<void>;
  errorFallback: string;
}) {
  modals.openConfirmModal({
    title: opts.title,
    children: opts.body,
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: () => runWithErrorModal(opts.onDelete, opts.errorFallback),
  });
}

interface FormSeferMeta {
  SEFER_ORDER: string[];
  SEFER_MAP: Record<string, { en: string; color: string }>;
  parshaIndex: Record<string, string[]>;
  TLIT: Record<string, string>;
  parshaById: Record<number, string>;
}

function buildFormOptions(
  form: ManageForm,
  allRows: MappedRow[],
  pairs: ParshaPair[],
  seferMeta: FormSeferMeta,
) {
  const { SEFER_ORDER, SEFER_MAP, parshaIndex, TLIT, parshaById } = seferMeta;
  const activePair = form.pairId ? pairs.find(p => p.id === form.pairId) ?? null : null;
  const allowedParshas = activePair
    ? new Set([parshaById[activePair.parsha1_id], parshaById[activePair.parsha2_id]].filter(Boolean))
    : null;

  const parshaOptions = buildGroupedOptions(
    SEFER_ORDER,
    s => SEFER_MAP[s]?.en ?? s,
    s => (parshaIndex[s] ?? []).filter(p => !allowedParshas || allowedParshas.has(p)),
    p => ({ value: p, label: `${p}  —  ${TLIT[p] ?? ''}` }),
  );

  let aliyahOptions: { value: string; label: string }[] = [];
  if (form.readingType === 'double_parsha' && activePair) {
    const combined = [...new Set(allRows.filter(r => r.pairNameEn === activePair.name_en && r.combinedAliyah != null).map(r => r.combinedAliyah as number))].sort((a, b) => a - b);
    aliyahOptions = combined.map(n => {
      const parts = allRows.filter(r => r.pairNameEn === activePair.name_en && r.combinedAliyah === n)
        .sort((a, b) => a.chapterStart - b.chapterStart || a.verseStart - b.verseStart);
      const pseukim = parts.reduce((s, r) => s + r.pseukim, 0);
      const first = parts[0], last = parts[parts.length - 1];
      const verses = first && last ? `  —  ${first.chapterStart}:${first.verseStart}–${last.chapterEnd}:${last.verseEnd} (${pseukim} v.)` : '';
      return { value: String(n), label: `Aliyah ${n}${verses}` };
    });
  } else if (form.parsha) {
    aliyahOptions = allRows.filter(r => r.parsha === form.parsha).sort((a, b) => Number(a.aliyah) - Number(b.aliyah)).map(r => {
      const n = Number(r.aliyah);
      const baseLabel = n === 8 ? 'Maftir (M)' : `Aliyah ${n}`;
      return { value: String(n), label: `${baseLabel}  —  ${r.chapterStart}:${r.verseStart}–${r.chapterEnd}:${r.verseEnd} (${r.pseukim} v.)` };
    });
  }

  return { parshaOptions, aliyahOptions };
}

function useManageData(refresh: () => Promise<void>, refreshSpecial: () => Promise<void>, refreshWeekday: () => Promise<void>, refreshHosafot: () => Promise<void>) {
  const [readings, setReadings] = useState<ReadingRecord[]>([]);

  useEffect(() => {
    void loadReadings();
  }, []);

  async function loadReadings() {
    setReadings(await fetchReadings());
  }

  function confirmDelete(r: ReadingRecord, color: string) {
    confirmDeleteReading({
      title: 'Delete reading',
      body: (
        <Stack gap={12}>
          <Text size="sm" c="dimmed">Are you sure you want to delete this reading?</Text>
          <div className="confirm-preview">
            <Text size="sm">
              <span className="hebrew" style={{ color }}>{r.parsha}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}> — {r.parsha_en} · {fmtAliyah(r.aliyah)}</span>
            </Text>
            <Text size="xs" c="dimmed">
              {fmtLongDate(r.date_read)}
              {r.occasion ? ` · ${r.occasion}` : ''}
              {r.location ? ` · ${r.location}` : ''}
            </Text>
          </div>
        </Stack>
      ),
      onDelete: async () => {
        await deleteReading(r.id);
        await refresh();
        await loadReadings();
      },
      errorFallback: 'Failed to delete reading.',
    });
  }

  function confirmDeleteSpecial(sr: SpecialReadingRecord) {
    confirmDeleteReading({
      title: 'Delete holiday reading',
      body: (
        <Stack gap={12}>
          <Text size="sm" c="dimmed">Are you sure you want to delete this holiday reading?</Text>
          <div className="confirm-preview">
            <Text size="sm">{sr.occasionEn} · {sr.aliyahKey}</Text>
            <Text size="xs" c="dimmed">
              {fmtLongDate(sr.dateRead)}
              {sr.location ? ` · ${sr.location}` : ''}
            </Text>
          </div>
        </Stack>
      ),
      onDelete: async () => {
        await deleteSpecialReading(sr.id);
        await refreshSpecial();
        await refresh();
      },
      errorFallback: 'Failed to delete holiday reading.',
    });
  }

  function confirmDeleteWeekday(readingId: number, label: string) {
    confirmDeleteReading({
      title: 'Delete weekday reading',
      body: <Text size="sm" c="dimmed">Delete weekday reading: {label}?</Text>,
      onDelete: async () => {
        await deleteWeekdayReading(readingId);
        await refreshWeekday();
        await refresh();
      },
      errorFallback: 'Failed to delete weekday reading.',
    });
  }

  function confirmDeleteHosafah(id: number, label: string) {
    confirmDeleteReading({
      title: 'Delete hosafah',
      body: <Text size="sm" c="dimmed">Delete hosafah: {label}?</Text>,
      onDelete: async () => {
        await deleteHosafah(id);
        await refreshHosafot();
        await refresh();
      },
      errorFallback: 'Failed to delete hosafah.',
    });
  }

  return { readings, loadReadings, confirmDelete, confirmDeleteSpecial, confirmDeleteWeekday, confirmDeleteHosafah };
}

async function submitWeekdayReading(
  form: ManageForm,
  weekdayAliyot: ReturnType<typeof useApp>['weekdayAliyot'],
  setMsg: (m: { text: string; error: boolean }) => void,
  reset: () => void,
  refreshWeekday: () => Promise<void>,
): Promise<boolean> {
  const dateStr = toDateStr(form.date) || null;
  if (!form.parsha || !form.aliyah.length || !dateStr) {
    setMsg({ text: 'Select parsha, at least one aliyah, and a date.', error: true });
    return true;
  }
  try {
    const targets = weekdayAliyot.filter(wa => wa.parsha === form.parsha && form.aliyah.includes(String(wa.aliyahNum)));
    for (const wa of targets)
      await postWeekdayReading({ weekday_aliyah_id: wa.id, date_read: dateStr, note: form.occasion || undefined, location: form.location || undefined });
    setMsg({ text: `Weekday reading${targets.length > 1 ? 's' : ''} added.`, error: false });
    reset();
    await refreshWeekday();
  } catch (e: unknown) {
    openErrorModal((e as { detail?: string }).detail ?? ERR_UNREACHABLE);
  }
  return true;
}

async function submitHosafahReading(
  form: ManageForm,
  setMsg: (m: { text: string; error: boolean }) => void,
  reset: () => void,
  refreshHosafot: () => Promise<void>,
): Promise<boolean> {
  const dateStr = toDateStr(form.date) || null;
  const cs = Number(form.hosafahChapterStart), vs = Number(form.hosafahVerseStart);
  const ce = Number(form.hosafahChapterEnd),   ve = Number(form.hosafahVerseEnd);
  const ps = Number(form.hosafahPseukim);
  if (!form.hosafahSefer || !dateStr || !cs || !vs || !ce || !ve || !ps) {
    setMsg({ text: 'Select a sefer, fill in all verse fields, and pick a date.', error: true });
    return true;
  }
  try {
    await postHosafah({
      sefer:            form.hosafahSefer,
      parsha_id_1:      form.hosafahParshaId1,
      parsha_id_2:      form.hosafahParshaId2,
      occasion_id:      form.hosafahOccasionId,
      is_double_parsha: form.hosafahIsDoubleParsha ? 1 : 0,
      chapter_start:    cs, verse_start: vs,
      chapter_end:      ce, verse_end:   ve,
      pseukim:          ps,
      date_read:        dateStr,
      note:             form.occasion || undefined,
      location:         form.location || undefined,
    });
    setMsg({ text: 'Hosafah recorded.', error: false });
    reset();
    await refreshHosafot();
  } catch (e: unknown) {
    openErrorModal((e as { detail?: string }).detail ?? ERR_UNREACHABLE);
  }
  return true;
}

function useReadingFormBase() {
  const [form, setForm] = useState<ManageForm>(EMPTY_FORM);
  const [msg,  setMsg]  = useState({ text: '', error: false });

  function setField(key: keyof ManageForm, value: ManageForm[keyof ManageForm]) {
    setForm(f => applyFieldChange(f, key, value));
  }

  function resetFormAndMsg() {
    setForm(EMPTY_FORM);
    setMsg({ text: '', error: false });
  }

  function validateOrSetMsg(): boolean {
    if (form.readingType === 'holiday') {
      if (!form.occasionAliyahIds.length || !form.date) {
        setMsg({ text: 'Select at least one aliyah and a date.', error: true });
        return false;
      }
      return true;
    }
    const err = validateForm(form);
    if (err) { setMsg({ text: err, error: true }); return false; }
    return true;
  }

  return { form, setForm, msg, setMsg, setField, resetFormAndMsg, validateOrSetMsg };
}

type AddFormCallbacks = {
  refresh:        () => Promise<void>;
  refreshSpecial: () => Promise<void>;
  refreshWeekday: () => Promise<void>;
  refreshHosafot: () => Promise<void>;
  loadReadings:   () => Promise<void>;
};

function useAddForm(callbacks: AddFormCallbacks, allRows: MappedRow[], pairs: ParshaPair[], weekdayAliyot: ReturnType<typeof useApp>['weekdayAliyot']) {
  const { refresh, refreshSpecial, refreshWeekday, refreshHosafot, loadReadings } = callbacks;
  const { form, msg, setMsg, setField, resetFormAndMsg, validateOrSetMsg } = useReadingFormBase();

  function reset() { resetFormAndMsg(); }

  async function submit() {
    if (form.readingType === 'weekday') {
      await submitWeekdayReading(form, weekdayAliyot, setMsg, reset, refreshWeekday);
      return;
    }
    if (form.readingType === 'hosafah') {
      await submitHosafahReading(form, setMsg, reset, refreshHosafot);
      return;
    }
    if (!validateOrSetMsg()) return;
    try {
      const result = await submitReading(form, null, false, allRows, pairs, refresh, refreshSpecial);
      setMsg({ text: result, error: false });
      reset();
      await loadReadings();
    } catch (e: unknown) {
      openErrorModal((e as { detail?: string }).detail ?? ERR_UNREACHABLE);
    }
  }

  return { form, setField, msg, reset, submit };
}

/** The four reading kinds that can be edited via the modal — mirrors ManageForm.readingType minus 'double_parsha'. */
type ReadingKind = 'standard' | 'holiday' | 'weekday' | 'hosafah';

function useEditModal(refresh: () => Promise<void>, refreshSpecial: () => Promise<void>, refreshWeekday: () => Promise<void>, refreshHosafot: () => Promise<void>, loadReadings: () => Promise<void>, allRows: MappedRow[], pairs: ParshaPair[]) {
  const { form, setForm, msg, setMsg, setField, resetFormAndMsg, validateOrSetMsg } = useReadingFormBase();

  const [editing,  setEditing]  = useState<{ kind: ReadingKind; id: number } | null>(null);
  const [recreate, setRecreate] = useState(false);
  const [locked,   setLocked]   = useState(false);
  const [open,     setOpen]     = useState(false);

  // Public surface kept identical to the old four separate states — consumers/tests read these.
  const editId        = editing?.kind === 'standard' ? editing.id : null;
  const editSpecialId = editing?.kind === 'holiday'  ? editing.id : null;
  const editWeekdayId = editing?.kind === 'weekday'  ? editing.id : null;
  const editHosafahId = editing?.kind === 'hosafah'  ? editing.id : null;

  // Simple put(id, body) -> refresh() pairs for the two kinds whose submit is just a date/note/location update.
  const EDIT_KINDS = {
    weekday: { title: 'Edit Weekday Reading', put: putWeekdayReading, refresh: refreshWeekday },
    hosafah: { title: 'Edit Hosafah',         put: putHosafah,        refresh: refreshHosafot },
  } as const;

  function close() {
    resetFormAndMsg();
    setEditing(null);
    setRecreate(false);
    setLocked(false);
    setOpen(false);
  }

  function beginEdit(kind: ReadingKind, id: number, editForm: ManageForm, message: string, isLocked = false) {
    setEditing({ kind, id });
    setRecreate(false);
    setLocked(isLocked);
    setForm(editForm);
    setMsg({ text: message, error: false });
    setOpen(true);
  }

  function startEdit(r: ReadingRecord) {
    beginEdit('standard', r.id, buildEditForm(r), 'Parsha, aliyah, and date are locked. Use Re-create to change them.', true);
  }

  function startEditSpecial(sr: SpecialReadingRecord) {
    beginEdit('holiday', sr.id, {
      ...EMPTY_FORM,
      readingType:       'holiday',
      occasionId:        sr.occasionId,
      occasionAliyahIds: [sr.occasionAliyahId],
      isShabbatVariant:  sr.isShabbatVariant,
      date:              sr.dateRead ? new Date(sr.dateRead + 'T00:00:00') : null,
      occasion:          sr.note,
      location:          sr.location,
    }, 'Editing holiday reading — change any fields and save, or cancel.');
  }

  function startEditWeekday(wa: MappedWeekdayAliyah) {
    beginEdit('weekday', wa.readingId, {
      ...EMPTY_FORM,
      readingType: 'weekday',
      date:        wa.dateRead ? new Date(wa.dateRead + 'T00:00:00') : null,
      location:    wa.location,
      occasion:    wa.note,
    }, 'Editing weekday reading — change date, note, or location and save.');
  }

  function startEditHosafah(hr: MappedHosafah) {
    beginEdit('hosafah', hr.id, {
      ...EMPTY_FORM,
      readingType: 'hosafah',
      date:        hr.dateRead ? new Date(hr.dateRead + 'T00:00:00') : null,
      location:    hr.location,
      occasion:    hr.note,
    }, 'Editing hosafah — change date, note, or location and save.');
  }

  function doRecreate() {
    setRecreate(true);
    setLocked(false);
    setMsg({ text: 'All fields unlocked. This will delete the old reading and create a new one.', error: false });
  }

  async function submit() {
    if (editing && (editing.kind === 'weekday' || editing.kind === 'hosafah')) {
      if (!form.date) { setMsg({ text: 'A date is required.', error: true }); return; }
      const dateStr = toDateStr(form.date);
      const { put, refresh: refreshKind } = EDIT_KINDS[editing.kind];
      try {
        await put(editing.id, { date_read: dateStr, note: form.occasion || undefined, location: form.location || undefined });
        close();
        await refreshKind();
      } catch (e: unknown) {
        openErrorModal((e as { detail?: string }).detail ?? ERR_UNREACHABLE);
      }
      return;
    }
    if (!validateOrSetMsg()) return;
    try {
      await submitReading(form, editSpecialId ?? editId, recreate, allRows, pairs, refresh, refreshSpecial);
      close();
      await loadReadings();
    } catch (e: unknown) {
      openErrorModal((e as { detail?: string }).detail ?? ERR_UNREACHABLE);
    }
  }

  let formTitle: string;
  let submitLabel: string;
  if (editing && (editing.kind === 'weekday' || editing.kind === 'hosafah')) {
    formTitle   = EDIT_KINDS[editing.kind].title;
    submitLabel = 'Save Changes';
  } else if (editSpecialId !== null) { formTitle = 'Edit Holiday Reading'; submitLabel = 'Save Changes'; }
  else if (recreate)                 { formTitle = 'Re-create Reading';    submitLabel = 'Re-create'; }
  else                                { formTitle = 'Edit Reading';         submitLabel = 'Save Changes'; }

  return { open, form, setField, editId, editSpecialId, editWeekdayId, editHosafahId, recreate, locked, msg, startEdit, startEditSpecial, startEditWeekday, startEditHosafah, doRecreate, close, submit, formTitle, submitLabel };
}

/**
 * Bundles the entire readings CRUD surface (add form, edit modal, delete confirmations, write access,
 * and the standard-reading id lookup) so the Reading Log can host it. Extracted from the old
 * Manage page.
 */
export function useReadingCrud() {
  const { allRows, SEFER_ORDER, SEFER_MAP, TLIT, parshaIndex, pairs, parshaById, refresh,
          refreshSpecial, weekdayAliyot, refreshWeekday, refreshHosafot, canWrite } = useApp();

  const { readings, loadReadings, confirmDelete, confirmDeleteSpecial, confirmDeleteWeekday, confirmDeleteHosafah }
    = useManageData(refresh, refreshSpecial, refreshWeekday, refreshHosafot);

  const add  = useAddForm({ refresh, refreshSpecial, refreshWeekday, refreshHosafot, loadReadings }, allRows, pairs, weekdayAliyot);
  const edit = useEditModal(refresh, refreshSpecial, refreshWeekday, refreshHosafot, loadReadings, allRows, pairs);

  const seferMeta: FormSeferMeta = { SEFER_ORDER, SEFER_MAP, parshaIndex, TLIT, parshaById };
  const addOptions  = useMemo(() => buildFormOptions(add.form,  allRows, pairs, seferMeta),
    [add.form.parsha, add.form.readingType, add.form.pairId, allRows, pairs, seferMeta]);
  const editOptions = useMemo(() => buildFormOptions(edit.form, allRows, pairs, seferMeta),
    [edit.form.parsha, edit.form.readingType, edit.form.pairId, allRows, pairs, seferMeta]);

  // Lookup from a standard display row (parsha|aliyah|date) back to its DB ReadingRecord.
  const readingsById = useMemo(() => {
    const m = new Map<string, ReadingRecord>();
    for (const r of readings) m.set(readingKey(r.parsha, r.aliyah, r.date_read), r);
    return m;
  }, [readings]);

  return {
    canWrite,
    readingsById,
    add, addOptions,
    edit, editOptions,
    confirmDelete, confirmDeleteSpecial, confirmDeleteWeekday, confirmDeleteHosafah,
  };
}
