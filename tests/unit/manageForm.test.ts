import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateForm, saveReading, saveDoubleParsha, applyFieldChange, submitReading } from '../../src/utils/manage-utils.js';
import type { ManageForm, MappedRow, ParshaPair } from '../../src/types/index.js';

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

const post = vi.mocked(postReading);
const del  = vi.mocked(deleteReading);

const BASE_FORM: ManageForm = {
  parsha: 'נֹחַ', aliyah: ['3'], date: new Date('2024-03-15T00:00:00'), occasion: 'Shabbat', location: 'Shul',
  readingType: 'standard', pairId: null,
  occasionId: null, occasionAliyahIds: [], isShabbatVariant: false,
  hosafahSefer: '', hosafahParshaId1: null, hosafahParshaId2: null, hosafahOccasionId: null, hosafahIsDoubleParsha: false,
  hosafahChapterStart: '', hosafahVerseStart: '', hosafahChapterEnd: '', hosafahVerseEnd: '', hosafahPseukim: '',
};
const form = (over: Partial<ManageForm> = {}): ManageForm => ({ ...BASE_FORM, ...over });

// Records the order in which the delete and post mocks are called.
function recordCallOrder(): string[] {
  const order: string[] = [];
  del.mockImplementation(() => { order.push('delete'); return Promise.resolve(); });
  post.mockImplementation(() => { order.push('post'); return Promise.resolve({ id: 10, reading_type: 'standard' }); });
  return order;
}

beforeEach(() => { vi.clearAllMocks(); });

// ── applyFieldChange ──────────────────────────────────────────────────────────

describe('applyFieldChange', () => {
  it('updates an unrelated field without touching aliyah or occasionAliyahIds', () => {
    const result = applyFieldChange(form({ occasionAliyahIds: [10, 11] }), 'location', 'Home');
    expect(result).toMatchObject({ location: 'Home', aliyah: ['3'], occasionAliyahIds: [10, 11] });
  });

  it.each([
    ['parsha',     'בְּרֵאשִׁית'],
    ['pairId',     5],
  ] as const)('resets aliyah when %s changes', (key, value) => {
    expect(applyFieldChange(form(), key, value)).toMatchObject({ [key]: value, aliyah: [] });
  });

  it('resets occasionAliyahIds when occasionId changes', () => {
    const result = applyFieldChange(form({ occasionId: 1, occasionAliyahIds: [10, 11] }), 'occasionId', 2);
    expect(result).toMatchObject({ occasionId: 2, occasionAliyahIds: [] });
  });

  it('does not mutate the original form', () => {
    const original = form();
    applyFieldChange(original, 'parsha', 'נֹחַ');
    expect(original).toEqual(form());
  });
});

// ── validateForm ──────────────────────────────────────────────────────────────

describe('validateForm', () => {
  it.each([
    ['all required fields present',             {}],
    ['several aliyot selected',                 { aliyah: ['1', '2', '3'] }],
    ['double_parsha with a pair (parsha unused)', { readingType: 'double_parsha', pairId: 1, parsha: '' }],
  ] as const)('accepts %s', (_label, over) => {
    expect(validateForm(form(over as Partial<ManageForm>))).toBeNull();
  });

  it.each([
    ['parsha is missing',                       { parsha: '' },                                  /parsha/i],
    ['the aliyah array is empty',               { aliyah: [] },                                  /aliyah/i],
    ['the date is missing',                     { date: null },                                  /date/i],
    ['pairId is missing for double_parsha',     { readingType: 'double_parsha', pairId: null },  /parsha/i],
    ['several are missing (parsha reported first)', { parsha: '', aliyah: [], date: null },      /parsha/i],
  ] as const)('errors when %s', (_label, over, message) => {
    expect(validateForm(form(over as Partial<ManageForm>))).toMatch(message);
  });
});

// ── saveReading ───────────────────────────────────────────────────────────────

describe('saveReading', () => {
  it('posts one reading with the right payload and says so', async () => {
    const msg = await saveReading(form({ parsha: 'Bereishit', aliyah: ['1'] }), null, false);
    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ parsha: 'Bereishit', aliyah: 1, date_read: '2024-03-15' }));
    expect(putReading).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(msg).toBe('Reading added.');
  });

  it('posts once per selected aliyah and reports the count', async () => {
    const msg = await saveReading(form({ aliyah: ['1', '3', '5'] }), null, false);
    expect(post.mock.calls.map(([body]) => body.aliyah)).toEqual([1, 3, 5]);
    expect(msg).toBe('3 readings added.');
  });

  it('edits only occasion and location when the reading is locked', async () => {
    const msg = await saveReading(form(), 42, false);
    expect(putReading).toHaveBeenCalledExactlyOnceWith(42, { occasion: 'Shabbat', location: 'Shul' });
    expect(del).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(msg).toBe('Reading updated.');
  });

  it('recreates by deleting the old id before posting one reading per aliyah', async () => {
    const order = recordCallOrder();
    const msg = await saveReading(form({ aliyah: ['2', '4'] }), 42, true);
    expect(del).toHaveBeenCalledExactlyOnceWith(42);
    expect(order).toEqual(['delete', 'post', 'post']);
    expect(post.mock.calls.map(([body]) => body.aliyah)).toEqual([2, 4]);
    expect(msg).toBe('2 readings re-created.');
  });

  it('says "Reading re-created." for a single recreated aliyah', async () => {
    expect(await saveReading(form({ aliyah: ['1'] }), 42, true)).toBe('Reading re-created.');
  });

  it.each([
    ['a Date',                  new Date('2023-05-20T00:00:00')],
    ['a pre-formatted string',  '2023-05-20'],
  ])('sends date_read as YYYY-MM-DD from %s', async (_label, date) => {
    await saveReading(form({ date }), null, false);
    expect(post.mock.calls[0]![0].date_read).toBe('2023-05-20');
  });
});

// ── saveDoubleParsha ───────────────────────────────────────────────────────────

const PAIR = { id: 7, name: 'וַיַּקְהֵל-פְקוּדֵי', name_en: 'Vayakhel-Pekudei', parsha1_id: 22, parsha2_id: 23 } as ParshaPair;
const PAIRS = [PAIR];
const DOUBLE_FORM = form({ readingType: 'double_parsha', pairId: 7, aliyah: ['1', '2'] });

// Individual aliyot belonging to this double-parsha pair
const ALL_ROWS = [
  { pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 1, parsha: 'וַיַּקְהֵל', aliyah: 1 },
  { pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 2, parsha: 'פְקוּדֵי',   aliyah: 1 },
  { pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 3, parsha: 'וַיַּקְהֵל', aliyah: 2 },
] as MappedRow[];

describe('saveDoubleParsha', () => {
  it('posts one double_parsha reading per matched individual row', async () => {
    // aliyah ['1','2'] matches combinedAliyah 1 and 2
    const msg = await saveDoubleParsha(DOUBLE_FORM, null, false, ALL_ROWS, PAIRS);
    expect(post).toHaveBeenCalledTimes(2);
    for (const [body] of post.mock.calls) expect(body).toMatchObject({ reading_type: 'double_parsha', pair_id: 7 });
    expect(msg).toBe('2 readings added.');
  });

  it('uses the singular message when only one row matches', async () => {
    expect(await saveDoubleParsha({ ...DOUBLE_FORM, aliyah: ['1'] }, null, false, ALL_ROWS, PAIRS)).toBe('1 reading added.');
  });

  it('throws when the pair is unknown', async () => {
    await expect(saveDoubleParsha({ ...DOUBLE_FORM, pairId: 999 }, null, false, ALL_ROWS, PAIRS)).rejects.toThrow('Pair not found');
  });

  it('deletes the old id before posting when recreating, and not otherwise', async () => {
    const order = recordCallOrder();
    await saveDoubleParsha(DOUBLE_FORM, 42, true, ALL_ROWS, PAIRS);
    expect(del).toHaveBeenCalledExactlyOnceWith(42);
    expect(order).toEqual(['delete', 'post', 'post']);

    vi.clearAllMocks();
    await saveDoubleParsha(DOUBLE_FORM, 42, false, ALL_ROWS, PAIRS);
    expect(del).not.toHaveBeenCalled();
  });
});

// ── submitReading ──────────────────────────────────────────────────────────────

describe('submitReading', () => {
  const refresh        = vi.fn().mockResolvedValue(undefined);
  const refreshSpecial = vi.fn().mockResolvedValue(undefined);
  const HOLIDAY_FORM = form({
    readingType: 'holiday', occasionAliyahIds: [3, 7], date: new Date('2025-04-09T00:00:00'), occasion: 'Pesach',
  });
  const submit = (f: ManageForm, editId: number | null = null) => submitReading(f, editId, false, [], [], refresh, refreshSpecial);

  it('holiday: posts one special reading per occasion aliyah, refreshes both views, and reports the count', async () => {
    const msg = await submit(HOLIDAY_FORM);
    expect(postSpecialReading).toHaveBeenCalledTimes(2);
    expect(postSpecialReading).toHaveBeenCalledWith(expect.objectContaining({ occasion_aliyah_id: 3, date_read: '2025-04-09' }));
    expect(postSpecialReading).toHaveBeenCalledWith(expect.objectContaining({ occasion_aliyah_id: 7, date_read: '2025-04-09' }));
    // Both always fire for a holiday, whatever coversAliyahId is: the aliyot grid may change too.
    expect(refreshSpecial).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
    expect(msg).toBe('Recorded 2 holiday reading(s).');
  });

  it('holiday edit: deletes the old special reading before posting', async () => {
    const order: string[] = [];
    vi.mocked(deleteSpecialReading).mockImplementation(() => { order.push('delete'); return Promise.resolve(); });
    vi.mocked(postSpecialReading).mockImplementation(() => { order.push('post'); return Promise.resolve({ id: 10 }); });
    await submit(HOLIDAY_FORM, 42);
    expect(deleteSpecialReading).toHaveBeenCalledWith(42);
    expect(order[0]).toBe('delete');
  });

  it('standard: refreshes the aliyot but not the special readings', async () => {
    await submit(form({ parsha: 'Bereishit', aliyah: ['1'], occasion: '', location: '' }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(refreshSpecial).not.toHaveBeenCalled();
  });
});
