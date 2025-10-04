// File: frontend/src/setupTests.js
// Global test setup for Vitest:
// - Adds matchers from @testing-library/jest-dom
// - Provides fetch mocks (default includes /protected + /events success)
// - Adds helpers for entrants
// - Swallows noisy console logs/warnings/errors during tests

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Use Vite-style env variable
process.env.VITE_API_URL = "http://localhost:3001";

// Default fetch mock: include /protected + /events success
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes("/protected")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: "Hello testuser!" }),
      });
    }
    if (url.includes("/events")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }
    if (url.includes("/entrants")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }
    // fallback generic success
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
});

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ----------------
// Mock Data Helpers
// ----------------

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

/**
 * Mocks a successful entrant fetch from /entrants
 * Example:
 * mockFetchEntrant({ id: 101, user: { username: "player1" } });
 */
export function mockFetchEntrant(overrides = {}) {
  const defaultEntrant = {
    id: 101,
    event: {
      id: 7,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrant_count: 16,
    },
    hero: {
      id: 2,
      name: "Superman",
      full_name: "Clark Kent",
      alias: "Man of Steel",
      proxy_image: "/img/superman.png",
    },
    user: {
      id: 1,
      username: "player1",
    },
    matches: [],
  };

  const entrant = { ...defaultEntrant, ...overrides };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => entrant,
  });

  return entrant;
}

// ----------------
// Console Swallows
// ----------------

const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  if (process.env.NODE_ENV === "test") {
    console.error = (...args) => {
      if (/not wrapped in act/.test(args[0])) return;
      if (/MUI: The prop `xs` of `Grid` is deprecated/.test(args[0])) return;
      if (/React Router Future Flag Warning/.test(args[0])) return;
      return;
    };

    console.warn = (...args) => {
      if (/React Router Future Flag Warning/.test(args[0])) return;
      if (/MUI:/.test(args[0])) return;
      return;
    };

    console.log = () => {
      return;
    };
  }
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});
