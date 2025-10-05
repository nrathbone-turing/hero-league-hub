// File: frontend/src/__tests__/Events.test.jsx
// Purpose: Stable unit tests for <Events /> list rendering.
// Notes:
// - Uses local vi.mock to avoid race conditions from global fixtures.
// - Covers: (1) Empty array → "No events found"
//            (2) Published data → table renders & filters correctly.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Events from "../components/Events";
import * as api from "../api";

// Mock the API used by the component
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
}));

const { apiFetch } = await import("../api");

afterEach(() => {
  vi.clearAllMocks();
});

describe("<Events /> rendering", () => {
  test("shows 'No events found' when API returns an empty array", async () => {
    apiFetch.mockResolvedValueOnce([]);

    renderWithRouter(<Events />);

    const empty = await screen.findByTestId("no-events");
    expect(empty).toHaveTextContent(/no events found/i);
  });

  test("renders table with default 'published' filter selected", async () => {
    apiFetch.mockResolvedValueOnce([
      { id: 1, name: "Hero Con", date: "2025-10-10", status: "published", entrants: [] },
      { id: 2, name: "Villain Expo", date: "2025-10-11", status: "completed", entrants: [] },
    ]);

    renderWithRouter(<Events />);

    // Wait for the events table to appear
    const table = await screen.findByTestId("events-table");
    expect(table).toBeInTheDocument();

    // Verify only published events render
    const heroEvent = await screen.findByTestId("event-name-1");
    expect(heroEvent).toHaveTextContent("Hero Con");

    const villainEvent = screen.queryByTestId("event-name-2");
    expect(villainEvent).not.toBeInTheDocument();

    // ✅ Verify the <Select> filter value is "published"
    const select = screen.getByTestId("status-filter");
    expect(select.querySelector("input")?.value).toBe("published");

    // Ensure "No events" message is not shown
    expect(screen.queryByTestId("no-events")).not.toBeInTheDocument();
  });

  // Promise-driven tests (safe async handling)
  describe("<Events /> (promise-driven)", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    test("shows loading state during fetch", async () => {
      let resolvePromise;
      api.apiFetch.mockReturnValue(new Promise((res) => (resolvePromise = res)));

      renderWithRouter(<Events />);

      // Spinner shows first
      expect(await screen.findByTestId("loading-events")).toBeInTheDocument();

      // Resolve API
      resolvePromise?.([
        { id: 1, name: "Hero Con", date: "2025-10-10", status: "published", entrants: [] },
      ]);

      // Wait for table
      await waitFor(() => {
        expect(screen.getByTestId("events-table")).toBeInTheDocument();
      });
    });

  test("renders events after successful fetch (default filter = published)", async () => {
    apiFetch.mockResolvedValueOnce([
      { id: 1, name: "Hero Con", date: "2025-10-10", status: "published", entrants: [] },
      { id: 2, name: "Villain Expo", date: "2025-10-11", status: "completed", entrants: [] },
    ]);

    renderWithRouter(<Events />);

    // Wait for the table to render
    const table = await screen.findByTestId("events-table");
    expect(table).toBeInTheDocument();

    // First event (published) should render
    const heroEvent = await screen.findByTestId("event-name-1");
    expect(heroEvent).toHaveTextContent("Hero Con");

    // Second event (completed) should be hidden with the default "published" filter
    expect(screen.queryByTestId("event-name-2")).not.toBeInTheDocument();

    // Assert the Select's hidden input value is "published"
    const select = screen.getByTestId("status-filter");
    expect(select.querySelector("input")?.value).toBe("published");

    // No empty state
    expect(screen.queryByTestId("no-events")).not.toBeInTheDocument();
  });

  test("shows error message when API fails", async () => {
      api.apiFetch.mockRejectedValueOnce(new Error("Server exploded"));

      renderWithRouter(<Events />);

      const error = await screen.findByTestId("error-alert");
      expect(error).toHaveTextContent(/failed to fetch events/i);
    });
  });




});
