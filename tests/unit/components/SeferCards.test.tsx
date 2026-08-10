import { vi, type Mock } from 'vitest';
import { SeferCards } from '../../../src/components/SeferCards.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER } from '../../helpers/appContextMock.js';
import type { Stats } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

function makeBs(overrides: Partial<Stats['bySefer'][string]> = {}): Stats['bySefer'][string] {
  return {
    totalAliyot: 10, readAliyot: 0, totalPseukim: 100, readPseukim: 0, readPct: 0, rereadCount: 0,
    committedAliyot: 0, committedPseukim: 0, specialReadPseukim: 0, specialFuturePseukim: 0,
    ...overrides,
  };
}

function makeStats(bs: Stats['bySefer'][string]): Stats {
  return {
    totalAliyot: 10, totalPseukim: 100, readAliyot: 0, readPseukim: 0, readPct: 0, rereadCount: 0,
    committedAliyot: 0, committedPseukim: 0, committedPct: 0,
    bySefer: { [MOCK_SEFER]: bs, 'שְׁמוֹת': makeBs() },
    byYear: {}, byYearFuture: {}, filteredRows: [],
    specialReadPseukim: 0, specialFuturePseukim: 0, specialTotalPseukim: 0,
  };
}

function pseukimLine(container: HTMLElement): string {
  return Array.from(container.querySelectorAll('.mantine-Text-root'))
    .map(el => el.textContent ?? '')
    .find(t => t.startsWith('Pseukim')) ?? '';
}

describe('SeferCards — pseukim upcoming total', () => {
  // Regression test: SeferCards once computed committedSpecial as
  // `committedPseukim + specialFuturePseukim`, dropping specialReadPseukim (pseukim already
  // read via a holiday reading that only partially covers a standard aliyah, so the standard
  // aliyah's own row never gets marked committed). That undercounted the "↑ upcoming" total by
  // exactly the specialReadPseukim amount.
  it('includes specialReadPseukim in the displayed committed/upcoming total', () => {
    const bs = makeBs({ readPseukim: 10, specialReadPseukim: 8, committedPseukim: 37, specialFuturePseukim: 0 });
    (useApp as Mock).mockReturnValue(makeCtx({ stats: makeStats(bs) }));
    const { container } = renderWithProviders(<SeferCards stats={makeStats(bs)} />);

    // effective = 10 + 8 = 18; committedSpecial must be 37 + 8 + 0 = 45, not 37.
    expect(pseukimLine(container)).toContain('18');
    expect(pseukimLine(container)).toContain('45');
    expect(pseukimLine(container)).not.toContain('37 ');
  });

  it('shows no upcoming marker when nothing is committed beyond what is effectively read', () => {
    const bs = makeBs({ readPseukim: 20, specialReadPseukim: 0, committedPseukim: 20, specialFuturePseukim: 0 });
    (useApp as Mock).mockReturnValue(makeCtx({ stats: makeStats(bs) }));
    const { container } = renderWithProviders(<SeferCards stats={makeStats(bs)} />);
    expect(pseukimLine(container)).not.toContain('↑');
  });
});
