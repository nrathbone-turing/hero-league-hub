// File: frontend/src/__tests__/Events.test.jsx
// Purpose: Tests for Events component (robust against MUI portal rendering).
// Notes:
// - Uses data-testid and visible state checks instead of fragile role queries.
// - Verifies search filter, cancelled toggle, and button disablement behavior.

import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Events from "../components/Events";
import { mockFetchSuccess } from "../setupTests";

describe("Events component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test("renders heading and placeholders", async () => {
    mockFetchSuccess([]);
    renderWithRouter(<Events />);
    expect(await screen.findByRole("heading", { name: /events/i })).toBeInTheDocument();
    expect(screen.getByTestId("hero-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("villain-placeholder")).toBeInTheDocument();
  });

  test("shows loading spinner initially", async () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // unresolved
    renderWithRouter(<Events />);
    expect(await screen.findByTestId("loading-events")).toBeInTheDocument();
  });

  test("renders table with entrant counts", async () => {
    mockFetchSuccess([
      { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published", entrants: Array(3).fill({}) },
      { id: 2, name: "Villain Showdown", date: "2025-09-13", status: "published", entrants: Array(5).fill({}) },
    ]);
    renderWithRouter(<Events />);
    const table = await screen.findByTestId("events-table");
    expect(table).toBeInTheDocument();
    expect(within(table).getByText("Hero Cup")).toBeInTheDocument();
    expect(within(table).getByText("Villain Showdown")).toBeInTheDocument();
    expect(within(table).getByText(/3 entrants/)).toBeInTheDocument();
    expect(within(table).getByText(/5 entrants/)).toBeInTheDocument();
  });

  test("filters events when typing in search", async () => {
    mockFetchSuccess([
      { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
      { id: 2, name: "Villain Bash", date: "2025-09-13", status: "published" },
    ]);
    renderWithRouter(<Events />);

    const search = await screen.findByTestId("events-search");
    const input = within(search).getByRole("textbox");

    await userEvent.type(input, "Villain");
    await waitFor(() => {
      const table = screen.getByTestId("events-table");
      const rows = within(table).getAllByRole("row");
      // 1 header + 1 filtered event row
      expect(rows.length).toBe(2);
      expect(screen.getByText("Villain Bash")).toBeInTheDocument();
      expect(screen.queryByText("Hero Cup")).not.toBeInTheDocument();
    });
  });

  test("shows empty state when no events found", async () => {
    mockFetchSuccess([]);
    renderWithRouter(<Events />);
    expect(await screen.findByTestId("no-events")).toBeInTheDocument();
  });

  test("shows error message when fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network down"));
    renderWithRouter(<Events />);
    const alert = await screen.findByTestId("error-alert");
    expect(alert).toHaveTextContent(/failed to fetch events/i);
  });

  test("reveals cancelled events when toggle is switched", async () => {
    mockFetchSuccess([{ id: 1, name: "Cancelled Cup", date: "2025-09-12", status: "cancelled" }]);
    renderWithRouter(<Events />);

    // initially hidden
    expect(await screen.findByTestId("no-events")).toBeInTheDocument();

    // toggle the switch using testid (MUI nested roles are inconsistent)
    const toggle = screen.getByTestId("cancelled-toggle");
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText("Cancelled Cup")).toBeInTheDocument();
    });
  });

  test("register button is disabled for non-published events", async () => {
    mockFetchSuccess([
      { id: 1, name: "Completed Cup", date: "2025-09-12", status: "completed", entrants: [] },
    ]);
    renderWithRouter(<Events />);
    const btn = await screen.findByTestId("register-btn");
    expect(btn).toBeDisabled();
  });
});
