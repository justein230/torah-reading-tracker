import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
// Fonts are bundled rather than loaded from Google Fonts, so the app makes no network request on startup.
// Same weights the old Google Fonts URL requested; their OFL license text reaches THIRD_PARTY_LICENSES.md
// through the normal npm license scan (docs/LICENSES.md).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-hebrew/400.css';
import '@fontsource/noto-sans-hebrew/600.css';

import './global.css';
import { theme } from './theme.js';
import { AppProvider } from './context/AppContext.js';
import App from './App.js';

createRoot(document.getElementById('root')!).render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    {/* Top-center and larger than Mantine's default (small, bottom-right): on a phone the
        default was barely readable and sat down by the bottom nav. Styles: .app-notifications
        in global.css. */}
    <Notifications position="top-center" containerWidth={480} autoClose={5000} className="app-notifications" />
    <ModalsProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ModalsProvider>
  </MantineProvider>
);
