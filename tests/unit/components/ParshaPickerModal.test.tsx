import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParshaPickerModal } from '../../../src/components/shared/ParshaPickerModal.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }) },
}));

const SEFER_ORDER = ['בְּרֵאשִׁית'];
const SEFER_MAP   = { 'בְּרֵאשִׁית': { en: 'Genesis', color: '#4a7c59', chapterVerses: [] } };
const parshaIndex = { 'בְּרֵאשִׁית': ['בְּרֵאשִׁית', 'נֹחַ', 'לֶךְ-לְךָ'] };
const TLIT        = { 'בְּרֵאשִׁית': 'Bereishit', 'נֹחַ': 'Noach', 'לֶךְ-לְךָ': 'Lech Lecha' };

const DEFAULT_PROPS = {
  onClose: vi.fn(),
  onSelect: vi.fn(),
  SEFER_ORDER,
  SEFER_MAP,
  parshaIndex,
  TLIT,
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis, 'visualViewport', { value: null, writable: true, configurable: true });
});

function getInput() {
  return screen.getByPlaceholderText(/Search parsha/i);
}

function typeInSearch(value: string) {
  fireEvent.change(getInput(), { target: { value } });
}

describe('ParshaPickerModal — closed', () => {
  it('does not render modal content when opened=false', () => {
    renderWithProviders(<ParshaPickerModal {...DEFAULT_PROPS} opened={false} />);
    expect(screen.queryByText('Select Parsha')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search parsha/i)).not.toBeInTheDocument();
  });
});

describe('ParshaPickerModal — open', () => {
  function renderOpen(props = {}) {
    return renderWithProviders(
      <ParshaPickerModal {...DEFAULT_PROPS} opened={true} {...props} />
    );
  }

  it('shows search input when opened', () => {
    renderOpen();
    expect(getInput()).toBeInTheDocument();
  });

  it('shows section header with English sefer name', () => {
    renderOpen();
    expect(screen.getByText('Genesis')).toBeInTheDocument();
  });

  it('shows all parshiot by transliteration initially', () => {
    renderOpen();
    expect(screen.getByText('Bereishit')).toBeInTheDocument();
    expect(screen.getByText('Noach')).toBeInTheDocument();
    expect(screen.getByText('Lech Lecha')).toBeInTheDocument();
  });

  it('typing a transliteration filters to matching parshiot', () => {
    renderOpen();
    typeInSearch('noach');
    expect(screen.getByText('Noach')).toBeInTheDocument();
    expect(screen.queryByText('Bereishit')).not.toBeInTheDocument();
    expect(screen.queryByText('Lech Lecha')).not.toBeInTheDocument();
  });

  it('filtering is case-insensitive', () => {
    renderOpen();
    typeInSearch('BEREISHIT');
    expect(screen.getByText('Bereishit')).toBeInTheDocument();
    expect(screen.queryByText('Noach')).not.toBeInTheDocument();
  });

  it('Hebrew text search also filters', () => {
    renderOpen();
    typeInSearch('נֹחַ');
    expect(screen.getByText('Noach')).toBeInTheDocument();
    expect(screen.queryByText('Bereishit')).not.toBeInTheDocument();
  });

  it('no matches results in no parsha buttons', () => {
    renderOpen();
    typeInSearch('zzz');
    expect(screen.queryByText('Bereishit')).not.toBeInTheDocument();
    expect(screen.queryByText('Noach')).not.toBeInTheDocument();
    expect(screen.queryByText('Lech Lecha')).not.toBeInTheDocument();
  });

  it('clicking a parsha calls onSelect with Hebrew key and onClose', async () => {
    const onSelect = vi.fn();
    const onClose  = vi.fn();
    renderOpen({ onSelect, onClose });
    await userEvent.click(screen.getByText('Bereishit'));
    expect(onSelect).toHaveBeenCalledWith('בְּרֵאשִׁית');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('selected parsha button has selected class', () => {
    renderOpen({ value: 'נֹחַ' });
    expect(screen.getByText('Noach').closest('button')).toHaveClass('selected');
    expect(screen.getByText('Bereishit').closest('button')).not.toHaveClass('selected');
  });

  it('query resets to empty when modal reopens', async () => {
    const { rerender } = renderOpen();
    typeInSearch('noach');
    expect(screen.queryByText('Bereishit')).not.toBeInTheDocument();

    rerender(<ParshaPickerModal {...DEFAULT_PROPS} opened={false} />);
    rerender(<ParshaPickerModal {...DEFAULT_PROPS} opened={true} />);
    await waitFor(() => expect(screen.getByText('Bereishit')).toBeInTheDocument());
  });
});
