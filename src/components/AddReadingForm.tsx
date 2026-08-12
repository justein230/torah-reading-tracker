import { useState, useMemo, useEffect } from 'react';
import { Text, Select, MultiSelect, Button, TextInput, Group, Switch, Radio, Card } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useApp } from '../context/AppContext.js';
import { countPseukim } from '../compute.js';
import { fmtDate, toDateStr } from '../utils.js';
import { buildGroupedOptions } from '../utils/form-options.js';
import { CATEGORY_LABELS_FORM } from '../constants.js';
import { ParshaField } from './shared/ParshaField.js';
import type { ManageForm, MappedRow } from '../types/index.js';

function autoFillFromSchedule(
  key: string | null,
  schedule: Record<string, string>,
  TLIT: Record<string, string>,
  setField: (k: keyof ManageForm, v: ManageForm[keyof ManageForm]) => void,
) {
  if (!key) return;
  const schedDate = schedule[TLIT[key] ?? ''];
  if (schedDate) setField('date', new Date(schedDate + 'T00:00:00'));
}

function getDoubleParshaMismatch(
  form: ManageForm,
  allRows: MappedRow[],
  schedule: Record<string, string>,
  TLIT: Record<string, string>,
): string | null {
  if (form.readingType !== 'standard' || !form.parsha || !form.date) return null;
  const pairNameEn = allRows.find(r => r.parsha === form.parsha)?.pairNameEn ?? '';
  if (!pairNameEn) return null;
  const pairDate = schedule[pairNameEn];
  if (!pairDate) return null;
  const entered = toDateStr(form.date);
  if (entered !== pairDate) return null;
  return `${TLIT[form.parsha] ?? form.parsha} is typically read as part of ${pairNameEn} on this date. Consider using Double-Parsha Shabbat instead.`;
}

function getScheduleWarning(form: ManageForm, schedule: Record<string, string>, TLIT: Record<string, string>, locked: boolean): string | null {
  if (!form.parsha || !form.date || locked) return null;
  const expected = schedule[TLIT[form.parsha] ?? ''];
  if (!expected) return null;
  const entered = toDateStr(form.date);
  if (entered === expected) return null;
  return `This parsha is typically read on ${fmtDate(expected)}. This may be a special or non-standard reading.`;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function buildOccasionSelectOptions(
  occasions: { id: number; category: string; nameEn: string }[],
  categoryLabels: Record<string, string>,
): SelectOption[] {
  const categories = [...new Set(occasions.map(o => o.category))];
  return buildGroupedOptions(
    categories,
    cat => categoryLabels[cat] ?? cat,
    cat => occasions.filter(o => o.category === cat),
    occ => ({ value: String(occ.id), label: occ.nameEn }),
  );
}

function getAliyahPlaceholder(isDouble: boolean, pairId: number | null, parsha: string): string {
  if (isDouble) return pairId ? 'Select aliyah…' : '— Select Double Parsha first —';
  return parsha ? 'Select aliyah…' : '— Select Parsha first —';
}

interface AddReadingFormProps {
  form: ManageForm;
  setField: (key: keyof ManageForm, value: ManageForm[keyof ManageForm]) => void;
  editId: number | null;
  recreate: boolean;
  locked: boolean;
  msg: { text: string; error: boolean };
  formTitle: string;
  submitLabel: string;
  doRecreate: () => void;
  submit: () => void;
  resetForm: () => void;
  parshaOptions: SelectOption[];
  aliyahOptions: SelectOption[];
  inModal?: boolean;
}

function HosafahFormSection({ form, setField }: Readonly<{
  form: ManageForm;
  setField: (key: keyof ManageForm, value: ManageForm[keyof ManageForm]) => void;
}>) {
  const { SEFER_ORDER, SEFER_MAP, parshaIndex, TLIT, parshaById, occasions } = useApp();

  const computedPseukim = useMemo(() => {
    const cs = Number(form.hosafahChapterStart), vs = Number(form.hosafahVerseStart);
    const ce = Number(form.hosafahChapterEnd),   ve = Number(form.hosafahVerseEnd);
    if (cs > 0 && vs > 0 && ce > 0 && ve > 0) {
      return countPseukim(SEFER_MAP[form.hosafahSefer]?.chapterVerses ?? [], cs, vs, ce, ve);
    }
    return null;
  }, [form.hosafahChapterStart, form.hosafahVerseStart, form.hosafahChapterEnd, form.hosafahVerseEnd, form.hosafahSefer, SEFER_MAP]);

  useEffect(() => {
    setField('hosafahPseukim', computedPseukim == null ? '' : String(computedPseukim));
  // setField is a plain function (not memoized) but always calls setForm with a functional update — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedPseukim]);

  const parshaNameToId = useMemo(
    () => Object.fromEntries(Object.entries(parshaById).map(([id, name]) => [name, Number(id)])),
    [parshaById],
  );

  const parshaToSefer = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [sefer, names] of Object.entries(parshaIndex))
      for (const name of names) map[name] = sefer;
    return map;
  }, [parshaIndex]);

  const allParshaOptions = useMemo(
    () => SEFER_ORDER.flatMap(sefer => {
      const names = parshaIndex[sefer] ?? [];
      if (!names.length) return [];
      return [
        { value: `__group_${sefer}`, label: SEFER_MAP[sefer]?.en ?? sefer, disabled: true },
        ...names.map(name => ({ value: String(parshaNameToId[name] ?? 0), label: `${name}  —  ${TLIT[name] ?? name}` })),
      ];
    }),
    [SEFER_ORDER, parshaIndex, SEFER_MAP, parshaNameToId, TLIT],
  );

  const parsha2Options: SelectOption[] = form.hosafahSefer
    ? (parshaIndex[form.hosafahSefer] ?? []).map(name => ({
        value: String(parshaNameToId[name] ?? 0),
        label: `${name}  —  ${TLIT[name] ?? name}`,
      }))
    : [];

  const occasionOptions = buildOccasionSelectOptions(occasions, CATEGORY_LABELS_FORM);

  return (
    <>
      <Select
        label="Parsha 1"
        placeholder="Select parsha…"
        data={allParshaOptions}
        value={form.hosafahParshaId1 ? String(form.hosafahParshaId1) : null}
        onChange={v => {
          const id = v ? Number(v) : null;
          const name = id ? (parshaById[id] ?? '') : '';
          setField('hosafahParshaId1', id);
          setField('hosafahSefer', name ? (parshaToSefer[name] ?? '') : '');
          setField('hosafahParshaId2', null);
        }}
        clearable
        searchable
        mb={12}
      />
      <Select
        label="Parsha 2 (optional — for span across two parshiot)"
        placeholder={form.hosafahSefer ? 'Select parsha…' : '— Select Parsha 1 first —'}
        data={parsha2Options}
        value={form.hosafahParshaId2 ? String(form.hosafahParshaId2) : null}
        onChange={v => setField('hosafahParshaId2', v ? Number(v) : null)}
        disabled={!form.hosafahSefer}
        clearable
        mb={12}
      />
      <Select
        label="Holiday / Special Maftir (optional)"
        placeholder="Link to a holiday…"
        data={occasionOptions}
        value={form.hosafahOccasionId ? String(form.hosafahOccasionId) : null}
        onChange={v => setField('hosafahOccasionId', v ? Number(v) : null)}
        clearable
        searchable
        mb={12}
      />
      <Switch
        label="Read as part of a double-parsha"
        checked={form.hosafahIsDoubleParsha}
        onChange={e => setField('hosafahIsDoubleParsha', e.currentTarget.checked)}
        mb={12}
      />
      <Group gap={8} mb={12}>
        <TextInput label="Chapter Start" placeholder="e.g. 12" value={form.hosafahChapterStart} onChange={e => setField('hosafahChapterStart', e.target.value)} style={{ flex: 1 }} />
        <TextInput label="Verse Start"   placeholder="e.g. 1"  value={form.hosafahVerseStart}   onChange={e => setField('hosafahVerseStart',   e.target.value)} style={{ flex: 1 }} />
        <TextInput label="Chapter End"   placeholder="e.g. 12" value={form.hosafahChapterEnd}   onChange={e => setField('hosafahChapterEnd',   e.target.value)} style={{ flex: 1 }} />
        <TextInput label="Verse End"     placeholder="e.g. 16" value={form.hosafahVerseEnd}     onChange={e => setField('hosafahVerseEnd',     e.target.value)} style={{ flex: 1 }} />
      </Group>
      {computedPseukim === null
        ? <Text size="sm" c="orange" mb={12}>Enter a verse range and select Parsha 1 to compute pseukim.</Text>
        : <Text size="sm" c="dimmed" mb={12}>{computedPseukim} pseukim</Text>
      }
    </>
  );
}

export function AddReadingForm({
  form, setField, editId, recreate, locked, msg,
  formTitle, submitLabel,
  doRecreate, submit, resetForm,
  parshaOptions, aliyahOptions,
  inModal = false,
}: Readonly<AddReadingFormProps>) {
  const { SEFER_ORDER, SEFER_MAP, parshaIndex, TLIT, schedule, pairs, allRows,
          occasions, occasionAliyot, weekdayAliyot } = useApp();
  const [autoFillDate, setAutoFillDate] = useState(true);

  const isDouble  = form.readingType === 'double_parsha';
  const isHoliday = form.readingType === 'holiday';
  const isWeekday = form.readingType === 'weekday';
  const isHosafah = form.readingType === 'hosafah';
  const isStandard    = form.readingType === 'standard';
  const isParshaBased = !isHoliday && !isWeekday && !isHosafah; /* standard or double_parsha */


  // Weekday aliyah options for selected parsha (always 1, 2, 3)
  const weekdayAliyahOptions = isWeekday && form.parsha
    ? weekdayAliyot
        .filter(wa => wa.parsha === form.parsha)
        .sort((a, b) => a.aliyahNum - b.aliyahNum)
        .map(wa => ({
          value: String(wa.aliyahNum),
          label: `Aliyah ${wa.aliyahNum}  —  ${wa.chapterStart}:${wa.verseStart}–${wa.chapterEnd}:${wa.verseEnd} (${wa.pseukim} v.)`,
        }))
    : [];

  const pairOptions = pairs.map(p => ({ value: String(p.id), label: `${p.name}  —  ${p.name_en}` }));

  const occasionSelectOptions = buildOccasionSelectOptions(occasions, CATEGORY_LABELS_FORM);

  // Build aliyah options for selected occasion (filtered by Shabbat variant)
  const occasionAliyahOptions: SelectOption[] = form.occasionId
    ? occasionAliyot
        .filter(oa => oa.occasionId === form.occasionId && oa.isShabbatVariant === form.isShabbatVariant)
        .map(oa => ({
          value: String(oa.id),
          label: `Aliyah ${oa.aliyahKey}  —  ${oa.parshaEn} ${oa.chapterStart}:${oa.verseStart}–${oa.chapterEnd}:${oa.verseEnd} (${oa.pseukim} v.)`,
        }))
    : [];

  // Check whether selected occasion has a Shabbat variant at all
  const selectedOccasionHasShabbatVariant = form.occasionId
    ? occasionAliyot.some(oa => oa.occasionId === form.occasionId && oa.isShabbatVariant)
    : false;

  const aliyahPlaceholder = getAliyahPlaceholder(isDouble, form.pairId, form.parsha);
  const aliyahDisabled = isDouble ? !form.pairId : !form.parsha;

  const handleParshaChange = (parsha: string | null) => {
    setField('parsha', parsha ?? '');
    if (autoFillDate) autoFillFromSchedule(parsha, schedule, TLIT, setField);
  };

  const scheduleWarning = getScheduleWarning(form, schedule, TLIT, locked);
  const doubleParshaMismatch = getDoubleParshaMismatch(form, allRows, schedule, TLIT);

  const inner = (
    <>
      {!inModal && <Text fw={600} mb={16}>{formTitle}</Text>}

      {!locked && (
        <>
          <Radio.Group
            label="Reading Type"
            value={form.readingType}
            onChange={(v: string) => {
              setField('readingType', v);
              setField('pairId', null);
              setField('parsha', '');
              setField('occasionId', null);
              setField('occasionAliyahIds', []);
            }}
            mb={12}
          >
            <Group mt={4} gap="md">
              <Radio value="standard"      label="Standard Shabbat" />
              <Radio value="double_parsha" label="Double-Parsha Shabbat" />
              <Radio value="holiday"       label="Holiday" />
              <Radio value="weekday"       label="Weekday" />
              <Radio value="hosafah"       label="Hosafah" />
            </Group>
          </Radio.Group>
          {isDouble && (
            <Select
              label="Double Parsha"
              placeholder="Select Double Parsha…"
              data={pairOptions}
              value={form.pairId ? String(form.pairId) : null}
              onChange={v => {
                setField('pairId', v ? Number(v) : null);
                setField('parsha', '');
                if (autoFillDate && v) {
                  const pair = pairs.find(p => p.id === Number(v));
                  const schedDate = pair ? schedule[pair.name_en] : undefined;
                  if (schedDate) setField('date', new Date(schedDate + 'T00:00:00'));
                }
              }}
              mb={12}
            />
          )}
          {isHoliday && (
            <>
              <Select
                label="Occasion"
                placeholder="Select holiday…"
                data={occasionSelectOptions}
                value={form.occasionId ? String(form.occasionId) : null}
                onChange={v => {
                  setField('occasionId', v ? Number(v) : null);
                  setField('occasionAliyahIds', []);
                  setField('isShabbatVariant', false);
                }}
                mb={12}
                searchable
              />
              {selectedOccasionHasShabbatVariant && (
                <Switch
                  label="Shabbat reading (expanded aliyot)"
                  checked={form.isShabbatVariant}
                  onChange={e => {
                    setField('isShabbatVariant', e.currentTarget.checked);
                    setField('occasionAliyahIds', []);
                  }}
                  mb={12}
                />
              )}
              <MultiSelect
                label="Aliyot"
                placeholder={form.occasionId ? 'Select aliyot…' : '— Select Occasion first —'}
                data={occasionAliyahOptions}
                value={form.occasionAliyahIds.map(String)}
                onChange={v => setField('occasionAliyahIds', v.map(Number))}
                disabled={!form.occasionId}
                mb={12}
              />
            </>
          )}
        </>
      )}

      {isStandard && (
        <ParshaField
          value={form.parsha}
          onSelect={v => handleParshaChange(v)}
          parshaOptions={parshaOptions}
          locked={locked}
          SEFER_ORDER={SEFER_ORDER}
          SEFER_MAP={SEFER_MAP}
          parshaIndex={parshaIndex}
          TLIT={TLIT}
        />
      )}

      {isWeekday && (
        <ParshaField
          value={form.parsha}
          onSelect={v => setField('parsha', v)}
          parshaOptions={parshaOptions}
          SEFER_ORDER={SEFER_ORDER}
          SEFER_MAP={SEFER_MAP}
          parshaIndex={parshaIndex}
          TLIT={TLIT}
        />
      )}

      {isWeekday && (
        <MultiSelect
          label="Aliyah"
          placeholder={form.parsha ? 'Select aliyot…' : '— Select Parsha first —'}
          data={weekdayAliyahOptions}
          value={form.aliyah}
          onChange={v => setField('aliyah', v)}
          disabled={!form.parsha}
          mb={12}
        />
      )}

      {isParshaBased && (
        <>
          {doubleParshaMismatch && (
            <Text size="xs" mb={12} style={{ color: 'var(--warning, #f59e0b)' }}>{doubleParshaMismatch}</Text>
          )}
          <MultiSelect
            label="Aliyah"
            placeholder={aliyahPlaceholder}
            data={aliyahOptions}
            value={form.aliyah}
            onChange={v => setField('aliyah', v)}
            disabled={locked || aliyahDisabled}
            mb={12}
          />
        </>
      )}

      {isHosafah && <HosafahFormSection form={form} setField={setField} />}

      <Group justify="space-between" align="center" mb={4}>
        <Text size="sm" fw={500}>Date</Text>
        {isParshaBased && (
          <Switch
            label="Auto-fill from schedule"
            size="xs"
            checked={autoFillDate}
            onChange={e => setAutoFillDate(e.currentTarget.checked)}
          />
        )}
      </Group>
      <DateInput
        label={null}
        placeholder="Pick a date"
        value={form.date instanceof Date ? form.date : null}
        onChange={d => setField('date', d ? new Date(d + 'T00:00:00') : null)}
        disabled={locked}
        firstDayOfWeek={0}
        valueFormat="YYYY-MM-DD"
        mb={12}
      />
      {scheduleWarning && !isHoliday && !isWeekday && (
        <Text size="xs" c="dimmed" mb={12}>{scheduleWarning}</Text>
      )}
      <TextInput
        label={isHoliday || isWeekday ? 'Note (optional)' : 'Occasion (optional)'}
        placeholder={isHoliday || isWeekday ? 'e.g. which shul' : 'e.g. Shabbat, Yom Tov'}
        value={form.occasion}
        onChange={e => setField('occasion', e.target.value)}
        mb={12}
      />
      <TextInput label="Location (optional)"  placeholder="e.g. Home, Shul"        value={form.location} onChange={e => setField('location', e.target.value)} mb={16} />

      {msg.text && <Text size="sm" mb={12} style={{ color: msg.error ? 'var(--error)' : 'var(--success)' }}>{msg.text}</Text>}

      <Group gap={8}>
        <Button onClick={submit}>{submitLabel}</Button>
        {editId !== null && !recreate && !isHoliday && !isWeekday && (
          <Button variant="outline" onClick={doRecreate}>Re-create</Button>
        )}
        {editId !== null && (
          <Button variant="subtle" color="gray" onClick={resetForm}>Cancel</Button>
        )}
      </Group>
    </>
  );

  return inModal ? inner : <Card className="card-surface" mb={24}>{inner}</Card>;
}
