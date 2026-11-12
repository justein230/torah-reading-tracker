import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { dateStamp } from '../../../src/utils/exportFileName.js';

const exportDb             = vi.fn();
const saveDbToDocuments    = vi.fn();
const exportExcel          = vi.fn();
const saveExcelToDocuments = vi.fn();
vi.mock('../../../src/utils/export.js', () => ({
  exportDb:             (n: string) => exportDb(n),
  saveDbToDocuments:    (n: string, o?: boolean) => saveDbToDocuments(n, o),
  exportExcel:          (n: string) => exportExcel(n),
  saveExcelToDocuments: (n: string, o?: boolean) => saveExcelToDocuments(n, o),
  documentsExportPath: (n: string) => `Torah Tracker/${n}`,
}));

let confirmCallback: (() => void) | null = null;
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn((opts: { onConfirm: () => void }) => { confirmCallback = opts.onConfirm; }),
  },
}));

const notificationsShow = vi.fn();
vi.mock('@mantine/notifications', () => ({ notifications: { show: (...a: unknown[]) => notificationsShow(...a) } }));

const platform = vi.hoisted(() => ({ name: 'android' as 'android' | 'ios' | 'web' }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => platform.name !== 'web', getPlatform: () => platform.name },
}));

import ExportModal, { type ExportKind } from '../../../src/components/ExportModal.js';

const today = dateStamp(new Date());

beforeEach(() => {
  confirmCallback = null;
  platform.name = 'android';
  notificationsShow.mockClear();
  exportDb.mockReset().mockResolvedValue(undefined);
  saveDbToDocuments.mockReset().mockResolvedValue('saved');
  exportExcel.mockReset().mockResolvedValue(undefined);
  saveExcelToDocuments.mockReset().mockResolvedValue('saved');
});

function renderModal(onClose = vi.fn(), kind: ExportKind = 'db') {
  renderWithProviders(<ExportModal kind={kind} opened onClose={onClose} />);
  return { onClose };
}

const nameInput = () => screen.getByLabelText('File name');
const button    = (name: string) => screen.getByRole('button', { name });

describe('ExportModal — Excel', () => {
  it('titles the dialog and defaults to torah-readings.xlsx with today\'s date suffix', () => {
    renderModal(vi.fn(), 'excel');
    expect(screen.getByText('Export Excel')).toBeInTheDocument();
    expect(screen.getByText(`torah-readings-${today}.xlsx`)).toBeInTheDocument();
  });

  it('drops a typed .xlsx extension from the previewed name', () => {
    renderModal(vi.fn(), 'excel');
    fireEvent.change(nameInput(), { target: { value: 'report.xlsx' } });
    expect(screen.getByText(`report-${today}.xlsx`)).toBeInTheDocument();
  });

  it('saves the workbook to Documents on Android', async () => {
    const { onClose } = renderModal(vi.fn(), 'excel');
    fireEvent.click(button('Save to Documents'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(saveExcelToDocuments).toHaveBeenCalledWith(`torah-readings-${today}.xlsx`, false);
    expect(saveDbToDocuments).not.toHaveBeenCalled();
  });

  it('shares the workbook under the previewed name', async () => {
    const { onClose } = renderModal(vi.fn(), 'excel');
    fireEvent.click(button('Share…'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(exportExcel).toHaveBeenCalledWith(`torah-readings-${today}.xlsx`);
    expect(exportDb).not.toHaveBeenCalled();
  });

  it('downloads on web', async () => {
    platform.name = 'web';
    renderModal(vi.fn(), 'excel');
    fireEvent.click(button('Download'));
    await waitFor(() => expect(exportExcel).toHaveBeenCalledWith(`torah-readings-${today}.xlsx`));
  });
});

describe('ExportModal — file name', () => {
  it('defaults to torah with today\'s date suffix', () => {
    renderModal();
    expect(screen.getByText(`torah-${today}.db`)).toBeInTheDocument();
  });

  it('previews the typed name, sanitized', () => {
    renderModal();
    fireEvent.change(nameInput(), { target: { value: 'my/readings' } });
    expect(screen.getByText(`my-readings-${today}.db`)).toBeInTheDocument();
  });

  it('drops the date when the suffix is unchecked', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Add date suffix (yyyymmdd)'));
    expect(screen.getByText('torah.db')).toBeInTheDocument();
  });
});

describe('ExportModal (DB) — Android', () => {
  it('saves to Documents under the previewed name, notifies, and closes', async () => {
    const { onClose } = renderModal();
    fireEvent.change(nameInput(), { target: { value: 'backup' } });
    fireEvent.click(button('Save to Documents'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(saveDbToDocuments).toHaveBeenCalledWith(`backup-${today}.db`, false);
    expect(notificationsShow).toHaveBeenCalledWith(expect.objectContaining({ message: `Saved to Documents/Torah Tracker/backup-${today}.db` }));
  });

  it('asks before replacing an existing file, then overwrites on confirm', async () => {
    saveDbToDocuments.mockResolvedValueOnce('exists');
    const { onClose } = renderModal();
    fireEvent.click(button('Save to Documents'));

    await waitFor(() => expect(confirmCallback).not.toBeNull());
    expect(onClose).not.toHaveBeenCalled();

    confirmCallback!();
    await waitFor(() => expect(saveDbToDocuments).toHaveBeenLastCalledWith(`torah-${today}.db`, true));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows the error and stays open when saving fails', async () => {
    saveDbToDocuments.mockRejectedValueOnce(new Error('Permission denied'));
    const { onClose } = renderModal();
    fireEvent.click(button('Save to Documents'));

    await waitFor(() => expect(notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Export failed: Permission denied', color: 'red' })));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shares under the previewed name', async () => {
    const { onClose } = renderModal();
    fireEvent.click(button('Share…'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(exportDb).toHaveBeenCalledWith(`torah-${today}.db`);
  });
});

describe('ExportModal (DB) — other platforms', () => {
  it('iOS offers Share only (the share sheet has Save to Files)', () => {
    platform.name = 'ios';
    renderModal();
    expect(screen.queryByRole('button', { name: 'Save to Documents' })).not.toBeInTheDocument();
    expect(button('Share…')).toBeInTheDocument();
  });

  it('web offers Download', async () => {
    platform.name = 'web';
    renderModal();
    expect(screen.queryByRole('button', { name: 'Save to Documents' })).not.toBeInTheDocument();
    fireEvent.click(button('Download'));
    await waitFor(() => expect(exportDb).toHaveBeenCalledWith(`torah-${today}.db`));
  });
});
