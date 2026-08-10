import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateForm, saveReading, saveDoubleParsha, applyFieldChange, submitReading } from '../../src/utils/manage-utils.js';

// ── applyFieldChange ──────────────────────────────────────────────────────────

const BASE_FORM = {
  parsha: 'נֹחַ', aliyah: ['3'], date: new Date(), occasion: '', location: '',
  readingType: 'standard', pairId: null,
  occasionId: null, occasionAliyahIds: [], isShabbatVariant: false,
};

describe('applyFieldChange', () => {
  it('updates an unrelated field without touching aliyah', () => {
    const result = applyFieldChange(BASE_FORM, 'location', 'Shul');
    expect(result.location).toBe('Shul');
    expect(result.aliyah).toEqual(['3']);
  });

  it('resets aliyah when parsha changes', () => {
    const result = applyFieldChange(BASE_FORM, 'parsha', 'בְּרֵאשִׁית');
    expect(result.parsha).toBe('בְּרֵאשִׁית');
    expect(result.aliyah).toEqual([]);
  });

  it('resets aliyah when pairId changes', () => {
    const result = applyFieldChange(BASE_FORM, 'pairId', 5);
    expect(result.pairId).toBe(5);
    expect(result.aliyah).toEqual([]);
  });

  it('resets occasionAliyahIds when occasionId changes', () => {
    const form = { ...BASE_FORM, occasionId: 1, occasionAliyahIds: [10, 11] };
    const result = applyFieldChange(form, 'occasionId', 2);
    expect(result.occasionId).toBe(2);
    expect(result.occasionAliyahIds).toEqual([]);
  });

  it('does not reset occasionAliyahIds for unrelated field changes', () => {
    const form = { ...BASE_FORM, occasionAliyahIds: [10, 11] };
    const result = applyFieldChange(form, 'location', 'Home');
    expect(result.occasionAliyahIds).toEqual([10, 11]);
  });

  it('does not mutate the original form', () => {
    const original = { ...BASE_FORM };
    applyFieldChange(BASE_FORM, 'parsha', 'נֹחַ');
    expect(BASE_FORM).toEqual(original);
  });
});

// ── validateForm ──────────────────────────────────────────────────────────────

describe('validateForm', () => {
  it('returns null when all required fields are present', () => {
    expect(validateForm({ parsha: 'Bereishit', aliyah: ['1'], date: new Date() })).toBeNull();
  });

  it('returns null for multiple aliyot selected', () => {
    expect(validateForm({ parsha: 'Bereishit', aliyah: ['1', '2', '3'], date: new Date() })).toBeNull();
  });

  it('errors when parsha is missing', () => {
    expect(validateForm({ parsha: '', aliyah: ['1'], date: new Date() })).toMatch(/parsha/i);
  });

  it('errors when aliyah array is empty', () => {
    expect(validateForm({ parsha: 'Bereishit', aliyah: [], date: new Date() })).toMatch(/aliyah/i);
  });

  it('errors when date is missing', () => {
    expect(validateForm({ parsha: 'Bereishit', aliyah: ['1'], date: null })).toMatch(/date/i);
  });

  it('reports parsha error before aliyah error (field order)', () => {
    const msg = validateForm({ parsha: '', aliyah: [], date: null });
    expect(msg).toMatch(/parsha/i);
  });
});

describe('validateForm — double_parsha readingType', () => {
  it('errors when pairId is missing for double_parsha', () => {
    const msg = validateForm({ readingType: 'double_parsha', pairId: null, aliyah: ['1'], date: new Date() });
    expect(msg).toMatch(/parsha/i);
  });

  it('returns null when pairId is present for double_parsha', () => {
    expect(validateForm({ readingType: 'double_parsha', pairId: 1, aliyah: ['1'], date: new Date() })).toBeNull();
  });

  it('does not require parsha field when readingType is double_parsha', () => {
    expect(validateForm({ readingType: 'double_parsha', pairId: 1, parsha: '', aliyah: ['1'], date: new Date() })).toBeNull();
  });
});

// ── saveReading ───────────────────────────────────────────────────────────────

vi.mock('../../src/api.js', () => ({
  postReading:          vi.fn().mockResolvedValue({ id: 99, reading_type: 'original' }),
  putReading:           vi.fn().mockResolvedValue({ id: 1 }),
  deleteReading:        vi.fn().mockResolvedValue(undefined),
  postSpecialReading:   vi.fn().mockResolvedValue({ id: 10 }),
  deleteSpecialReading: vi.fn().mockResolvedValue(undefined),
  getTodayStr:          vi.fn().mockReturnValue('2025-01-01'),
  TODAY_STR:            '2025-01-01',
  mapRow:               vi.fn(r => r),
  enrichRows:           vi.fn(r => r),
}));

import { postReading, putReading, deleteReading, postSpecialReading, deleteSpecialReading } from '../../src/api.js';

const FORM = { parsha: 'Bereishit', aliyah: ['1'], date: new Date('2024-03-15'), occasion: 'Shabbat', location: 'Shul' };

describe('saveReading — new reading', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls postReading once with correct payload', async () => {
    await saveReading(FORM, null, false);
    expect(postReading).toHaveBeenCalledOnce();
    expect(postReading).toHaveBeenCalledWith(expect.objectContaining({
      parsha: 'Bereishit', aliyah: 1, date_read: '2024-03-15',
    }));
    expect(deleteReading).not.toHaveBeenCalled();
    expect(putReading).not.toHaveBeenCalled();
  });

  it('returns "Reading added." message', async () => {
    const msg = await saveReading(FORM, null, false);
    expect(msg).toBe('Reading added.');
  });

  it('calls postReading once per aliyah for multi-select', async () => {
    const form = { ...FORM, aliyah: ['1', '3', '5'] };
    await saveReading(form, null, false);
    expect(postReading).toHaveBeenCalledTimes(3);
    expect(postReading).toHaveBeenCalledWith(expect.objectContaining({ aliyah: 1 }));
    expect(postReading).toHaveBeenCalledWith(expect.objectContaining({ aliyah: 3 }));
    expect(postReading).toHaveBeenCalledWith(expect.objectContaining({ aliyah: 5 }));
  });

  it('returns plural message when multiple aliyot added', async () => {
    const msg = await saveReading({ ...FORM, aliyah: ['1', '2'] }, null, false);
    expect(msg).toBe('2 readings added.');
  });
});

describe('saveReading — edit (locked, occasion/location only)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls putReading with id and occasion/location, no delete', async () => {
    await saveReading(FORM, 42, false);
    expect(putReading).toHaveBeenCalledOnce();
    expect(putReading).toHaveBeenCalledWith(42, { occasion: 'Shabbat', location: 'Shul' });
    expect(deleteReading).not.toHaveBeenCalled();
    expect(postReading).not.toHaveBeenCalled();
  });

  it('returns "Reading updated." message', async () => {
    const msg = await saveReading(FORM, 42, false);
    expect(msg).toBe('Reading updated.');
  });
});

describe('saveReading — recreate (delete + post)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls deleteReading before postReading', async () => {
    const order = [];
    deleteReading.mockImplementation(() => { order.push('delete'); return Promise.resolve(); });
    postReading.mockImplementation(() => { order.push('post'); return Promise.resolve({ id: 10 }); });

    await saveReading(FORM, 42, true);
    expect(order).toEqual(['delete', 'post']);
  });

  it('deletes the old id', async () => {
    await saveReading(FORM, 42, true);
    expect(deleteReading).toHaveBeenCalledWith(42);
  });

  it('returns "Reading re-created." message', async () => {
    const msg = await saveReading(FORM, 42, true);
    expect(msg).toBe('Reading re-created.');
  });

  it('posts once per aliyah when recreating multi-select', async () => {
    const form = { ...FORM, aliyah: ['2', '4'] };
    await saveReading(form, 42, true);
    expect(deleteReading).toHaveBeenCalledOnce();
    expect(postReading).toHaveBeenCalledTimes(2);
    expect(postReading).toHaveBeenCalledWith(expect.objectContaining({ aliyah: 2 }));
    expect(postReading).toHaveBeenCalledWith(expect.objectContaining({ aliyah: 4 }));
  });

  it('returns plural message when recreating multiple aliyot', async () => {
    const msg = await saveReading({ ...FORM, aliyah: ['1', '2'] }, 42, true);
    expect(msg).toBe('2 readings re-created.');
  });
});

describe('saveReading — date conversion', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('converts Date object to YYYY-MM-DD string', async () => {
    await saveReading({ ...FORM, date: new Date('2023-05-20T00:00:00') }, null, false);
    const payload = postReading.mock.calls[0][0];
    expect(payload.date_read).toBe('2023-05-20');
  });

  it('accepts a pre-formatted date string', async () => {
    await saveReading({ ...FORM, date: '2023-05-20' }, null, false);
    const payload = postReading.mock.calls[0][0];
    expect(payload.date_read).toBe('2023-05-20');
  });
});

// ── saveDoubleParsha ───────────────────────────────────────────────────────────

const PAIR = { id: 7, name: 'וַיַּקְהֵל-פְקוּדֵי', name_en: 'Vayakhel-Pekudei', parsha1_id: 22, parsha2_id: 23 };
const PAIRS = [PAIR];
const DOUBLE_FORM = { pairId: 7, aliyah: ['1', '2'], date: new Date('2024-03-15'), occasion: 'Shabbat', location: 'Shul' };

// allRows representing individual aliyot belonging to this double-parsha pair
const ALL_ROWS = [
  { pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 1, parsha: 'וַיַּקְהֵל', aliyah: 1 },
  { pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 2, parsha: 'פְקוּדֵי',   aliyah: 1 },
  { pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 3, parsha: 'וַיַּקְהֵל', aliyah: 2 },
];

describe('saveDoubleParsha — new reading', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls postReading once per matched individual row', async () => {
    await saveDoubleParsha(DOUBLE_FORM, null, false, ALL_ROWS, PAIRS);
    // aliyah ['1','2'] matches combinedAliyah 1 and 2
    expect(postReading).toHaveBeenCalledTimes(2);
  });

  it('passes reading_type double_parsha and pair_id to each postReading call', async () => {
    await saveDoubleParsha(DOUBLE_FORM, null, false, ALL_ROWS, PAIRS);
    for (const call of postReading.mock.calls) {
      expect(call[0].reading_type).toBe('double_parsha');
      expect(call[0].pair_id).toBe(7);
    }
  });

  it('returns plural message matching matched row count', async () => {
    const msg = await saveDoubleParsha(DOUBLE_FORM, null, false, ALL_ROWS, PAIRS);
    expect(msg).toBe('2 readings added.');
  });

  it('returns singular message when only one row matches', async () => {
    const msg = await saveDoubleParsha({ ...DOUBLE_FORM, aliyah: ['1'] }, null, false, ALL_ROWS, PAIRS);
    expect(msg).toBe('1 reading added.');
  });
});

describe('saveDoubleParsha — recreate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls deleteReading before postReading when recreate=true', async () => {
    const order = [];
    deleteReading.mockImplementation(() => { order.push('delete'); return Promise.resolve(); });
    postReading.mockImplementation(() => { order.push('post'); return Promise.resolve({ id: 10 }); });

    await saveDoubleParsha(DOUBLE_FORM, 42, true, ALL_ROWS, PAIRS);
    expect(order[0]).toBe('delete');
    expect(order.filter(x => x === 'post').length).toBe(2);
  });

  it('deletes the old id', async () => {
    await saveDoubleParsha(DOUBLE_FORM, 42, true, ALL_ROWS, PAIRS);
    expect(deleteReading).toHaveBeenCalledWith(42);
  });

  it('does not call deleteReading when recreate=false', async () => {
    await saveDoubleParsha(DOUBLE_FORM, 42, false, ALL_ROWS, PAIRS);
    expect(deleteReading).not.toHaveBeenCalled();
  });
});

// ── submitReading — holiday path ──────────────────────────────────────────────

const HOLIDAY_FORM = {
  readingType: 'holiday',
  occasionAliyahIds: [3, 7],
  date: new Date('2025-04-09'),
  occasion: 'Pesach',
  location: 'Shul',
};

describe('submitReading — holiday: always calls both refresh callbacks', () => {
  let refresh, refreshSpecial;
  beforeEach(() => {
    vi.clearAllMocks();
    refresh        = vi.fn().mockResolvedValue(undefined);
    refreshSpecial = vi.fn().mockResolvedValue(undefined);
  });

  it('calls postSpecialReading once per occasionAliyahId', async () => {
    await submitReading(HOLIDAY_FORM, null, false, [], [], refresh, refreshSpecial);
    expect(postSpecialReading).toHaveBeenCalledTimes(2);
    expect(postSpecialReading).toHaveBeenCalledWith(expect.objectContaining({ occasion_aliyah_id: 3, date_read: '2025-04-09' }));
    expect(postSpecialReading).toHaveBeenCalledWith(expect.objectContaining({ occasion_aliyah_id: 7, date_read: '2025-04-09' }));
  });

  it('always calls refreshSpecial AND refresh — regardless of coversAliyahId', async () => {
    // coversAliyahId is irrelevant to submitReading; both refreshes must always fire
    await submitReading(HOLIDAY_FORM, null, false, [], [], refresh, refreshSpecial);
    expect(refreshSpecial).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('calls deleteSpecialReading before posting when editId is provided (edit flow)', async () => {
    const order = [];
    deleteSpecialReading.mockImplementation(() => { order.push('delete'); return Promise.resolve(); });
    postSpecialReading.mockImplementation(() => { order.push('post'); return Promise.resolve({ id: 10 }); });
    await submitReading(HOLIDAY_FORM, 42, false, [], [], refresh, refreshSpecial);
    expect(order[0]).toBe('delete');
    expect(deleteSpecialReading).toHaveBeenCalledWith(42);
  });

  it('returns a message with the count of holiday readings recorded', async () => {
    const msg = await submitReading(HOLIDAY_FORM, null, false, [], [], refresh, refreshSpecial);
    expect(msg).toBe('Recorded 2 holiday reading(s).');
  });
});

describe('submitReading — standard path: calls refresh', () => {
  let refresh, refreshSpecial;
  beforeEach(() => {
    vi.clearAllMocks();
    refresh        = vi.fn().mockResolvedValue(undefined);
    refreshSpecial = vi.fn().mockResolvedValue(undefined);
  });

  it('calls refresh after a standard reading', async () => {
    const form = { parsha: 'Bereishit', aliyah: ['1'], date: new Date('2024-03-15'), occasion: '', location: '' };
    await submitReading(form, null, false, [], [], refresh, refreshSpecial);
    expect(refresh).toHaveBeenCalledOnce();
    expect(refreshSpecial).not.toHaveBeenCalled();
  });
});
