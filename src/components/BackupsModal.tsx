import { useEffect, useState } from 'react';
import { Modal, Stack, Group, Text, Button, Loader, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import type { NativeBackup } from '../db/nativeBackups.js';
import { errText } from '../utils/errText.js';

// iOS/Android only: the pre-migration backups the app keeps in its data folder (see
// db/nativeBackups.ts). Lazily imported so the Capacitor plugins never load on web.
const nativeBackups = () => import('../db/nativeBackups.js');

interface BackupsModalProps {
  readonly opened:    boolean;
  readonly onClose:   () => void;
  // Restores through the normal import path (validate, upgrade, swap, reload).
  readonly onRestore: (file: File) => void;
}

export default function BackupsModal({ opened, onClose, onRestore }: BackupsModalProps) {
  const [backups, setBackups] = useState<NativeBackup[] | null>(null);
  const [busy, setBusy]       = useState<string | null>(null);

  async function refresh() {
    try {
      const { listBackups } = await nativeBackups();
      setBackups(await listBackups());
    } catch (e: unknown) {
      notifications.show({ message: `Couldn't list backups: ${errText(e)}`, color: 'red' });
      setBackups([]);
    }
  }

  useEffect(() => {
    if (!opened) return;
    setBackups(null);
    void refresh();
  }, [opened]);

  async function runAction(name: string, failure: string, action: () => Promise<void>) {
    setBusy(name);
    try {
      await action();
    } catch (e: unknown) {
      // Dismissing the share sheet rejects too; that's not an error worth reporting.
      if (!/cancel/i.test(errText(e))) notifications.show({ message: `${failure}: ${errText(e)}`, color: 'red' });
    } finally {
      setBusy(null);
    }
  }

  function handleExport(backup: NativeBackup) {
    void runAction(backup.name, "Couldn't export backup", async () => {
      const { shareBackup } = await nativeBackups();
      await shareBackup(backup.name);
    });
  }

  function handleRestore(backup: NativeBackup) {
    modals.openConfirmModal({
      title: 'Restore backup',
      children: (
        <Text size="sm" c="dimmed">
          This replaces all reading data in this app with the backup from <strong>{backup.date.toLocaleString()}</strong>.
          Readings added since then will be lost.
        </Text>
      ),
      labels: { confirm: 'Restore and replace', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => void runAction(backup.name, "Couldn't read backup", async () => {
        const { readBackupFile } = await nativeBackups();
        const file = await readBackupFile(backup.name);
        onClose();
        onRestore(file);
      }),
    });
  }

  function handleDelete(backup: NativeBackup) {
    modals.openConfirmModal({
      title: 'Delete backup',
      children: <Text size="sm" c="dimmed">Delete the backup from <strong>{backup.date.toLocaleString()}</strong>? This can't be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => void runAction(backup.name, "Couldn't delete backup", async () => {
        const { deleteBackup } = await nativeBackups();
        await deleteBackup(backup.name);
        await refresh();
      }),
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Backups" centered>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          A copy of your data is saved here automatically before an app update changes the database.
          The newest 5 are kept.
        </Text>
        {backups === null && <Loader size="sm" mx="auto" />}
        {backups?.length === 0 && <Text size="sm">No backups yet.</Text>}
        {backups?.map(backup => (
          <Paper key={backup.name} withBorder p="sm">
            <Stack gap={6}>
              <div>
                <Text size="sm" fw={600}>{backup.date.toLocaleString()}</Text>
                <Text size="xs" c="dimmed">
                  Schema {backup.schemaVersion} · app {backup.appVersion} · {Math.max(1, Math.round(backup.size / 1024))} KB
                </Text>
              </div>
              <Group gap="xs" grow>
                <Button size="xs" variant="light" color="gray" disabled={busy !== null}
                  loading={busy === backup.name} onClick={() => handleExport(backup)}>
                  Export
                </Button>
                <Button size="xs" variant="light" color="red" disabled={busy !== null}
                  onClick={() => handleRestore(backup)}>
                  Restore
                </Button>
                <Button size="xs" variant="subtle" color="gray" disabled={busy !== null}
                  onClick={() => handleDelete(backup)}>
                  Delete
                </Button>
              </Group>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Modal>
  );
}
