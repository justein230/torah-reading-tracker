import { useState } from 'react';
import { Modal, Stack, Anchor, Text } from '@mantine/core';
import LicenseViewerModal from './LicenseViewerModal.js';

// Generated into dist/ by the build (see docs/LICENSES.md); `./` keeps them working under a sub-path and in the native apps.
const LICENSE_LINKS = [
  { href: './LICENSE.txt',                     label: 'MIT license (this app)' },
  { href: './THIRD_PARTY_LICENSES.md',         label: 'Third-party licenses' },
  { href: './THIRD_PARTY_LICENSES_NATIVE.md',  label: 'Mobile app libraries' },
];

interface AboutModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AboutModal({ opened, onClose }: AboutModalProps) {
  const [viewing, setViewing] = useState<(typeof LICENSE_LINKS)[number] | null>(null);

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="About Torah Reading Tracker" size="sm" centered closeButtonProps={{ 'aria-label': 'Close' }}>
        <Stack gap="xs">
          <Text size="sm"><Text span c="dimmed" display="inline-block" w={100}>App version</Text>v{__APP_VERSION__}</Text>
          <Text size="sm"><Text span c="dimmed" display="inline-block" w={100}>DB schema</Text>v{__SCHEMA_VERSION__}</Text>
          <Text size="sm" c="dimmed" mt="sm">Licenses</Text>
          {LICENSE_LINKS.map(link => (
            <Anchor key={link.href} component="button" type="button" ta="left" size="sm" onClick={() => setViewing(link)}>
              {link.label}
            </Anchor>
          ))}
        </Stack>
      </Modal>
      <LicenseViewerModal title={viewing?.label ?? ''} href={viewing?.href ?? null} onClose={() => setViewing(null)} />
    </>
  );
}
