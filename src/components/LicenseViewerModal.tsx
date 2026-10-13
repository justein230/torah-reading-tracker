import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollArea, Text, Loader, Center } from '@mantine/core';

interface LicenseViewerModalProps {
  title: string;
  /** Location of the license file to show; the modal is closed while this is null. */
  href: string | null;
  onClose: () => void;
}

type Loaded = { href: string; text: string } | { href: string; error: true };

/**
 * Shows a license file inside the app. Opening the file as a link would navigate the WebView away from
 * the app on iOS and Android, with no way back.
 */
export default function LicenseViewerModal({ title, href, onClose }: Readonly<LicenseViewerModalProps>) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!href) return;
    const controller = new AbortController();
    fetch(href, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(text => setLoaded({ href, text }))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ href, error: true });
      });
    return () => controller.abort();
  }, [href]);

  // Keep showing the last file and title while the modal fades out, so closing doesn't flash the loader or an empty title.
  const lastShown = useRef({ title, href });
  if (href) lastShown.current = { title, href };
  const shown = lastShown.current;

  // Ignore a result left over from a previously opened file.
  const current = loaded?.href === shown.href ? loaded : null;

  return (
    <Modal opened={href !== null} onClose={onClose} title={shown.title} size="xl" centered closeButtonProps={{ 'aria-label': 'Close license' }}>
      {current === null && <Center h={120}><Loader size="sm" aria-label="Loading license" /></Center>}
      {current && 'error' in current && <Text size="sm" c="red">Could not load this license file.</Text>}
      {current && 'text' in current && (
        <ScrollArea h="65vh">
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, margin: 0 }}>{current.text}</pre>
        </ScrollArea>
      )}
    </Modal>
  );
}
