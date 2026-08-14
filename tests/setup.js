import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Explicitly unmount rendered trees after each test. Auto-cleanup normally handles
// this, but making it explicit guarantees the DOM is cleared regardless of the pool
// in use (see the pool note in vite.config.js).
afterEach(() => cleanup());

globalThis.ResizeObserver = class ResizeObserver {
  observe() { /* stub */ }
  unobserve() { /* stub */ }
  disconnect() { /* stub */ }
};

globalThis.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
