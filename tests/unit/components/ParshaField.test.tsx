import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';

// Use a getter so we can toggle isTouch per test without resetting modules.
let mockIsTouch = false;
vi.mock('../../../src/components/AliyahTooltip.js', () => ({
  get isTouch() { return mockIsTouch; },
}));
vi.mock('../../../src/components/shared/ParshaPickerModal.js', () => ({
  ParshaPickerModal: ({ opened, onSelect }: { opened: boolean; onSelect: (p: string) => void }) =>
    opened ? <button onClick={() => onSelect('בְּרֵאשִׁית')}>pick</button> : null,
}));

import { ParshaField } from '../../../src/components/shared/ParshaField.js';

const BASE_PROPS = {
  value: '',
  onSelect: () => {},
  parshaOptions: [
    { value: 'בְּרֵאשִׁית', label: 'בְּרֵאשִׁית  —  Bereishit' },
    { value: 'נֹחַ',        label: 'נֹחַ  —  Noach' },
  ],
  SEFER_ORDER:  ['בְּרֵאשִׁית'],
  SEFER_MAP:    { 'בְּרֵאשִׁית': { en: 'Genesis', color: '#888', hebrewName: 'בְּרֵאשִׁית', aliyotCount: 54, verseCount: 1533, chapterVerses: [] } },
  parshaIndex:  { 'בְּרֵאשִׁית': ['בְּרֵאשִׁית', 'נֹחַ'] },
  TLIT:         { 'בְּרֵאשִׁית': 'Bereishit', 'נֹחַ': 'Noach' },
};

describe('ParshaField — desktop (isTouch=false)', () => {
  beforeEach(() => { mockIsTouch = false; });

  it('renders a combobox (Select)', () => {
    renderWithProviders(<ParshaField {...BASE_PROPS} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('is enabled by default', () => {
    renderWithProviders(<ParshaField {...BASE_PROPS} />);
    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });

  it('is disabled when locked=true', () => {
    renderWithProviders(<ParshaField {...BASE_PROPS} locked />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

describe('ParshaField — touch (isTouch=true)', () => {
  beforeEach(() => { mockIsTouch = true; });

  it('renders a text input instead of combobox', () => {
    renderWithProviders(<ParshaField {...BASE_PROPS} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('clicking the input opens the picker modal', async () => {
    renderWithProviders(<ParshaField {...BASE_PROPS} />);
    await userEvent.click(screen.getByRole('textbox'));
    expect(screen.getByRole('button', { name: 'pick' })).toBeInTheDocument();
  });

  it('calls onSelect when a parsha is picked from the modal', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<ParshaField {...BASE_PROPS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.click(screen.getByRole('button', { name: 'pick' }));
    expect(onSelect).toHaveBeenCalledWith('בְּרֵאשִׁית');
  });

  it('does not open the modal when locked=true', async () => {
    renderWithProviders(<ParshaField {...BASE_PROPS} locked />);
    await userEvent.click(screen.getByRole('textbox'));
    expect(screen.queryByRole('button', { name: 'pick' })).toBeNull();
  });
});
