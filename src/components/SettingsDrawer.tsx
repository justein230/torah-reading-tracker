import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Drawer, Stack, MultiSelect, Switch, SegmentedControl, Text, Box, Button, Divider, PasswordInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useApp } from '../context/AppContext.js';
import { fetchAuthStatus, login, logout, changePassword } from '../api.js';
import { exportExcel, exportDb } from '../utils/export.js';
import { importDb } from '../utils/import.js';
import { exportLogs } from '../utils/logger-client/index.js';
import type { AuthStatus } from '../types/index.js';

interface SettingsDrawerProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export default function SettingsDrawer({ opened, onClose }: SettingsDrawerProps) {
  const { SEFER_ORDER, SEFER_MAP, allYears, filters, setFilters, canWrite, refreshCanWrite,
          settings, setSettings, cacheYears } = useApp();
  const [exporting, setExporting] = useState<'excel' | 'db' | 'logs' | null>(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [password, setPassword]     = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn]   = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [changeError, setChangeError]         = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    void fetchAuthStatus().then(setAuthStatus);
  }, []);

  async function handleLogin(e: React.SubmitEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const ok = await login(password);
      if (!ok) { setLoginError('Incorrect password'); return; }
      setPassword('');
      await refreshCanWrite();
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await logout();
    await refreshCanWrite();
  }

  async function handleChangePassword(e: React.SubmitEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setChangeError('');
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.ok) { setChangeError(result.error); return; }
      setCurrentPassword('');
      setNewPassword('');
      notifications.show({ message: 'Password changed', color: 'green' });
    } finally {
      setChangingPassword(false);
    }
  }

  function set<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  const seferOptions = SEFER_ORDER.map(s => ({ value: s, label: `${s} — ${SEFER_MAP[s]?.en ?? s}` }));
  const yearOptions  = allYears.map(y => ({ value: String(y), label: String(y) }));

  function reset() {
    setFilters({ sefarim: [], years: [], includeFutureDates: true, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false });
  }

  async function handleExcelExport() {
    setExporting('excel');
    try { await exportExcel(); }
    finally { setExporting(null); }
  }

  async function handleDbExport() {
    setExporting('db');
    try { await exportDb(); }
    finally { setExporting(null); }
  }

  async function handleLogsExport() {
    setExporting('logs');
    try { await exportLogs(); }
    finally { setExporting(null); }
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    modals.openConfirmModal({
      title: 'Import database',
      children: (
        <Stack gap={12}>
          <Text size="sm" c="dimmed">
            This replaces all reading data in this app with the contents of <strong>{file.name}</strong>.
            The current database is backed up automatically first, but this can't be undone from here.
          </Text>
          <Text size="sm" c="dimmed">Your login is not affected.</Text>
        </Stack>
      ),
      labels: { confirm: 'Import and replace', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => void runImport(file),
    });
  }

  async function runImport(file: File) {
    setImporting(true);
    try {
      const result = await importDb(file);
      if (!result.ok) {
        notifications.show({ message: result.error, color: 'red' });
        return;
      }
      notifications.show({ message: 'Database imported. Reloading…', color: 'green' });
      window.location.reload();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Settings"
      position="right"
      size="sm"
      styles={{
        content: { background: 'var(--surface)' },
        header:  { background: 'var(--surface)', borderBottom: '1px solid var(--surface2)' },
      }}
      classNames={{ header: 'modal-header-safe' }}
    >
      <Stack gap="md" p="md">
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Filters</Text>

        <MultiSelect
          label="Book (Sefer)"
          data={seferOptions}
          value={filters.sefarim}
          onChange={vals => set('sefarim', vals)}
          placeholder="All books"
          clearable
        />

        <MultiSelect
          label="Year"
          data={yearOptions}
          value={filters.years.map(String)}
          onChange={vals => set('years', vals.map(Number))}
          placeholder="All years"
          clearable
        />

        <Box>
          <Text size="sm" fw={500} mb={8}>% Display</Text>
          <SegmentedControl
            value={filters.pctMode}
            onChange={v => set('pctMode', v)}
            data={[
              { value: 'pseukim', label: 'Pseukim' },
              { value: 'aliyot',  label: 'Aliyot' },
            ]}
            fullWidth
          />
        </Box>

        <Switch
          label="Show re-reads"
          description="Show additional readings in Reading Log"
          checked={filters.includeFutureDates}
          onChange={e => set('includeFutureDates', e.currentTarget.checked)}
        />

        <Divider />
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Rings</Text>

        <Switch
          label="Show holiday aliyot ring"
          description="Separate ring for occasion/holiday readings"
          checked={filters.showHolidayRing}
          onChange={e => set('showHolidayRing', e.currentTarget.checked)}
        />

        <Switch
          label="Show weekday aliyot ring"
          description="Separate ring for weekday Torah readings"
          checked={filters.showWeekdayRing}
          onChange={e => set('showWeekdayRing', e.currentTarget.checked)}
        />

        <Button variant="subtle" color="gray" onClick={reset}>
          Reset all filters
        </Button>

        <Divider />
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Advanced</Text>

        <Switch
          label="Live Hebcal.com lookups"
          description={`Verify reading dates outside ${cacheYears[0]}–${cacheYears[1]} by calling Hebcal.com`}
          checked={settings.liveHebcalLookups}
          onChange={e => setSettings(s => ({ ...s, liveHebcalLookups: e.currentTarget.checked }))}
        />

        <Switch
          label="Verbose debug logging"
          description="Uses more disk space / console output — turn on only while reproducing an issue"
          checked={settings.debugLogging}
          onChange={e => setSettings(s => ({ ...s, debugLogging: e.currentTarget.checked }))}
        />

        {authStatus?.authMode === 'password' && !canWrite && (
          <>
            <Divider />
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Manage</Text>
            <Box component="form" onSubmit={e => void handleLogin(e)}>
              <Stack gap="sm">
                <PasswordInput
                  label="Admin password"
                  value={password}
                  onChange={e => setPassword(e.currentTarget.value)}
                  error={loginError || undefined}
                />
                <Button fullWidth type="submit" loading={loggingIn}>
                  Log in
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {canWrite && (
          <>
            <Divider />
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Actions</Text>
            <Button variant="light" color="gray" fullWidth
              loading={exporting === 'excel'} onClick={handleExcelExport}>
              Export to Excel
            </Button>
            <Button variant="light" color="gray" fullWidth
              loading={exporting === 'db'} onClick={handleDbExport}>
              Export DB (.sqlite)
            </Button>
            <Button variant="light" color="gray" fullWidth
              loading={exporting === 'logs'} onClick={handleLogsExport}>
              Export logs
            </Button>
            {!Capacitor.isNativePlatform() && (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3"
                  hidden
                  onChange={handleImportFileSelected}
                />
                <Button variant="light" color="red" fullWidth
                  loading={importing} onClick={handleImportClick}>
                  Import DB (.sqlite)
                </Button>
              </>
            )}
            {authStatus?.authMode === 'password' && (
              <>
                <Box component="form" onSubmit={e => void handleChangePassword(e)}>
                  <Stack gap="sm">
                    <PasswordInput
                      label="Current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.currentTarget.value)}
                      error={changeError || undefined}
                    />
                    <PasswordInput
                      label="New password"
                      description="At least 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.currentTarget.value)}
                    />
                    <Button variant="light" color="gray" fullWidth type="submit"
                      loading={changingPassword}>
                      Change password
                    </Button>
                  </Stack>
                </Box>
                <Button variant="subtle" color="gray" fullWidth onClick={handleLogout}>
                  Log out
                </Button>
              </>
            )}
          </>
        )}
      </Stack>

      <Text c="dimmed" ta="right" px={6} pb={4} style={{ fontSize: 12 }}>
        v{__APP_VERSION__}
      </Text>
    </Drawer>
  );
}
