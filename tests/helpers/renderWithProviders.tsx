import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  // env="test" disables Mantine transitions. Otherwise a Transition's setTimeout can fire
  // after the test file finishes and jsdom is torn down ("window is not defined"), which
  // vitest reports as an unhandled error and fails the whole run.
  return <MantineProvider env="test">{children}</MantineProvider>;
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Wrapper, ...options });
}
