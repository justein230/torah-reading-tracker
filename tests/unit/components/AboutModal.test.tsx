import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { STEPS } from '../../helpers/migrations.js';
import AboutModal from '../../../src/components/AboutModal.js';

describe('AboutModal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows nothing while closed', () => {
    renderWithProviders(<AboutModal opened={false} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /license/i })).not.toBeInTheDocument();
  });

  it('offers every generated license file when open, without navigating away from the app', () => {
    renderWithProviders(<AboutModal opened onClose={() => {}} />);
    expect(screen.getAllByRole('button').map(b => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Close',
      'MIT license (this app)',
      'Third-party licenses',
      'Mobile app libraries',
    ]);
    // Only the data credit is a link; a license-file link would navigate the WebView away on iOS/Android.
    expect(screen.getAllByRole('link').map(a => a.textContent)).toEqual(['Hebcal.com', 'CC BY 4.0']);
  });

  it('credits Hebcal for the data, naming the license and that the data was adapted', () => {
    renderWithProviders(<AboutModal opened onClose={() => {}} />);
    expect(screen.getByRole('link', { name: 'Hebcal.com' })).toHaveAttribute('href', 'https://www.hebcal.com');
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    expect(screen.getByText(/adapted from/)).toHaveTextContent(/holiday dates and aliyah verse ranges adapted from/);
  });

  it('shows the app version and the schema version this build migrates to', () => {
    renderWithProviders(<AboutModal opened onClose={() => {}} />);
    expect(screen.getByText('App version').parentElement).toHaveTextContent(`v${__APP_VERSION__}`);
    expect(screen.getByText('DB schema').parentElement).toHaveTextContent(`v${STEPS.length}`);
  });

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AboutModal opened onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  describe('license viewer', () => {
    it('fetches the chosen file and shows its text in the app', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('Permission is hereby granted') });
      vi.stubGlobal('fetch', fetchMock);
      renderWithProviders(<AboutModal opened onClose={() => {}} />);

      await userEvent.click(screen.getByRole('button', { name: 'Third-party licenses' }));

      expect(await screen.findByText('Permission is hereby granted')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith('./THIRD_PARTY_LICENSES.md', expect.anything());
    });

    it('says so when the file cannot be loaded', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      renderWithProviders(<AboutModal opened onClose={() => {}} />);

      await userEvent.click(screen.getByRole('button', { name: 'Mobile app libraries' }));

      expect(await screen.findByText('Could not load this license file.')).toBeInTheDocument();
    });

    it('returns to the About modal when the viewer is closed', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('MIT text') }));
      renderWithProviders(<AboutModal opened onClose={() => {}} />);
      await userEvent.click(screen.getByRole('button', { name: 'MIT license (this app)' }));
      await screen.findByText('MIT text');

      await userEvent.click(screen.getByRole('button', { name: 'Close license' }));

      expect(screen.queryByText('MIT text')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Third-party licenses' })).toBeInTheDocument();
    });
  });
});
