import { screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_PARSHA } from '../../helpers/appContextMock.js';
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
      settings: { liveHebcalLookups: false },
    }));

    renderForm({ ...baseForm, date: new Date('1950-01-01T00:00:00') });

    expect(screen.getByText(/outside the built-in schedule/)).toBeInTheDocument();
  });

  it('shows no warning for an out-of-range date once a live lookup confirms a match', async () => {
    mockUseApp.mockReturnValue(makeCtx({
      schedule: { Bereishit: '2026-10-10' },
      datesByParsha: {},
      cacheYears: [1990, 2050],
      settings: { liveHebcalLookups: true },
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
      settings: { liveHebcalLookups: true },
    }));
    fetchHebcalOnDate.mockResolvedValue({ parshiot: ['Vayigash'] });

    renderForm({ ...baseForm, date: new Date('1950-01-01T00:00:00') });
    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); await Promise.resolve(); });

    expect(screen.getByText(/Hebcal\.com shows Vayigash/)).toBeInTheDocument();
  });
});
