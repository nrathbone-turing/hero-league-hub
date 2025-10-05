// File: frontend/src/setupTests.js
// Purpose: Global setup for Vitest + React Testing Library.
// Provides:
// - jest-dom matchers
// - global fetch mock baseline (except for api.test.jsx)
// - optional helpers for mock success/failure
// - jsdom + MUI click fixes
// - console noise suppression

import "@testing-library/jest-dom";
import { vi } from "vitest";

// --------------------------------------
// Detect current test file path
// --------------------------------------
const currentTestFile = process.env.VITEST_TEST_PATH || "";

// --------------------------------------
// Environment
// --------------------------------------
process.env.VITE_API_URL = "http://localhost:3001";

// --------------------------------------
// Conditional Global Fetch Mock
// Skip if this is the direct API test suite
// --------------------------------------
if (!/src\/__tests__\/api\.test\.jsx?$/.test(currentTestFile)) {
  beforeEach(() => {
    global.fetch = vi.fn((url) =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
}

// --------------------------------------
// Conditional API Mocks for Non-API Tests
// --------------------------------------
if (!/src\/__tests__\/api\.test\.jsx?$/.test(currentTestFile)) {
  vi.mock("./api", () => ({
    apiFetch: vi.fn(),
    deleteEntrant: vi.fn(),
  }));
}

// --------------------------------------
// Optional Helpers (exported for tests)
// --------------------------------------
export function mockFetchSuccess(data = []) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
}

export function mockFetchFailure(error = { error: "API Error" }) {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => error,
  });
}

// --------------------------------------
// jsdom & MUI Fixes
// --------------------------------------
window.HTMLElement.prototype.click = function () {
  const event = new MouseEvent("click", { bubbles: true });
  this.dispatchEvent(event);
};

// --------------------------------------
// Console Noise Suppression
// --------------------------------------
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  if (process.env.NODE_ENV === "test") {
    console.error = (...args) => {
      if (/not wrapped in act/i.test(args[0])) return;
      if (/MUI:/.test(args[0])) return;
      if (/React Router Future Flag Warning/i.test(args[0])) return;
    };
    console.warn = (...args) => {
      if (/MUI:/.test(args[0])) return;
      if (/React Router Future Flag Warning/i.test(args[0])) return;
    };
    console.log = () => {};
  }
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});
