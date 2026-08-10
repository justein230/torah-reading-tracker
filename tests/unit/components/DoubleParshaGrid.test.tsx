import { vi, type Mock } from 'vitest';
import DoubleParshaGrid from '../../../src/components/DoubleParshaGrid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER } from '../../helpers/appContextMock.js';
import { makeRow } from '../../helpers/fixtures.js';
import type { ParshaPair } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

// Hebrew pair name used throughout
const PAIR_NAME    = 'וַיַּקְהֵל-פְקוּדֵי';
const PAIR_NAME_EN = 'Vayakhel-Pekudei';
const PARSHA_1     = 'וַיַּקְהֵל';
const PARSHA_2     = 'פְקוּדֵי';
const SEFER_COLOR_RGB = 'rgb(74, 124, 89)';

const PAIR: ParshaPair = { id: 1, name: PAIR_NAME, name_en: PAIR_NAME_EN, parsha1_id: 10, parsha2_id: 11 };

// parshaById maps id → Hebrew name; parshaToSefer is derived from allRows in the component
const PARSHA_BY_ID: Record<number, string> = { 10: PARSHA_1, 11: PARSHA_2 };

function makeDoubleRow(aliyah: number, combinedAliyah: number, overrides: Partial<ReturnType<typeof makeRow>> = {}) {
  return makeRow({
    sefer: MOCK_SEFER,
    parsha: PARSHA_1,
    aliyah,
    pairName: PAIR_NAME,
    pairNameEn: PAIR_NAME_EN,
    combinedAliyah,
    readAsDouble: false,
    pseukim: 10,
    ...overrides,
  });
}

function getCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.acell')) as HTMLElement[];
}

// ── basic rendering ───────────────────────────────────────────────────────────

describe('DoubleParshaGrid — basic rendering', () => {
  it('renders nothing when there are no pairs for any sefer', () => {
    (useApp as Mock).mockReturnValue(makeCtx({ pairs: [], allRows: [] }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    expect(container.querySelector('.sefer-grid')).toBeEmptyDOMElement();
  });

  it('renders the pair name and transliteration in the row header', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { isRead: false })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    expect(container.textContent).toContain(PAIR_NAME);
    expect(container.textContent).toContain(PAIR_NAME_EN);
  });

  it('renders 7 aliyah cells per pair row', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { isRead: false })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    expect(getCells(container)).toHaveLength(7);
  });
});

// ── cell colors ───────────────────────────────────────────────────────────────

describe('DoubleParshaGrid — cell colors', () => {
  it('readAsDouble=true + isReadPast → solid sefer color (wiring smoke test)', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: true, isRead: true, isReadPast: true, orig: '2024-01-01' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe(SEFER_COLOR_RGB);
    });
  });

  it('readAsDouble=false but isReadPast=true → partial color (read as single, not as double)', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: false, isRead: true, isReadPast: true, orig: '2024-01-01' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    // jsdom normalizes #4a7c5944 → rgba(74, 124, 89, 0.267)
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('rgba(74, 124, 89, 0.267)');
    });
  });

  it('completely unread aliyah (no isReadPast, no partialOrig) → unread background', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: false, isRead: false, isReadPast: false, orig: '', partialOrig: '' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('var(--cell-unread)');
    });
  });

  it('future-scheduled double aliyah gets a dashed border', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: true, isRead: true, isReadFuture: true, orig: '2099-01-01' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    getCells(container).forEach(cell => {
      expect(cell).toHaveClass('dashed');
    });
  });

  it('partially-read double aliyah (isReadPast without readAsDouble) gets semi-transparent color', () => {
    // partialOrig set, but no row has readAsDouble=true isReadPast=true → partial state
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: false, isRead: true, isReadPast: true, orig: '2024-01-01', partialOrig: '2024-01-01' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    // jsdom normalizes #4a7c5944 → rgba(74, 124, 89, 0.267)
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('rgba(74, 124, 89, 0.267)');
    });
  });

  it('read+hasFuture → shows reread dot', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: true, isRead: true, isReadPast: true, hasFuture: true, orig: '2024-01-01' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    expect(container.querySelector('.acell .reread-dot')).toBeInTheDocument();
  });
});

// ── header badge ──────────────────────────────────────────────────────────────

describe('DoubleParshaGrid — header badge', () => {
  it('shows 0/7 Aliyot in the sefer header when no aliyot are read as double', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: false, isRead: false })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    const badge = container.querySelector('.sefer-hdr .badge');
    expect(badge?.textContent).toContain('0/7 Aliyot');
  });

  it('shows 7/7 Aliyot when all aliyot are read as double', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, { readAsDouble: true, isRead: true, isReadPast: true, orig: '2024-01-01' })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    const badge = container.querySelector('.sefer-hdr .badge');
    expect(badge?.textContent).toContain('7/7 Aliyot');
  });

  it('shows per-row n/7 badge with correct count and percentage', () => {
    // 4 of 7 aliyot read as double
    const rows = [1, 2, 3, 4, 5, 6, 7].map(ca =>
      makeDoubleRow(ca, ca, {
        readAsDouble: ca <= 4,
        isRead: ca <= 4, isReadPast: ca <= 4, orig: ca <= 4 ? '2024-01-01' : '',
      })
    );
    (useApp as Mock).mockReturnValue(makeCtx({
      pairs: [PAIR],
      parshaById: PARSHA_BY_ID,
      allRows: rows,
    }));
    const { container } = renderWithProviders(<DoubleParshaGrid />);
    const rowBadge = container.querySelector('.parsha-row .badge');
    expect(rowBadge?.textContent).toContain('4/7');
    expect(rowBadge?.textContent).toContain('57%');
  });
});
