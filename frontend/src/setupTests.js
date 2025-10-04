// File: frontend/src/setupTests.js
// Global test setup for Vitest:
// - Adds matchers from @testing-library/jest-dom
// - Provides fetch mocks (including /protected, /events, /entrants, and /api/analytics/*)
// - Adds helpers for entrants
// - Swallows noisy console logs/warnings/errors during tests

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Use Vite-style env variable
process.env.VITE_API_URL = "http://localhost:3001";

// Default fetch mock: include analytics + /protected + /events success
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    // Protected route
    if (url.includes("/protected")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: "Hello testuser!" }),
      });
    }

    // Events
    if (url.includes("/events")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }

    // Entrants
    if (url.includes("/entrants")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }

    // ---- Analytics API mocks ----
    if (url.includes("/api/analytics/heroes")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          heroes: [
            { hero_name: "Superman", usage_count: 12, win_rate: 0.75 },
            { hero_name: "Batman", usage_count: 10, win_rate: 0.68 },
            { hero_name: "Wonder Woman", usage_count: 8, win_rate: 0.6 },
            { hero_name: "Spiderman", usage_count: 7, win_rate: 0.55 },
          ],
        }),
      });
    }

    if (url.includes("/api/analytics/results")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          events: [
            { name: "Hero Cup", matches: 10, completed: 8 },
            { name: "Villain Showdown", matches: 12, completed: 11 },
          ],
        }),
      });
    }

    if (url.includes("/api/analytics/usage")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          participation: [
            { event_name: "Hero Cup", participants: 16 },
            { event_name: "Villain Showdown", participants: 12 },
          ],
        }),
      });
    }

    // Fallback generic success
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
