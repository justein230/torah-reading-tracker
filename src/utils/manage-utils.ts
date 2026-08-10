import { postReading, putReading, deleteReading, postSpecialReading, deleteSpecialReading } from '../api.js';
import { toDateStr } from '../utils.js';
import type { ManageForm, MappedRow, ParshaPair } from '../types/index.js';

export function applyFieldChange(
  f: ManageForm,
  key: keyof ManageForm,
  value: ManageForm[keyof ManageForm],
): ManageForm {
  return {
    ...f,
    [key]: value,
    ...(key === 'parsha' || key === 'pairId' ? { aliyah: [] } : {}),
    ...(key === 'occasionId' ? { occasionAliyahIds: [] } : {}),
  };
}

export async function submitReading(
  form: ManageForm,
  editId: number | null,
  recreate: boolean,
  allRows: MappedRow[],
  pairs: ParshaPair[],
  refresh: () => Promise<void>,
  refreshSpecial: () => Promise<void>,
): Promise<string> {
  const dateStr = toDateStr(form.date);
  let message: string;

  if (form.readingType === 'holiday') {
    if (editId !== null) await deleteSpecialReading(editId);
    for (const oaId of form.occasionAliyahIds ?? [])
      await postSpecialReading({ occasion_aliyah_id: oaId, date_read: dateStr, note: form.occasion || undefined, location: form.location || undefined });
    message = `Recorded ${(form.occasionAliyahIds ?? []).length} holiday reading(s).`;
  } else {
    message = form.readingType === 'double_parsha'
      ? await saveDoubleParsha(form, editId, recreate, allRows, pairs)
      : await saveReading(form, editId, recreate);
  }

  await Promise.all([
    refresh(),
    ...(form.readingType === 'holiday' ? [refreshSpecial()] : []),
  ]);

  return message;
}

export function validateForm(form: ManageForm): string | null {
  if (form.readingType === 'double_parsha') {
    if (!form.pairId) return 'Please select a double parsha.';
  } else if (!form.parsha) {
    return 'Please select a parsha.';
  }
  if (!Array.isArray(form.aliyah) || !form.aliyah.length) return 'Please select an aliyah.';
  if (!form.date) return 'Please enter a date.';
  return null;
}

export async function saveDoubleParsha(
  form: ManageForm,
  editId: number | null,
  recreate: boolean,
  allRows: MappedRow[],
  pairs: ParshaPair[],
): Promise<string> {
  const pair = pairs.find(p => p.id === form.pairId);
  if (!pair) throw new Error('Pair not found');
  const dateStr = toDateStr(form.date);
  const selectedCombined = new Set(form.aliyah.map(Number));
  const individual = allRows.filter(r => r.pairNameEn === pair.name_en && selectedCombined.has(r.combinedAliyah ?? -1));
  if (editId !== null && recreate) await deleteReading(editId);
  for (const r of individual) {
    await postReading({
      parsha: r.parsha,
      aliyah: Number(r.aliyah),
      date_read: dateStr,
      occasion: form.occasion,
      location: form.location,
      reading_type: 'double_parsha',
      pair_id: form.pairId!,
    });
  }
  return individual.length === 1 ? '1 reading added.' : `${individual.length} readings added.`;
}

export async function saveReading(form: ManageForm, editId: number | null, recreate: boolean): Promise<string> {
  const dateStr = toDateStr(form.date);
  const aliyot = Array.isArray(form.aliyah) ? form.aliyah : [form.aliyah];
  const base = {
    parsha: form.parsha, date_read: dateStr, occasion: form.occasion, location: form.location,
    reading_type: form.readingType === 'double_parsha' ? 'double_parsha' as const : 'standard' as const,
    pair_id: form.pairId ?? undefined,
  };
  if (editId !== null && recreate) {
    await deleteReading(editId);
    for (const a of aliyot) await postReading({ ...base, aliyah: Number.parseInt(a) });
    return aliyot.length > 1 ? `${aliyot.length} readings re-created.` : 'Reading re-created.';
  }
  if (editId !== null) {
    await putReading(editId, { occasion: form.occasion, location: form.location });
    return 'Reading updated.';
  }
  for (const a of aliyot) await postReading({ ...base, aliyah: Number.parseInt(a) });
  return aliyot.length > 1 ? `${aliyot.length} readings added.` : 'Reading added.';
}
