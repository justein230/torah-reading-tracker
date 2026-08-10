import '@testing-library/react';
import '@testing-library/jest-dom/vitest';

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
