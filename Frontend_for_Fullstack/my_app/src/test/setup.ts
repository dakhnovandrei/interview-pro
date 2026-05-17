import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'alert', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true
});
