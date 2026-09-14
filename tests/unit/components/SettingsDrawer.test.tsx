import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx } from '../../helpers/appContextMock.js';
import type { AuthStatus } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const fetchAuthStatus  = vi.fn();
const login            = vi.fn();
const logout           = vi.fn();
const changePassword   = vi.fn();
vi.mock('../../../src/api.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/api.js')>('../../../src/api.js');
  return {
    ...actual,
    fetchAuthStatus: () => fetchAuthStatus(),
    login: (p: string) => login(p),
    logout: () => logout(),
    changePassword: (c: string, n: string) => changePassword(c, n),
  };
});

const exportExcel = vi.fn();
const exportDb     = vi.fn();
vi.mock('../../../src/utils/export.js', () => ({
  exportExcel: () => exportExcel(),
  exportDb: () => exportDb(),
}));

const importDb = vi.fn();
vi.mock('../../../src/utils/import.js', () => ({ importDb: (f: File) => importDb(f) }));

let confirmCallback: (() => void) | null = null;
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn((opts: { onConfirm: () => void }) => { confirmCallback = opts.onConfirm; }),
  },
}));

const notificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({ notifications: { show: (...a: unknown[]) => notificationsShow(...a) } }));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

import SettingsDrawer from '../../../src/components/SettingsDrawer.js';

const mockUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

function setCtx(overrides: Parameters<typeof makeCtx>[0] = {}) {
  mockUseApp.mockReturnValue(makeCtx({
    allYears: [2024, 2025],
    ...overrides,
  }));
}

const originalReload = globalThis.location.reload;

beforeEach(() => {
  confirmCallback = null;
  fetchAuthStatus.mockResolvedValue({ authMode: 'password', insecureConfig: false } satisfies AuthStatus);
  Object.defineProperty(globalThis, 'location', {
    value: { ...globalThis.location, reload: vi.fn() },
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, 'location', { value: { ...globalThis.location, reload: originalReload }, writable: true });
});

describe('SettingsDrawer — filters', () => {
  it('resets filters when "Reset all filters" is clicked', () => {
    setCtx({ canWrite: false });
    const setFilters = vi.fn();
    setCtx({ canWrite: false, setFilters });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Reset all filters'));
    expect(setFilters).toHaveBeenCalledWith({
      sefarim: [], years: [], includeFutureDates: true, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false,
    });
  });

  it('toggles the "Show re-reads" switch through setFilters', () => {
    const setFilters = vi.fn();
    setCtx({ canWrite: false, setFilters });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Show re-reads Show additional readings in Reading Log' }));
    expect(setFilters).toHaveBeenCalled();
  });
});

describe('SettingsDrawer — login', () => {
  it('shows the login form when not authenticated in password mode', async () => {
    setCtx({ canWrite: false });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Log in');
  });

  it('does not show the login form when auth is not password-based', async () => {
    fetchAuthStatus.mockResolvedValue({ authMode: 'none', insecureConfig: false });
    setCtx({ canWrite: false });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await waitFor(() => expect(fetchAuthStatus).toHaveBeenCalled());
    expect(screen.queryByText('Log in')).not.toBeInTheDocument();
  });

  it('shows an error on incorrect password and does not refresh canWrite', async () => {
    login.mockResolvedValue(false);
    const refreshCanWrite = vi.fn();
    setCtx({ canWrite: false, refreshCanWrite });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Log in');

    await userEvent.type(screen.getByLabelText('Admin password'), 'wrong');
    fireEvent.click(screen.getByText('Log in'));

    await screen.findByText('Incorrect password');
    expect(refreshCanWrite).not.toHaveBeenCalled();
  });

  it('logs in successfully and refreshes canWrite', async () => {
    login.mockResolvedValue(true);
    const refreshCanWrite = vi.fn();
    setCtx({ canWrite: false, refreshCanWrite });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Log in');

    await userEvent.type(screen.getByLabelText('Admin password'), 'right');
    fireEvent.click(screen.getByText('Log in'));

    await waitFor(() => expect(refreshCanWrite).toHaveBeenCalled());
    expect(login).toHaveBeenCalledWith('right');
  });
});

describe('SettingsDrawer — writable actions', () => {
  it('shows export/import/change-password/logout controls when canWrite is true', async () => {
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await waitFor(() => expect(fetchAuthStatus).toHaveBeenCalled());

    expect(screen.getByText('Export to Excel')).toBeInTheDocument();
    expect(screen.getByText('Export DB (.sqlite)')).toBeInTheDocument();
    expect(screen.getByText('Import DB (.sqlite)')).toBeInTheDocument();
    expect(screen.getByText('Change password')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('triggers exportExcel when "Export to Excel" is clicked', async () => {
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Export to Excel');

    fireEvent.click(screen.getByText('Export to Excel'));
    await waitFor(() => expect(exportExcel).toHaveBeenCalled());
  });

  it('triggers exportDb when "Export DB (.sqlite)" is clicked', async () => {
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Export DB (.sqlite)');

    fireEvent.click(screen.getByText('Export DB (.sqlite)'));
    await waitFor(() => expect(exportDb).toHaveBeenCalled());
  });

  it('calls logout and refreshes canWrite', async () => {
    const refreshCanWrite = vi.fn();
    setCtx({ canWrite: true, refreshCanWrite });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Log out');

    fireEvent.click(screen.getByText('Log out'));
    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(refreshCanWrite).toHaveBeenCalled();
  });

  it('shows an error message when change-password fails', async () => {
    changePassword.mockResolvedValue({ ok: false, error: 'Too short' });
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Change password');

    await userEvent.type(screen.getByLabelText('Current password'), 'old');
    await userEvent.type(screen.getByLabelText('New password'), 'x');
    fireEvent.click(screen.getByText('Change password'));

    await screen.findByText('Too short');
  });

  it('shows a success notification when change-password succeeds', async () => {
    changePassword.mockResolvedValue({ ok: true });
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Change password');

    await userEvent.type(screen.getByLabelText('Current password'), 'old');
    await userEvent.type(screen.getByLabelText('New password'), 'newlongpassword');
    fireEvent.click(screen.getByText('Change password'));

    await waitFor(() => expect(notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Password changed' }),
    ));
  });
});

describe('SettingsDrawer — import flow', () => {
  function selectFile(file: File) {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
  }

  it('opens a confirm modal on file selection and shows a success notification on confirm', async () => {
    importDb.mockResolvedValue({ ok: true });
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Import DB (.sqlite)');

    const file = new File(['x'], 'backup.db', { type: 'application/vnd.sqlite3' });
    selectFile(file);

    expect(confirmCallback).not.toBeNull();
    await confirmCallback!();

    expect(importDb).toHaveBeenCalledWith(file);
    await waitFor(() => expect(notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Database imported. Reloading…' }),
    ));
    expect(globalThis.location.reload).toHaveBeenCalled();
  });

  it('shows an error notification and does not reload when import fails', async () => {
    importDb.mockResolvedValue({ ok: false, error: 'Not a valid database' });
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    await screen.findByText('Import DB (.sqlite)');

    const file = new File(['x'], 'backup.db', { type: 'application/vnd.sqlite3' });
    selectFile(file);
    await confirmCallback!();

    await waitFor(() => expect(notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Not a valid database' }),
    ));
    expect(globalThis.location.reload).not.toHaveBeenCalled();
  });

  it('does nothing when no file is selected', () => {
    setCtx({ canWrite: true });
    renderWithProviders(<SettingsDrawer opened onClose={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(confirmCallback).toBeNull();
  });
});
