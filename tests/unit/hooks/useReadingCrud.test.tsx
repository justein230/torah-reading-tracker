import { screen, fireEvent, within } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA, MOCK_PARSHA_2 } from '../../helpers/appContextMock.js';
import type { ManageForm, ReadingRecord, SpecialReadingRecord, MappedWeekdayAliyah, MappedHosafah, MappedRow } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

vi.mock('../../../src/api.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/api.js')>('../../../src/api.js');
  return {
    ...actual,
    fetchReadings: vi.fn(),
    fetchCanWrite: vi.fn(),
    deleteReading: vi.fn(),
    deleteSpecialReading: vi.fn(),
    deleteWeekdayReading: vi.fn(),
    postWeekdayReading: vi.fn(),
    putWeekdayReading: vi.fn(),
    postReading: vi.fn(),
    putReading: vi.fn(),
    postSpecialReading: vi.fn(),
    postHosafah: vi.fn(),
    deleteHosafah: vi.fn(),
    putHosafah: vi.fn(),
  };
});

let confirmCallback: (() => void) | null = null;
vi.mock('@mantine/modals', () => ({
  modals: {
    open: vi.fn(),
    openConfirmModal: vi.fn((opts: { onConfirm: () => void }) => { confirmCallback = opts.onConfirm; }),
    closeAll: vi.fn(),
  },
}));

vi.mock('../../../src/components/AddReadingForm.js', () => ({
  AddReadingForm: (props: {
    form: ManageForm;
    setField: (key: keyof ManageForm, value: ManageForm[keyof ManageForm]) => void;
    submit: () => void;
    doRecreate: () => void;
    msg: { text: string; error: boolean };
    formTitle: string;
    submitLabel: string;
    locked: boolean;
    aliyahOptions: { value: string; label: string }[];
  }) => (
    <div data-testid={`form-${props.formTitle}`}>
      <span>{props.formTitle}</span>
      <span data-testid={`msg-${props.formTitle}`}>{props.msg.text}</span>
      <span data-testid={`type-${props.formTitle}`}>{props.form.readingType}</span>
      <span data-testid={`submit-label-${props.formTitle}`}>{props.submitLabel}</span>
      <span data-testid={`locked-${props.formTitle}`}>{String(props.locked)}</span>
      <span data-testid={`date-${props.formTitle}`}>{props.form.date ? String(props.form.date) : ''}</span>
      <span data-testid={`note-${props.formTitle}`}>{props.form.occasion}</span>
      <span data-testid={`location-${props.formTitle}`}>{props.form.location}</span>
      <span data-testid={`aliyah-options-${props.formTitle}`}>{props.aliyahOptions.map(o => o.label).join(' | ')}</span>
      <button onClick={() => props.setField('parsha', MOCK_PARSHA)}>set-parsha</button>
      <button onClick={() => props.setField('aliyah', ['1'])}>set-aliyah</button>
      <button onClick={() => props.setField('date', new Date('2024-01-01'))}>set-date</button>
      <button onClick={() => props.setField('date', null)}>clear-date</button>
      <button onClick={() => props.setField('readingType', 'weekday')}>set-type-weekday</button>
      <button onClick={() => props.setField('readingType', 'hosafah')}>set-type-hosafah</button>
      <button onClick={() => props.setField('readingType', 'holiday')}>set-type-holiday</button>
      <button onClick={() => props.setField('readingType', 'double_parsha')}>set-type-double</button>
      <button onClick={() => props.setField('pairId', 1)}>set-pair</button>
      <button onClick={() => props.setField('occasionAliyahIds', [7])}>set-occasion-aliyot</button>
      <button onClick={() => props.setField('hosafahSefer', MOCK_SEFER)}>set-hosafah-sefer</button>
      <button onClick={() => props.setField('hosafahChapterStart', '1')}>set-hosafah-cs</button>
      <button onClick={() => props.setField('hosafahVerseStart', '1')}>set-hosafah-vs</button>
      <button onClick={() => props.setField('hosafahChapterEnd', '1')}>set-hosafah-ce</button>
      <button onClick={() => props.setField('hosafahVerseEnd', '5')}>set-hosafah-ve</button>
      <button onClick={() => props.setField('hosafahPseukim', '5')}>set-hosafah-pseukim</button>
      <button onClick={props.doRecreate}>{props.formTitle}-recreate</button>
      <button onClick={props.submit}>{props.formTitle}-submit</button>
    </div>
  ),
}));

import { useReadingCrud } from '../../../src/hooks/useReadingCrud.js';
import { AddReadingForm } from '../../../src/components/AddReadingForm.js';
import * as api from '../../../src/api.js';
import { postHosafah, deleteHosafah, putHosafah } from '../../../src/api.js';
import { modals } from '@mantine/modals';

/**
 * Minimal host that exercises the hook the way the Reading Log does: an add form, a conditional edit
 * form, and a list (built from the hook's readingsById map) with per-row edit/delete controls.
 */
function Harness({ special, weekday, hosafah }: {
  special?: SpecialReadingRecord;
  weekday?: MappedWeekdayAliyah;
  hosafah?: MappedHosafah;
} = {}) {
  const crud = useReadingCrud();
  if (crud.canWrite === null) return null;
  const records = [...crud.readingsById.values()];
  return (
    <div>
      {special && (
        <>
          <button onClick={() => crud.edit.startEditSpecial(special)}>edit-special</button>
          <button onClick={() => crud.confirmDeleteSpecial(special)}>delete-special</button>
        </>
      )}
      {weekday && (
        <>
          <button onClick={() => crud.edit.startEditWeekday(weekday)}>edit-weekday</button>
          <button onClick={() => crud.confirmDeleteWeekday(weekday.readingId, 'Bereishit · aliyah 1')}>delete-weekday</button>
        </>
      )}
      {hosafah && (
        <>
          <button onClick={() => crud.edit.startEditHosafah(hosafah)}>edit-hosafah</button>
          <button onClick={() => crud.confirmDeleteHosafah(hosafah.id, 'Bereishit · 1:1–1:5')}>delete-hosafah</button>
        </>
      )}
      {crud.canWrite && (
        <AddReadingForm
          form={crud.add.form} setField={crud.add.setField} editId={null} recreate={false} locked={false}
          msg={crud.add.msg} formTitle="Add Reading" submitLabel="Add Reading"
          doRecreate={() => {}} submit={() => void crud.add.submit()} resetForm={crud.add.reset}
          parshaOptions={crud.addOptions.parshaOptions} aliyahOptions={crud.addOptions.aliyahOptions}
        />
      )}
      {crud.edit.open && (
        <AddReadingForm
          form={crud.edit.form} setField={crud.edit.setField} editId={crud.edit.editId} recreate={crud.edit.recreate}
          locked={crud.edit.locked} msg={crud.edit.msg} formTitle={crud.edit.formTitle} submitLabel={crud.edit.submitLabel}
          doRecreate={crud.edit.doRecreate} submit={() => void crud.edit.submit()} resetForm={crud.edit.close}
          parshaOptions={crud.editOptions.parshaOptions} aliyahOptions={crud.editOptions.aliyahOptions} inModal
        />
      )}
      <div data-testid="list">
        {records.map(r => (
          <div key={r.id}>
            <span>{r.parsha}-{r.aliyah}</span>
            <button onClick={() => crud.edit.startEdit(r)}>edit-{r.id}</button>
            <button onClick={() => crud.confirmDelete(r, '#000')}>delete-{r.id}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const READING: ReadingRecord = {
  id: 1, sefer: MOCK_SEFER, parsha: MOCK_PARSHA, parsha_en: 'Bereishit', aliyah: 1,
  date_read: '2024-01-01', occasion: '', location: '', reading_type: 'standard',
};

/** A row belonging to the Vayakhel-Pekudei pair, used to drive the double-parsha aliyah options. */
const BASE_PAIR_ROW: MappedRow = {
  sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1,
  pairName: 'ויקהל־פקודי', pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 1,
  pseukim: 5, pct: 0, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5,
  orig: '', directOrig: '', readAsDouble: true, partialOrig: '', futDates: [],
  isRead: false, isReadPast: false, isReadFuture: false, hasFuture: false, isFuture: false,
  isReread: false, yearRead: null, futureYear: null, allYears: [], occasion: '', location: '',
  rereadCount: 0,
};

const SPECIAL: SpecialReadingRecord = {
  id: 21, occasionAliyahId: 7, occasionId: 3, occasion: 'פֶּסַח', occasionEn: 'Pesach',
  category: 'holiday', aliyahKey: 'Day 1 · 1', isShabbatVariant: false,
  parsha: MOCK_PARSHA, parshaEn: 'Bereishit', dateRead: '2024-04-23',
  note: 'first day', location: 'Shul', pseukim: 12, coversAliyahId: null,
};

const WEEKDAY: MappedWeekdayAliyah = {
  id: 1, parshaId: 1, aliyahNum: 1, parsha: MOCK_PARSHA, parshaEn: 'Bereishit',
  sefer: MOCK_SEFER, seferEn: 'Genesis', seferColor: '#000', pseukim: 5,
  chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5, coversAliyahId: null,
  dateRead: '2024-02-05', allDates: ['2024-02-05'], readingId: 31, isReadPast: true,
  isReadFuture: false, hasFuture: false, partialOrig: '', isCoveredPast: false,
  location: 'Home', note: 'monday',
};

const HOSAFAH: MappedHosafah = {
  id: 41, sefer: MOCK_SEFER, parshaId1: 1, parshaId2: null, occasionId: null,
  isDoubleParsha: false, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5,
  pseukim: 5, dateRead: '2024-03-10', note: 'extra', location: 'Shul',
  parsha1: MOCK_PARSHA, parsha1En: 'Bereishit', parsha2: null, parsha2En: null,
  occasion: null, occasionEn: null, isReadPast: true, isReadFuture: false, partialOrig: '',
};

beforeEach(() => {
  vi.clearAllMocks();
  confirmCallback = null;
});

describe('useReadingCrud — canWrite gating', () => {
  it('exposes no add form while canWrite is null', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(null);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await vi.waitFor(() => expect(api.fetchCanWrite).toHaveBeenCalled());
    expect(screen.queryByTestId('form-Add Reading')).not.toBeInTheDocument();
  });

  it('exposes no add form when canWrite is false', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(false);
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await vi.waitFor(() => expect(api.fetchReadings).toHaveBeenCalled());
    expect(screen.queryByTestId('form-Add Reading')).not.toBeInTheDocument();
  });

  it('exposes the add form and the readings list when canWrite is true', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    expect(await screen.findByTestId('form-Add Reading')).toBeInTheDocument();
    expect(await screen.findByText(`${MOCK_PARSHA}-1`)).toBeInTheDocument();
  });
});

describe('useReadingCrud — add reading happy path', () => {
  it('submits a valid reading and reloads the list', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([READING]);
    (api.postReading as Mock).mockResolvedValue({ id: 1, reading_type: 'standard' });
    const refresh = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refresh }));
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-parsha'));
    fireEvent.click(screen.getByText('set-aliyah'));
    fireEvent.click(screen.getByText('set-date'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    await screen.findByText(`${MOCK_PARSHA}-1`);
    expect(api.postReading).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalled();
  });

  it('shows a validation message and does not submit when required fields are missing', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('Add Reading-submit'));

    expect(await screen.findByTestId('msg-Add Reading')).toHaveTextContent('Please select a parsha.');
    expect(api.postReading).not.toHaveBeenCalled();
  });
});

describe('useReadingCrud — edit reading happy path', () => {
  it('opens the edit form and saves changes', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (api.putReading as Mock).mockResolvedValue({ id: 1 });
    const refresh = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refresh }));
    renderWithProviders(<Harness />);
    await screen.findByText(`${MOCK_PARSHA}-1`);

    fireEvent.click(screen.getByText('edit-1'));
    expect(await screen.findByTestId('form-Edit Reading')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit Reading-submit'));
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(api.putReading).toHaveBeenCalledWith(1, { occasion: '', location: '' });
  });
});

describe('useReadingCrud — delete reading happy path', () => {
  it('deletes the reading on confirm and refreshes', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValueOnce([READING]).mockResolvedValueOnce([]);
    (api.deleteReading as Mock).mockResolvedValue(undefined);
    const refresh = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refresh }));
    renderWithProviders(<Harness />);
    await screen.findByText(`${MOCK_PARSHA}-1`);

    fireEvent.click(screen.getByText('delete-1'));
    expect(confirmCallback).not.toBeNull();
    confirmCallback?.();

    await vi.waitFor(() => expect(api.deleteReading).toHaveBeenCalledWith(1));
    expect(refresh).toHaveBeenCalled();
  });
});

describe('useReadingCrud — hosafah reading via add form', () => {
  it('submits a hosafah reading when readingType is hosafah', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (postHosafah as Mock).mockResolvedValue({ id: 9 });
    const refreshHosafot = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refreshHosafot }));
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-hosafah'));
    expect(screen.getByTestId('type-Add Reading')).toHaveTextContent('hosafah');
    fireEvent.click(screen.getByText('set-date'));
    fireEvent.click(screen.getByText('set-hosafah-sefer'));
    fireEvent.click(screen.getByText('set-hosafah-cs'));
    fireEvent.click(screen.getByText('set-hosafah-vs'));
    fireEvent.click(screen.getByText('set-hosafah-ce'));
    fireEvent.click(screen.getByText('set-hosafah-ve'));
    fireEvent.click(screen.getByText('set-hosafah-pseukim'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    await vi.waitFor(() => expect(postHosafah).toHaveBeenCalledOnce());
    expect(postHosafah).toHaveBeenCalledWith(expect.objectContaining({ sefer: MOCK_SEFER, pseukim: 5 }));
    await vi.waitFor(() => expect(refreshHosafot).toHaveBeenCalled());
  });

  it('shows a validation message when hosafah fields are incomplete', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-hosafah'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    expect(await screen.findByTestId('msg-Add Reading')).toHaveTextContent('Select a sefer, fill in all verse fields, and pick a date.');
    expect(postHosafah).not.toHaveBeenCalled();
  });
});

describe('useReadingCrud — weekday reading via add form', () => {
  it('submits a weekday reading when readingType is weekday', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (api.postWeekdayReading as Mock).mockResolvedValue({ id: 4 });
    const refreshWeekday = vi.fn().mockResolvedValue(undefined);
    const weekdayAliyot = [{
      id: 1, parshaId: 1, aliyahNum: 1, parsha: MOCK_PARSHA, parshaEn: 'Bereishit',
      sefer: MOCK_SEFER, seferEn: 'Genesis', seferColor: '#000', pseukim: 5,
      chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5, coversAliyahId: null,
      dateRead: '', allDates: [], readingId: 0, isReadPast: false, isReadFuture: false,
      hasFuture: false, partialOrig: '', isCoveredPast: false, location: '', note: '',
    }];
    (useApp as Mock).mockReturnValue(makeCtx({ refreshWeekday, weekdayAliyot }));
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-weekday'));
    fireEvent.click(screen.getByText('set-parsha'));
    fireEvent.click(screen.getByText('set-aliyah'));
    fireEvent.click(screen.getByText('set-date'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    await vi.waitFor(() => expect(api.postWeekdayReading).toHaveBeenCalledOnce());
    expect(api.postWeekdayReading).toHaveBeenCalledWith(expect.objectContaining({ weekday_aliyah_id: 1 }));
    expect(refreshWeekday).toHaveBeenCalled();
  });

  it('reports a validation message when parsha, aliyah, or date is missing', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-weekday'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    expect(await screen.findByTestId('msg-Add Reading'))
      .toHaveTextContent('Select parsha, at least one aliyah, and a date.');
    expect(api.postWeekdayReading).not.toHaveBeenCalled();
  });
});

describe('useReadingCrud — holiday validation', () => {
  it('requires at least one occasion aliyah and a date', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-holiday'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    expect(await screen.findByTestId('msg-Add Reading'))
      .toHaveTextContent('Select at least one aliyah and a date.');
    expect(api.postSpecialReading).not.toHaveBeenCalled();
  });

  it('submits every selected occasion aliyah once date and aliyot are set', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (api.postSpecialReading as Mock).mockResolvedValue({ id: 5 });
    const refreshSpecial = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refreshSpecial }));
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-holiday'));
    fireEvent.click(screen.getByText('set-occasion-aliyot'));
    fireEvent.click(screen.getByText('set-date'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    await vi.waitFor(() => expect(api.postSpecialReading).toHaveBeenCalledOnce());
    expect(api.postSpecialReading).toHaveBeenCalledWith(expect.objectContaining({ occasion_aliyah_id: 7 }));
    expect(refreshSpecial).toHaveBeenCalled();
  });
});

describe('useReadingCrud — error modal', () => {
  it('surfaces the server-supplied detail when a save fails', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (api.postReading as Mock).mockRejectedValue({ detail: 'Aliyah already recorded for that date.' });
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-parsha'));
    fireEvent.click(screen.getByText('set-aliyah'));
    fireEvent.click(screen.getByText('set-date'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    await vi.waitFor(() => expect(modals.open).toHaveBeenCalledOnce());
    expect((modals.open as Mock).mock.calls[0]?.[0]).toMatchObject({ title: 'Could not save reading' });
  });

  it('falls back to a generic message when the error carries no detail', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (api.deleteReading as Mock).mockRejectedValue(new Error('boom'));
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByText(`${MOCK_PARSHA}-1`);

    fireEvent.click(screen.getByText('delete-1'));
    confirmCallback?.();

    await vi.waitFor(() => expect(modals.open).toHaveBeenCalledOnce());
  });
});

describe('useReadingCrud — delete confirmations for non-standard readings', () => {
  async function renderWith(extra: Parameters<typeof Harness>[0]) {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    const ctx = makeCtx();
    (useApp as Mock).mockReturnValue(ctx);
    renderWithProviders(<Harness {...extra} />);
    await screen.findByTestId('form-Add Reading');
    return ctx;
  }

  it('deletes a holiday reading and refreshes the special + main datasets', async () => {
    (api.deleteSpecialReading as Mock).mockResolvedValue(undefined);
    const ctx = await renderWith({ special: SPECIAL });

    fireEvent.click(screen.getByText('delete-special'));
    confirmCallback?.();

    // refresh() is the last await in the chain, so waiting on it proves the whole sequence ran.
    await vi.waitFor(() => expect(ctx.refresh).toHaveBeenCalled());
    expect(api.deleteSpecialReading).toHaveBeenCalledWith(21);
    expect(ctx.refreshSpecial).toHaveBeenCalled();
  });

  it('deletes a weekday reading and refreshes the weekday + main datasets', async () => {
    (api.deleteWeekdayReading as Mock).mockResolvedValue(undefined);
    const ctx = await renderWith({ weekday: WEEKDAY });

    fireEvent.click(screen.getByText('delete-weekday'));
    confirmCallback?.();

    await vi.waitFor(() => expect(ctx.refresh).toHaveBeenCalled());
    expect(api.deleteWeekdayReading).toHaveBeenCalledWith(31);
    expect(ctx.refreshWeekday).toHaveBeenCalled();
  });

  it('deletes a hosafah and refreshes the hosafot + main datasets', async () => {
    (deleteHosafah as Mock).mockResolvedValue(undefined);
    const ctx = await renderWith({ hosafah: HOSAFAH });

    fireEvent.click(screen.getByText('delete-hosafah'));
    confirmCallback?.();

    await vi.waitFor(() => expect(ctx.refresh).toHaveBeenCalled());
    expect(deleteHosafah).toHaveBeenCalledWith(41);
    expect(ctx.refreshHosafot).toHaveBeenCalled();
  });
});

describe('useReadingCrud — editing non-standard readings', () => {
  async function renderWith(extra: Parameters<typeof Harness>[0]) {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    const ctx = makeCtx();
    (useApp as Mock).mockReturnValue(ctx);
    renderWithProviders(<Harness {...extra} />);
    await screen.findByTestId('form-Add Reading');
    return ctx;
  }

  it('seeds the form from a holiday reading and titles the modal accordingly', async () => {
    await renderWith({ special: SPECIAL });

    fireEvent.click(screen.getByText('edit-special'));

    const title = 'Edit Holiday Reading';
    expect(await screen.findByTestId(`form-${title}`)).toBeInTheDocument();
    expect(screen.getByTestId(`type-${title}`)).toHaveTextContent('holiday');
    expect(screen.getByTestId(`submit-label-${title}`)).toHaveTextContent('Save Changes');
    expect(screen.getByTestId(`note-${title}`)).toHaveTextContent('first day');
    expect(screen.getByTestId(`location-${title}`)).toHaveTextContent('Shul');
    expect(screen.getByTestId(`locked-${title}`)).toHaveTextContent('false');
  });

  it('seeds the form from a weekday reading and saves via putWeekdayReading', async () => {
    (api.putWeekdayReading as Mock).mockResolvedValue({ id: 31 });
    const ctx = await renderWith({ weekday: WEEKDAY });

    fireEvent.click(screen.getByText('edit-weekday'));
    const title = 'Edit Weekday Reading';
    expect(await screen.findByTestId(`form-${title}`)).toBeInTheDocument();
    expect(screen.getByTestId(`type-${title}`)).toHaveTextContent('weekday');
    expect(screen.getByTestId(`note-${title}`)).toHaveTextContent('monday');

    fireEvent.click(screen.getByText(`${title}-submit`));

    await vi.waitFor(() => expect(api.putWeekdayReading).toHaveBeenCalledWith(31, {
      date_read: '2024-02-05', note: 'monday', location: 'Home',
    }));
    expect(ctx.refreshWeekday).toHaveBeenCalled();
  });

  it('refuses to save a weekday edit with no date', async () => {
    await renderWith({ weekday: WEEKDAY });

    fireEvent.click(screen.getByText('edit-weekday'));
    const title = 'Edit Weekday Reading';
    // Scope to the edit form — the add form renders the same buttons.
    const form = within(await screen.findByTestId(`form-${title}`));
    fireEvent.click(form.getByText('clear-date'));
    fireEvent.click(form.getByText(`${title}-submit`));

    expect(await screen.findByTestId(`msg-${title}`)).toHaveTextContent('A date is required.');
    expect(api.putWeekdayReading).not.toHaveBeenCalled();
  });

  it('seeds the form from a hosafah and saves via putHosafah', async () => {
    (putHosafah as Mock).mockResolvedValue({ id: 41 });
    const ctx = await renderWith({ hosafah: HOSAFAH });

    fireEvent.click(screen.getByText('edit-hosafah'));
    const title = 'Edit Hosafah';
    expect(await screen.findByTestId(`form-${title}`)).toBeInTheDocument();
    expect(screen.getByTestId(`type-${title}`)).toHaveTextContent('hosafah');
    expect(screen.getByTestId(`note-${title}`)).toHaveTextContent('extra');

    fireEvent.click(screen.getByText(`${title}-submit`));

    await vi.waitFor(() => expect(putHosafah).toHaveBeenCalledWith(41, {
      date_read: '2024-03-10', note: 'extra', location: 'Shul',
    }));
    expect(ctx.refreshHosafot).toHaveBeenCalled();
  });

  it('refuses to save a hosafah edit with no date', async () => {
    await renderWith({ hosafah: HOSAFAH });

    fireEvent.click(screen.getByText('edit-hosafah'));
    const title = 'Edit Hosafah';
    const form = within(await screen.findByTestId(`form-${title}`));
    fireEvent.click(form.getByText('clear-date'));
    fireEvent.click(form.getByText(`${title}-submit`));

    expect(await screen.findByTestId(`msg-${title}`)).toHaveTextContent('A date is required.');
    expect(putHosafah).not.toHaveBeenCalled();
  });
});

describe('useReadingCrud — re-create unlocks a locked standard edit', () => {
  it('clears the lock and retitles the form', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Harness />);
    await screen.findByText(`${MOCK_PARSHA}-1`);

    fireEvent.click(screen.getByText('edit-1'));
    await screen.findByTestId('form-Edit Reading');
    expect(screen.getByTestId('locked-Edit Reading')).toHaveTextContent('true');

    fireEvent.click(screen.getByText('Edit Reading-recreate'));

    const title = 'Re-create Reading';
    expect(await screen.findByTestId(`form-${title}`)).toBeInTheDocument();
    expect(screen.getByTestId(`submit-label-${title}`)).toHaveTextContent('Re-create');
    expect(screen.getByTestId(`locked-${title}`)).toHaveTextContent('false');
    expect(screen.getByTestId(`msg-${title}`))
      .toHaveTextContent('All fields unlocked. This will delete the old reading and create a new one.');
  });
});

describe('useReadingCrud — double parsha aliyah options', () => {
  it('combines the paired components into one option per combined aliyah', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    const pairs = [{ id: 1, parsha1_id: 1, parsha2_id: 2, name: 'ויקהל־פקודי', name_en: 'Vayakhel-Pekudei' }];
    // Two source rows that both map onto combined aliyah 1 — the option label should span both.
    const allRows = [
      { ...BASE_PAIR_ROW, parsha: MOCK_PARSHA,   combinedAliyah: 1, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5,  pseukim: 5 },
      { ...BASE_PAIR_ROW, parsha: MOCK_PARSHA_2, combinedAliyah: 1, chapterStart: 1, verseStart: 6, chapterEnd: 1, verseEnd: 10, pseukim: 5 },
    ];
    (useApp as Mock).mockReturnValue(makeCtx({ pairs, allRows, parshaById: { 1: MOCK_PARSHA, 2: MOCK_PARSHA_2 } }));
    renderWithProviders(<Harness />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-double'));
    fireEvent.click(screen.getByText('set-pair'));

    expect(screen.getByTestId('aliyah-options-Add Reading'))
      .toHaveTextContent('Aliyah 1 — 1:1–1:10 (10 v.)'); // toHaveTextContent collapses whitespace
  });
});
