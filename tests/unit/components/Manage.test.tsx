import { screen, fireEvent } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import type { ManageForm, ReadingRecord } from '../../../src/types/index.js';

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
  };
});
vi.mock('../../../src/db/web.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/db/web.js')>('../../../src/db/web.js');
  return { ...actual, postHosafah: vi.fn(), deleteHosafah: vi.fn(), putHosafah: vi.fn() };
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
    msg: { text: string; error: boolean };
    formTitle: string;
  }) => (
    <div data-testid={`form-${props.formTitle}`}>
      <span>{props.formTitle}</span>
      <span data-testid={`msg-${props.formTitle}`}>{props.msg.text}</span>
      <span data-testid={`type-${props.formTitle}`}>{props.form.readingType}</span>
      <button onClick={() => props.setField('parsha', MOCK_PARSHA)}>set-parsha</button>
      <button onClick={() => props.setField('aliyah', ['1'])}>set-aliyah</button>
      <button onClick={() => props.setField('date', new Date('2024-01-01'))}>set-date</button>
      <button onClick={() => props.setField('readingType', 'weekday')}>set-type-weekday</button>
      <button onClick={() => props.setField('readingType', 'hosafah')}>set-type-hosafah</button>
      <button onClick={() => props.setField('hosafahSefer', MOCK_SEFER)}>set-hosafah-sefer</button>
      <button onClick={() => props.setField('hosafahChapterStart', '1')}>set-hosafah-cs</button>
      <button onClick={() => props.setField('hosafahVerseStart', '1')}>set-hosafah-vs</button>
      <button onClick={() => props.setField('hosafahChapterEnd', '1')}>set-hosafah-ce</button>
      <button onClick={() => props.setField('hosafahVerseEnd', '5')}>set-hosafah-ve</button>
      <button onClick={() => props.setField('hosafahPseukim', '5')}>set-hosafah-pseukim</button>
      <button onClick={props.submit}>{props.formTitle}-submit</button>
    </div>
  ),
}));

vi.mock('../../../src/components/ManageList.js', () => ({
  ManageList: (props: {
    readings: ReadingRecord[];
    onEdit: (r: ReadingRecord) => void;
    onDelete: (r: ReadingRecord, color: string) => void;
  }) => (
    <div data-testid="manage-list">
      {props.readings.map(r => (
        <div key={r.id}>
          <span>{r.parsha}-{r.aliyah}</span>
          <button onClick={() => props.onEdit(r)}>edit-{r.id}</button>
          <button onClick={() => props.onDelete(r, '#000')}>delete-{r.id}</button>
        </div>
      ))}
    </div>
  ),
}));

import Manage from '../../../src/components/Manage.js';
import * as api from '../../../src/api.js';
import { postHosafah } from '../../../src/db/web.js';

const READING: ReadingRecord = {
  id: 1, sefer: MOCK_SEFER, parsha: MOCK_PARSHA, parsha_en: 'Bereishit', aliyah: 1,
  date_read: '2024-01-01', occasion: '', location: '', reading_type: 'standard',
};

beforeEach(() => {
  vi.clearAllMocks();
  confirmCallback = null;
});

describe('Manage — canWrite gating', () => {
  it('renders nothing while canWrite is null', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(null);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Manage />);
    await vi.waitFor(() => expect(api.fetchCanWrite).toHaveBeenCalled());
    expect(screen.queryByTestId('form-Add Reading')).not.toBeInTheDocument();
    expect(screen.queryByText('Write access is only available on the local network.')).not.toBeInTheDocument();
  });

  it('shows a read-only message when canWrite is false', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(false);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Manage />);
    expect(await screen.findByText('Write access is only available on the local network.')).toBeInTheDocument();
  });

  it('renders the add form and list when canWrite is true', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (useApp as Mock).mockReturnValue(makeCtx());
    renderWithProviders(<Manage />);
    expect(await screen.findByTestId('form-Add Reading')).toBeInTheDocument();
    expect(await screen.findByTestId('manage-list')).toBeInTheDocument();
    expect(screen.getByText(`${MOCK_PARSHA}-1`)).toBeInTheDocument();
  });
});

describe('Manage — add reading happy path', () => {
  it('submits a valid reading and reloads the list', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([READING]);
    (api.postReading as Mock).mockResolvedValue({ id: 1, reading_type: 'standard' });
    const refresh = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refresh }));
    renderWithProviders(<Manage />);
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
    renderWithProviders(<Manage />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('Add Reading-submit'));

    expect(await screen.findByTestId('msg-Add Reading')).toHaveTextContent('Please select a parsha.');
    expect(api.postReading).not.toHaveBeenCalled();
  });
});

describe('Manage — edit reading happy path', () => {
  it('opens the edit modal and saves changes', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([READING]);
    (api.putReading as Mock).mockResolvedValue({ id: 1 });
    const refresh = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refresh }));
    renderWithProviders(<Manage />);
    await screen.findByTestId('manage-list');

    fireEvent.click(screen.getByText('edit-1'));
    expect(await screen.findByTestId('form-Edit Reading')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit Reading-submit'));
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(api.putReading).toHaveBeenCalledWith(1, { occasion: '', location: '' });
  });
});

describe('Manage — delete reading happy path', () => {
  it('deletes the reading on confirm and refreshes', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValueOnce([READING]).mockResolvedValueOnce([]);
    (api.deleteReading as Mock).mockResolvedValue(undefined);
    const refresh = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refresh }));
    renderWithProviders(<Manage />);
    await screen.findByTestId('manage-list');

    fireEvent.click(screen.getByText('delete-1'));
    expect(confirmCallback).not.toBeNull();
    confirmCallback?.();

    await vi.waitFor(() => expect(api.deleteReading).toHaveBeenCalledWith(1));
    expect(refresh).toHaveBeenCalled();
  });
});

describe('Manage — hosafah reading via add form', () => {
  it('submits a hosafah reading when readingType is hosafah', async () => {
    (api.fetchCanWrite as Mock).mockResolvedValue(true);
    (api.fetchReadings as Mock).mockResolvedValue([]);
    (postHosafah as Mock).mockResolvedValue({ id: 9 });
    const refreshHosafot = vi.fn().mockResolvedValue(undefined);
    (useApp as Mock).mockReturnValue(makeCtx({ refreshHosafot }));
    renderWithProviders(<Manage />);
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
    renderWithProviders(<Manage />);
    await screen.findByTestId('form-Add Reading');

    fireEvent.click(screen.getByText('set-type-hosafah'));
    fireEvent.click(screen.getByText('Add Reading-submit'));

    expect(await screen.findByTestId('msg-Add Reading')).toHaveTextContent('Select a sefer, fill in all verse fields, and pick a date.');
    expect(postHosafah).not.toHaveBeenCalled();
  });
});

describe('Manage — weekday reading via add form', () => {
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
    renderWithProviders(<Manage />);
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
});
