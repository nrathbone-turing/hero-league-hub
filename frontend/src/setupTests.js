// frontend/src/setupTests.js
// Global test setup for Vitest:
// - Adds matchers from @testing-library/jest-dom
// - Provides fetch mocks
// - Swallows noisy console logs/warnings/errors during tests

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Use Vite-style env variable
process.env.VITE_API_URL = "http://localhost:3001";

// Default fetch mock
beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Helpers
export const mockEventsList = [
  { id: 1, name: "Hero Cup", date: "2025-09-12", status: "open" },
  { id: 2, name: "Villain Showdown", date: "2025-09-13", status: "closed" },
];

export function mockFetchSuccess(data = mockEventsList) {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
}

export function mockFetchFailure(error = { error: "API Error" }) {
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => error });
}

// Save originals
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  if (process.env.NODE_ENV === "test") {
    console.error = (...args) => {
      if (/not wrapped in act/.test(args[0])) return;
      if (/MUI: The prop `xs` of `Grid` is deprecated/.test(args[0])) return;
      if (/React Router Future Flag Warning/.test(args[0])) return;
      // swallow ALL other errors
      return;
    };

    console.warn = (...args) => {
      if (/React Router Future Flag Warning/.test(args[0])) return;
      if (/MUI:/.test(args[0])) return;
      // swallow ALL other warnings
      return;
    };

    console.log = () => {
      // swallow ALL logs in tests
      return;
    };
  }
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});
