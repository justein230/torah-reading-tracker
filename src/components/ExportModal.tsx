import { useState } from 'react';
import { Modal, Stack, Group, Text, TextInput, Checkbox, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { Capacitor } from '@capacitor/core';
import {
  exportDb, saveDbToDocuments, exportExcel, saveExcelToDocuments, documentsExportPath,
  type SaveToDocumentsResult,
} from '../utils/export.js';
import { exportFileName, DB_EXPORT_FORMAT, EXCEL_EXPORT_FORMAT, type ExportFormat } from '../utils/exportFileName.js';
import { errText } from '../utils/errText.js';

// Exports the readings (as a db or an Excel workbook) under a name the user picks, optionally
// stamped with today's date. Android: save straight to Documents/Torah Tracker, or share.
// iOS: share (its share sheet has "Save to Files"). Web/Electron: download.

export type ExportKind = 'db' | 'excel';

interface KindConfig {
  readonly title:  string;
  readonly format: ExportFormat;
  readonly share:  (fileName: string) => Promise<void>;
  readonly save:   (fileName: string, overwrite: boolean) => Promise<SaveToDocumentsResult>;
}

const KINDS: Record<ExportKind, KindConfig> = {
  db:    { title: 'Export DB',    format: DB_EXPORT_FORMAT,    share: exportDb,    save: saveDbToDocuments },
  excel: { title: 'Export Excel', format: EXCEL_EXPORT_FORMAT, share: exportExcel, save: saveExcelToDocuments },
};

interface ExportModalProps {
  readonly kind:    ExportKind;
  readonly opened:  boolean;
  readonly onClose: () => void;
}

type Busy = 'save' | 'share' | null;

export default function ExportModal({ kind, opened, onClose }: ExportModalProps) {
  const { title, format, share: shareFile, save: saveFile } = KINDS[kind];
  const [name, setName]               = useState(format.defaultBase);
  const [withDate, setWithDate]       = useState(true);
  const [busy, setBusy]               = useState<Busy>(null);

  const isNative    = Capacitor.isNativePlatform();
  const canSaveDocs = Capacitor.getPlatform() === 'android';
  const fileName    = exportFileName(name, format, withDate);
  const savedPath   = `Documents/${documentsExportPath(fileName)}`;

  async function run(kind: Exclude<Busy, null>, action: () => Promise<void>) {
    setBusy(kind);
    try {
      await action();
    } catch (e: unknown) {
      notifications.show({ message: `Export failed: ${errText(e)}`, color: 'red' });
    } finally {
      setBusy(null);
    }
  }

  async function save(overwrite: boolean) {
    await run('save', async () => {
      const result = await saveFile(fileName, overwrite);
      if (result === 'exists') {
        confirmOverwrite();
        return;
      }
      notifications.show({ message: `Saved to ${savedPath}` });
      onClose();
    });
  }

  function confirmOverwrite() {
    modals.openConfirmModal({
      title:    'Replace file?',
      children: <Text size="sm">{savedPath} already exists. Replace it?</Text>,
      labels:   { confirm: 'Replace', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => void save(true),
    });
  }

  async function share() {
    await run('share', async () => {
      await shareFile(fileName);
      onClose();
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="sm">
        <TextInput
          label="File name"
          value={name}
          onChange={e => setName(e.currentTarget.value)}
          placeholder={format.defaultBase}
          data-autofocus
        />
        <Checkbox
          label="Add date suffix (yyyymmdd)"
          checked={withDate}
          onChange={e => setWithDate(e.currentTarget.checked)}
        />
        <Text size="sm" c="dimmed">Exports as <Text span ff="monospace">{fileName}</Text></Text>
        <Group justify="flex-end" gap="sm">
          {canSaveDocs && (
            <Button loading={busy === 'save'} disabled={busy === 'share'} onClick={() => void save(false)}>
              Save to Documents
            </Button>
          )}
          <Button variant={canSaveDocs ? 'light' : 'filled'} loading={busy === 'share'}
            disabled={busy === 'save'} onClick={() => void share()}>
            {isNative ? 'Share…' : 'Download'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
