import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import type { NativeBackup } from '../../../src/db/nativeBackups.js';

const listBackups    = vi.fn();
const shareBackup    = vi.fn();
const deleteBackup   = vi.fn();
const readBackupFile = vi.fn();
vi.mock('../../../src/db/nativeBackups.js', () => ({
  listBackups:    () => listBackups(),
  shareBackup:    (n: string) => shareBackup(n),
  deleteBackup:   (n: string) => deleteBackup(n),
  readBackupFile: (n: string) => readBackupFile(n),
}));

let confirmCallback: (() => void) | null = null;
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn((opts: { onConfirm: () => void }) => { confirmCallback = opts.onConfirm; }),
  },
}));

const notificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({ notifications: { show: (...a: unknown[]) => notificationsShow(...a) } }));

import BackupsModal from '../../../src/components/BackupsModal.js';

const BACKUP: NativeBackup = {
  name:          'torah-backup-2026-10-08T14-03-22Z-schema7-app1.0.8.db',
  date:          new Date('2026-10-08T14:03:22Z'),
  schemaVersion: 7,
  appVersion:    '1.0.8',
  size:          192_512,
};

beforeEach(() => {
  confirmCallback = null;
  notificationsShow.mockClear();
  listBackups.mockResolvedValue([BACKUP]);
  shareBackup.mockResolvedValue(undefined);
  deleteBackup.mockResolvedValue(undefined);
});

function renderModal(onRestore = vi.fn(), onClose = vi.fn()) {
  renderWithProviders(<BackupsModal opened onClose={onClose} onRestore={onRestore} />);
  return { onRestore, onClose };
}

describe('BackupsModal', () => {
  it('lists each backup with its schema version, app version and size', async () => {
    renderModal();
    expect(await screen.findByText('Schema 7 · app 1.0.8 · 188 KB')).toBeInTheDocument();
  });

  it('says so when there are no backups', async () => {
    listBackups.mockResolvedValue([]);
    renderModal();
    expect(await screen.findByText('No backups yet.')).toBeInTheDocument();
  });

  it('reports a listing failure', async () => {
    listBackups.mockRejectedValue(new Error('disk gone'));
    renderModal();
    await waitFor(() => expect(notificationsShow).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('disk gone') })));
    expect(screen.getByText('No backups yet.')).toBeInTheDocument();
  });

  it('exports through the share sheet', async () => {
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: 'Export' }));
    await waitFor(() => expect(shareBackup).toHaveBeenCalledWith(BACKUP.name));
  });

  it('stays quiet when the share sheet is dismissed', async () => {
    shareBackup.mockRejectedValue(new Error('Share canceled'));
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: 'Export' }));
    await waitFor(() => expect(shareBackup).toHaveBeenCalled());
    expect(notificationsShow).not.toHaveBeenCalled();
  });

  it('deletes after confirmation and refreshes the list', async () => {
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(deleteBackup).not.toHaveBeenCalled();
    listBackups.mockResolvedValue([]);
    confirmCallback!();
    await waitFor(() => expect(deleteBackup).toHaveBeenCalledWith(BACKUP.name));
    expect(await screen.findByText('No backups yet.')).toBeInTheDocument();
  });

  it('restores after confirmation by handing the file to onRestore', async () => {
    const file = new File([new Uint8Array([1])], BACKUP.name);
    readBackupFile.mockResolvedValue(file);
    const { onRestore, onClose } = renderModal();
    fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));
    expect(onRestore).not.toHaveBeenCalled();
    confirmCallback!();
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith(file));
    expect(readBackupFile).toHaveBeenCalledWith(BACKUP.name);
    expect(onClose).toHaveBeenCalled();
  });
});
