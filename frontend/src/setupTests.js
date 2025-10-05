// File: frontend/src/setupTests.js
// Purpose: Global test setup for Vitest and React Testing Library.
// Includes:
// - jest-dom matchers
// - consistent global fetch mocks (for /events, /entrants, /protected, /api/analytics/*)
// - helpers for mocking success/failure states
// - dynamic /events response support for multiple renders
// - jsdom fixes for MUI Switch click bubbling
// - suppression of noisy console output during tests

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Use Vite-style env variable
process.env.VITE_API_URL = "http://localhost:3001";

// -----------------------------
// Dynamic /events response setup
// -----------------------------
let defaultEventsResponse = [];

/**
 * Updates the default mock response for `/events` requests.
 * Persists across renders (helps with React StrictMode double-fetch).
 */
export function setMockEventsResponse(data) {
  defaultEventsResponse = data;
}

// -----------------------------
// Global fetch mock
// -----------------------------
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    // Protected route
    if (url.includes("/protected")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: "Hello testuser!" }),
      });
    }

    // Events (dynamic mock)
    if (url.includes("/events")) {
      return Promise.resolve({
        ok: true,
        json: async () => defaultEventsResponse,
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
  defaultEventsResponse = []; // reset between tests
});

// ----------------
// Mock Data Helpers
// ----------------

export const mockEventsList = [
  { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
  { id: 2, name: "Villain Showdown", date: "2025-09-13", status: "cancelled" },
  { id: 3, name: "Shadow Games", date: "2025-09-14", status: "completed" },
];

/**
 * Overrides fetch mock with a successful `/events` response.
 * Automatically syncs with dynamic defaultEventsResponse.
 */
export function mockFetchSuccess(data = mockEventsList) {
  setMockEventsResponse(data);
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
}

/**
 * Overrides fetch mock with a failure state for `/events`.
 */
export function mockFetchFailure(error = { error: "API Error" }) {
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => error });
}

/**
 * Mocks a successful entrant fetch from /entrants
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

// -----------------------------
// jsdom & MUI Event Fixes
// -----------------------------

// Fix MUI Switch click bubbling in jsdom (ensures userEvent.click works)
window.HTMLElement.prototype.click = function () {
  const event = new MouseEvent("click", { bubbles: true });
  this.dispatchEvent(event);
};

// -----------------------------
// Console Noise Suppression
// -----------------------------
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

// ----------------
// Event Fixtures
// ----------------

export const mockEventListMixed = [
  {
    id: 1,
    name: "Hero Cup",
    date: "2025-09-12",
    status: "published",
    entrants: Array(3).fill({}),
  },
  {
    id: 2,
    name: "Villain Showdown",
    date: "2025-09-13",
    status: "completed",
    entrants: Array(5).fill({}),
  },
  {
    id: 3,
    name: "Cancelled Cup",
    date: "2025-09-14",
    status: "cancelled",
    entrants: Array(2).fill({}),
  },
  {
    id: 4,
    name: "Draft Event",
    date: "2025-09-15",
    status: "drafting",
    entrants: [],
  },
];
