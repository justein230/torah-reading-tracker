import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import './global.css';
import { theme } from './theme.js';
import { AppProvider } from './context/AppContext.js';
import App from './App.js';

createRoot(document.getElementById('root')!).render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    <ModalsProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ModalsProvider>
  </MantineProvider>
);
