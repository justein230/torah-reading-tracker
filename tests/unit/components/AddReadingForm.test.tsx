import { screen, act, fireEvent } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_PARSHA, MOCK_PARSHA_2 } from '../../helpers/appContextMock.js';
import type { ManageForm } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const fetchHebcalOnDate = vi.fn();
vi.mock('../../../src/api.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/api.js')>('../../../src/api.js');
  return { ...actual, fetchHebcalOnDate: (date: string) => fetchHebcalOnDate(date) };
});

import { AddReadingForm } from '../../../src/components/AddReadingForm.js';

const mockUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

const baseForm: ManageForm = {
  parsha: MOCK_PARSHA,
  aliyah: [],
  date: null,
  occasion: '',
  location: '',
  readingType: 'standard',
  pairId: null,
  occasionId: null,
  occasionAliyahIds: [],
  isShabbatVariant: false,
  hosafahSefer: '',
  hosafahParshaId1: null,
  hosafahParshaId2: null,
  hosafahOccasionId: null,
  hosafahIsDoubleParsha: false,
  hosafahChapterStart: '',
  hosafahVerseStart: '',
  hosafahChapterEnd: '',
  hosafahVerseEnd: '',
  hosafahPseukim: '',
};

function renderForm(form: ManageForm) {
  return renderWithProviders(
    <AddReadingForm
      form={form}
      setField={vi.fn()}
      editId={null}
      recreate={false}
      locked={false}
      msg={{ text: '', error: false }}
      formTitle="Add Reading"
      submitLabel="Add"
      doRecreate={vi.fn()}
      submit={vi.fn()}
      resetForm={vi.fn()}
      parshaOptions={[]}
      aliyahOptions={[]}
    />,
  );
}

describe('AddReadingForm — schedule warning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchHebcalOnDate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows no warning when an in-range historical date matches a past reading of the parsha', () => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: { Bereishit: '2026-10-10' },
      datesByParsha: { Bereishit: ['2011-01-01'] },
      cacheYears: [1990, 2050],
    }));

    renderForm({ ...baseForm, date: new Date('2011-01-01T00:00:00') });

    expect(screen.queryByText(/typically read on/)).not.toBeInTheDocument();
  });

  it('warns, naming the next scheduled date, for an in-range genuine mismatch', () => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: { Bereishit: '2026-10-10' },
      datesByParsha: { Bereishit: ['2011-01-01'] },
      cacheYears: [1990, 2050],
    }));

    renderForm({ ...baseForm, date: new Date('2026-06-01T00:00:00') });

    expect(screen.getByText(/typically read on/)).toBeInTheDocument();
  });

  it('shows the "outside built-in schedule" note for an out-of-range date with lookups off', () => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: { Bereishit: '2026-10-10' },
      datesByParsha: {},
      cacheYears: [1990, 2050],
      settings: { liveHebcalLookups: false, debugLogging: false },
    }));

    renderForm({ ...baseForm, date: new Date('1950-01-01T00:00:00') });

    expect(screen.getByText(/outside the built-in schedule/)).toBeInTheDocument();
  });

  it('shows no warning for an out-of-range date once a live lookup confirms a match', async () => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: { Bereishit: '2026-10-10' },
      datesByParsha: {},
      cacheYears: [1990, 2050],
      settings: { liveHebcalLookups: true, debugLogging: false },
    }));
    fetchHebcalOnDate.mockResolvedValue({ parshiot: ['Bereishit'] });

    renderForm({ ...baseForm, date: new Date('1950-01-01T00:00:00') });
    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); await Promise.resolve(); });

    expect(screen.queryByText(/typically read on/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hebcal\.com shows/)).not.toBeInTheDocument();
  });

  it('warns, naming the live-reported parsha, for an out-of-range live mismatch', async () => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: { Bereishit: '2026-10-10' },
      datesByParsha: {},
      cacheYears: [1990, 2050],
      settings: { liveHebcalLookups: true, debugLogging: false },
    }));
    fetchHebcalOnDate.mockResolvedValue({ parshiot: ['Vayigash'] });

    renderForm({ ...baseForm, date: new Date('1950-01-01T00:00:00') });
    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); await Promise.resolve(); });

    expect(screen.getByText(/Hebcal\.com shows Vayigash/)).toBeInTheDocument();
  });
});

describe('AddReadingForm — edit mode and messages', () => {
  beforeEach(() => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: {}, datesByParsha: {}, cacheYears: [1990, 2050],
    }));
  });

  function renderEdit(overrides: Record<string, unknown> = {}) {
    return renderWithProviders(
      <AddReadingForm
        form={baseForm}
        setField={vi.fn()}
        editId={5}
        recreate={false}
        locked={false}
        msg={{ text: '', error: false }}
        formTitle="Edit Reading"
        submitLabel="Save"
        doRecreate={vi.fn()}
        submit={vi.fn()}
        resetForm={vi.fn()}
        parshaOptions={[]}
        aliyahOptions={[]}
        {...overrides}
      />,
    );
  }

  it('shows Re-create and Cancel buttons when editing a standard reading', () => {
    renderEdit();
    expect(screen.getByText('Re-create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides the Re-create button once recreate is true', () => {
    renderEdit({ recreate: true });
    expect(screen.queryByText('Re-create')).not.toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides the reading-type radio group and parsha auto-fill switch when locked', () => {
    renderEdit({ locked: true });
    expect(screen.queryByText('Reading Type')).not.toBeInTheDocument();
  });

  it('shows the error message in the error style when msg.error is true', () => {
    renderEdit({ msg: { text: 'Could not save reading', error: true } });
    const msgEl = screen.getByText('Could not save reading');
    expect(msgEl).toHaveStyle({ color: 'var(--error)' });
  });

  it('shows a success message when msg.error is false', () => {
    renderEdit({ msg: { text: 'Reading saved', error: false } });
    const msgEl = screen.getByText('Reading saved');
    expect(msgEl).toHaveStyle({ color: 'var(--success)' });
  });

  it('calls submit when the submit button is clicked', () => {
    const submit = vi.fn();
    renderEdit({ submit });
    fireEvent.click(screen.getByText('Save'));
    expect(submit).toHaveBeenCalled();
  });

  it('calls doRecreate when Re-create is clicked', () => {
    const doRecreate = vi.fn();
    renderEdit({ doRecreate });
    fireEvent.click(screen.getByText('Re-create'));
    expect(doRecreate).toHaveBeenCalled();
  });

  it('calls resetForm when Cancel is clicked', () => {
    const resetForm = vi.fn();
    renderEdit({ resetForm });
    fireEvent.click(screen.getByText('Cancel'));
    expect(resetForm).toHaveBeenCalled();
  });
});

describe('AddReadingForm — date autofill', () => {
  const purimCtx = () => makeCtx({
    parshaById: { 1: MOCK_PARSHA, 2: MOCK_PARSHA_2 },
    occasions: [{ id: 20, name: 'פורים', nameEn: 'Purim', category: 'other', sortOrder: 500 }],
    holidayDates: {
      occasionDates: { Purim: ['2024-03-24', '2025-03-14', '2026-03-03', '2027-03-23'] },
      morningReadingDates: [], noMinchaDates: [],
    },
  });

  function renderWith(form: Partial<ManageForm>, setField = vi.fn()) {
    const view = renderWithProviders(
      <AddReadingForm
        form={{ ...baseForm, ...form }}
        setField={setField}
        editId={null} recreate={false} locked={false}
        msg={{ text: '', error: false }}
        formTitle="Add Reading" submitLabel="Add"
        doRecreate={vi.fn()} submit={vi.fn()} resetForm={vi.fn()}
        parshaOptions={[]} aliyahOptions={[]}
      />,
    );
    return Object.assign(view, { setField });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-01T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers the autofill switch for every reading type except hosafah', () => {
    const types: ManageForm['readingType'][] = ['standard', 'double_parsha', 'holiday', 'weekday'];
    for (const readingType of types) {
      mockUseApp.mockReturnValue(purimCtx());
      const { unmount } = renderWith({ readingType });
      expect(screen.getByText('Auto-fill from schedule')).toBeInTheDocument();
      unmount();
    }
    mockUseApp.mockReturnValue(purimCtx());
    renderWith({ readingType: 'hosafah' });
    expect(screen.queryByText('Auto-fill from schedule')).not.toBeInTheDocument();
  });

  it('fills a holiday with its next upcoming date by default when the occasion is chosen', () => {
    mockUseApp.mockReturnValue(purimCtx());
    const { setField } = renderWith({ readingType: 'holiday' });

    fireEvent.click(screen.getByPlaceholderText('Select holiday…'));
    fireEvent.click(screen.getByText('Purim'));

    const dateCall = setField.mock.calls.find(([k]) => k === 'date');
    expect(dateCall?.[1]).toEqual(new Date('2027-03-23T00:00:00'));
  });

  it('fills the most recent past date once "Most recent" is selected', () => {
    mockUseApp.mockReturnValue(purimCtx());
    const { setField } = renderWith({ readingType: 'holiday' });

    fireEvent.click(screen.getByText('Most recent'));
    fireEvent.click(screen.getByPlaceholderText('Select holiday…'));
    fireEvent.click(screen.getByText('Purim'));

    const dateCall = setField.mock.calls.find(([k]) => k === 'date');
    expect(dateCall?.[1]).toEqual(new Date('2026-03-03T00:00:00'));
  });

  it('re-fills the date for the current selection when the direction changes', () => {
    mockUseApp.mockReturnValue(purimCtx());
    const { setField } = renderWith({ readingType: 'holiday', occasionId: 20 });

    fireEvent.click(screen.getByText('Most recent'));

    expect(setField).toHaveBeenCalledWith('date', new Date('2026-03-03T00:00:00'));
  });

  it('hides the direction selector when autofill is switched off', () => {
    mockUseApp.mockReturnValue(purimCtx());
    renderWith({ readingType: 'holiday' });

    fireEvent.click(screen.getByLabelText('Auto-fill from schedule'));

    expect(screen.queryByText('Most recent')).not.toBeInTheDocument();
  });

  it('leaves the date alone when autofill is switched off', () => {
    mockUseApp.mockReturnValue(purimCtx());
    const { setField } = renderWith({ readingType: 'holiday' });

    fireEvent.click(screen.getByLabelText('Auto-fill from schedule'));
    fireEvent.click(screen.getByPlaceholderText('Select holiday…'));
    fireEvent.click(screen.getByText('Purim'));

    expect(setField.mock.calls.some(([k]) => k === 'date')).toBe(false);
  });
});

describe('AddReadingForm — double-parsha mismatch warning', () => {
  const pairRow = { ...makeCtx().allRows[0]!, parsha: MOCK_PARSHA, pairNameEn: 'Bereishit-Noach' };

  it('warns for a historic date the pair was read together, not just the upcoming one', () => {
    mockUseApp.mockReturnValue(makeCtx({
      allRows: [pairRow],
      schedule: {},
      datesByParsha: { 'Bereishit-Noach': ['2011-10-22', '2030-10-19'] },
    }));
    renderForm({ ...baseForm, date: new Date('2011-10-22T00:00:00') });
    expect(screen.getByText(/typically read as part of Bereishit-Noach/)).toBeInTheDocument();
  });

  it('does not warn on a date the pair was not read together', () => {
    mockUseApp.mockReturnValue(makeCtx({
      allRows: [pairRow],
      datesByParsha: { 'Bereishit-Noach': ['2011-10-22'] },
    }));
    renderForm({ ...baseForm, date: new Date('2012-10-20T00:00:00') });
    expect(screen.queryByText(/typically read as part of/)).not.toBeInTheDocument();
  });
});
