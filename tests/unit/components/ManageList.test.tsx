import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import { ManageList } from '../../../src/components/ManageList.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA, MOCK_COLOR } from '../../helpers/appContextMock.js';
// MOCK_SEFER and MOCK_PARSHA used in fixture; MOCK_COLOR verified in onDelete assertion
import type { ReadingRecord } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));

import { useApp } from '../../../src/context/AppContext.js';

const baseReading: ReadingRecord = {
  id:           1,
  sefer:        MOCK_SEFER,
  parsha:       MOCK_PARSHA,
  parsha_en:    'Bereishit',
  aliyah:       1,
  date_read:    '2024-03-15',
  occasion:     'Shabbat',
  location:     'Shul',
  reading_type: 'standard',
};

const weekdayDefaults = { weekdayAliyot: [], onEditWeekday: vi.fn(), onDeleteWeekday: vi.fn(), hosafotReadings: [], onEditHosafah: vi.fn(), onDeleteHosafah: vi.fn() };

beforeEach(() => {
  (useApp as Mock).mockReturnValue(makeCtx());
});

describe('ManageList', () => {
  it('renders the All Readings heading', () => {
    renderWithProviders(<ManageList readings={[baseReading]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.getByText('All Readings')).toBeInTheDocument();
  });

  it('renders empty state when no readings', () => {
    renderWithProviders(<ManageList readings={[]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.getByText('No readings on file.')).toBeInTheDocument();
  });

  it('renders a row for each reading', () => {
    const second: ReadingRecord = { ...baseReading, id: 2, aliyah: 2, parsha_en: 'Bereishit 2' };
    renderWithProviders(<ManageList readings={[baseReading, second]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.getAllByTitle('Edit')).toHaveLength(2);
  });

  it('clicking edit calls onEdit with the reading record', async () => {
    const onEdit = vi.fn();
    renderWithProviders(<ManageList readings={[baseReading]} onEdit={onEdit} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    await userEvent.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(baseReading);
  });

  it('clicking delete calls onDelete with reading and its color', async () => {
    const onDelete = vi.fn();
    renderWithProviders(<ManageList readings={[baseReading]} specialReadings={[]} onEdit={vi.fn()} onDelete={onDelete} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    await userEvent.click(screen.getByTitle('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(baseReading, MOCK_COLOR);
  });

  it('shows Future badge for a future-dated reading', () => {
    renderWithProviders(
      <ManageList
        readings={[{ ...baseReading, date_read: '2099-12-31' }]}
        specialReadings={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()}
        {...weekdayDefaults}
      />
    );
    expect(screen.getByText('Future')).toBeInTheDocument();
  });

  it('no Future badge for a past reading', () => {
    renderWithProviders(<ManageList readings={[baseReading]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.queryByText('Future')).not.toBeInTheDocument();
  });

  it('displays the reading_type badge', () => {
    renderWithProviders(<ManageList readings={[baseReading]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.getByText('standard')).toBeInTheDocument();
  });

  it('enriches pseukim from allRows', () => {
    renderWithProviders(<ManageList readings={[baseReading]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.getByText('45 pseukim')).toBeInTheDocument();
  });

  it('shows 0 pseukim when allRows has no matching entry', () => {
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [] }));
    renderWithProviders(<ManageList readings={[baseReading]} onEdit={vi.fn()} onDelete={vi.fn()} specialReadings={[]} onDeleteSpecial={vi.fn()} onEditSpecial={vi.fn()} {...weekdayDefaults} />);
    expect(screen.getByText('0 pseukim')).toBeInTheDocument();
  });
});
