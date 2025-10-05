// File: frontend/src/__tests__/Events.test.jsx
// Purpose: UI verification for <Events /> component using fixture data.
// Context: Core filtering/sorting logic lives in utils/eventFilters.js (tested separately).
// This file ensures proper UI state transitions — loading, empty, toggle + filter interactions,
// and disabled/enabled button behavior.
//
// Notes:
// - Uses fixture-based mocks (no string matching).
// - Focuses on UI wiring, not internal filter logic.
// - Ensures consistent behavior between MUI Select, Switch, and Table render states.

import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Events from "../components/Events";
import { mockFetchSuccess } from "../setupTests";

// ---------- Fixtures ----------
const FIXTURE_CANCELLED_ONLY = [
  { id: 999, name: "Test Cancelled", date: "2025-01-01", status: "cancelled", entrants: [] },
];

const FIXTURE_MIXED = [
  { id: 1, name: "Published Event", date: "2025-09-12", status: "published", entrants: [] },
  { id: 2, name: "Completed Event", date: "2025-09-13", status: "completed", entrants: [] },
  { id: 3, name: "Cancelled Event", date: "2025-09-14", status: "cancelled", entrants: [] },
];

// ---------- Helpers ----------
async function setStatusFilter(value) {
  const select = await screen.findByTestId("status-filter");
  await userEvent.click(select);
  const options = await screen.findAllByRole("option");
  const target = options.find((opt) => opt.getAttribute("data-value") === value);
  if (!target) throw new Error(`Missing <option data-value="${value}">`);
  await userEvent.click(target);
}

function getVisibleTable() {
  const tables = screen.getAllByRole("table");
  return tables.find((t) => !t.getAttribute("aria-hidden")) ?? tables[0];
}

// ---------- Tests ----------

describe("<Events /> (UI behavior only)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test("shows no events initially for cancelled-only data, then reveals cancelled when toggled", async () => {
    mockFetchSuccess(FIXTURE_CANCELLED_ONLY);
    renderWithRouter(<Events />);

    // Expect the empty state first (cancelled hidden by default)
    const empty = await screen.findByTestId("no-events");
    expect(empty).toBeInTheDocument();

    // Switch filter to 'all' and enable cancelled visibility
    await setStatusFilter("all");
    await userEvent.click(screen.getByTestId("cancelled-toggle"));

    // Table should now render
    const table = await screen.findByTestId("events-table");
    expect(table).toBeInTheDocument();

    // Verify the cancelled event is rendered
    const cancelledRow = within(table).getByTestId("event-name-999");
    expect(cancelledRow).toBeInTheDocument();
  });

  test("renders mixed events and disables Register for non-published", async () => {
    mockFetchSuccess(FIXTURE_MIXED);
    renderWithRouter(<Events />);

    // Reveal all + include cancelled
    await setStatusFilter("all");
    await userEvent.click(screen.getByTestId("cancelled-toggle"));

    const table = await screen.findByTestId("events-table");
    const registerButtons = within(getVisibleTable()).getAllByTestId("register-btn");

    // Separate by state
    const disabled = registerButtons.filter((btn) => btn.disabled);
    const enabled = registerButtons.filter((btn) => !btn.disabled);

    expect(disabled.length).toBeGreaterThan(0);
    expect(enabled.length).toBeGreaterThan(0);
  });

  test("handles API error gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Error"));
    renderWithRouter(<Events />);

    const alert = await screen.findByTestId("error-alert");
    expect(alert).toHaveTextContent(/failed to fetch events/i);
  });

  test("shows loading spinner before data resolves", async () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // never resolves
    renderWithRouter(<Events />);
    const spinner = await screen.findByTestId("loading-events");
    expect(spinner).toBeInTheDocument();
  });
});
