// File: frontend/src/__tests__/EventDashboard.test.jsx
// Purpose: Tests for EventDashboard component.
// Notes:
// - Relies on global fetch mock for /events.
// - Covers rendering list, form submission, placeholder images, status spacing, scrollable list, and entrant count.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import EventDashboard from "../components/EventDashboard";
import { mockFetchSuccess } from "../setupTests";

describe("EventDashboard", () => {
  test("renders events heading", async () => {
    mockFetchSuccess();
    renderWithRouter(<EventDashboard />, { route: "/" });
    expect(
      await screen.findByRole("heading", { name: /events/i }),
    ).toBeInTheDocument();
  });

  test("shows entrant counts", async () => {
    mockFetchSuccess([
      {
        id: 1,
        name: "Hero Cup",
        date: "2025-09-12",
        status: "drafting",
        entrants: Array(3).fill({ id: 1, name: "Hero" }),
      },
      {
        id: 2,
        name: "Villain Showdown",
        date: "2025-09-13",
        entrants: Array(5).fill({ id: 2, name: "Villain" }),
      },
    ]);
    renderWithRouter(<EventDashboard />, { route: "/" });
    expect(await screen.findByText(/3 entrants/i)).toBeInTheDocument();
    expect(await screen.findByText(/5 entrants/i)).toBeInTheDocument();
  });

  test("submits new event", async () => {
    mockFetchSuccess([]); // initial GET
    mockFetchSuccess({
      id: 3,
      name: "Test Event",
      date: "2025-09-20",
      status: "drafting",
      entrant_count: 0,
    }); // POST
    mockFetchSuccess([
      {
        id: 3,
        name: "Test Event",
        date: "2025-09-20",
        status: "drafting",
        entrant_count: 0,
      },
    ]); // reload

    renderWithRouter(<EventDashboard />, { route: "/" });
    await userEvent.type(screen.getByLabelText(/name/i), "Test Event");
    await userEvent.type(screen.getByLabelText(/date/i), "2025-09-20");
    await userEvent.click(
      screen.getByRole("button", { name: /create event/i }),
    );

    expect(await screen.findByText(/0 entrants/i)).toBeInTheDocument();
  });
});

describe("EventDashboard - edge cases", () => {
  test("shows placeholder when no events exist", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    renderWithRouter(<EventDashboard />, { route: "/" });
    expect(await screen.findByText(/no events yet/i)).toBeInTheDocument();
  });

  test("prevents event creation with missing fields", async () => {
    renderWithRouter(<EventDashboard />, { route: "/" });
    await userEvent.click(
      screen.getByRole("button", { name: /create event/i }),
    );
    expect(screen.getByRole("form")).toBeInTheDocument();
  });

  test("shows error message when create event fails", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false }) // fetch events
      .mockResolvedValueOnce({ ok: false }); // create event

    renderWithRouter(<EventDashboard />, { route: "/" });
    await userEvent.type(screen.getByLabelText(/event name/i), "Broken Event");
    await userEvent.click(
      screen.getByRole("button", { name: /create event/i }),
    );

    const alerts = await screen.findAllByRole("alert");
    expect(
      alerts.some((el) => /failed to create event/i.test(el.textContent)),
    ).toBe(true);
  });
});
