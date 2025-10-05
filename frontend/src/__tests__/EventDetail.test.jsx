// File: frontend/src/__tests__/EventDetail.test.jsx
// Purpose: Player-facing EventDetail tests for rendering, registration state, and tables.
// Notes:
// - Uses only data-testid queries for stability.
// - Reflects new player/entrant layout with Register + Withdraw buttons.

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import EventDetail from "../components/EventDetail";
import { mockFetchSuccess } from "../setupTests";
import { Routes, Route, useLocation } from "react-router-dom";
import App from "../App";

function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

beforeEach(() => {
  localStorage.setItem("token", "fake-jwt");
  localStorage.setItem("user", JSON.stringify({ id: 1, username: "nick" }));
  vi.resetAllMocks();
});

describe("<EventDetail /> rendering", () => {
  test("renders event header, date, and status", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-10-10",
      status: "published",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    expect(await screen.findByTestId("event-header")).toHaveTextContent("Hero Cup");
    expect(await screen.findByTestId("event-status")).toHaveTextContent("published");
  });

  test("shows loading spinner then tables", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    expect(await screen.findByTestId("event-detail-loading")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByTestId("event-detail-loading")).not.toBeInTheDocument()
    );
  });

  test("renders entrants and matches tables", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [
        { id: 1, name: "Spiderman", alias: "Webslinger" },
        { id: 2, name: "Batman", alias: "Dark Knight" },
      ],
      matches: [
        {
          id: 10,
          round: 1,
          scores: "2-1",
          winner: { id: 2, name: "Batman", hero: { name: "Dark Knight" } },
        },
      ],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const entrants = await screen.findByTestId("entrants-table");
    expect(within(entrants).getByText("Spiderman")).toBeInTheDocument();

    const matches = await screen.findByTestId("matches-table");
    const rows = within(matches).getAllByRole("row");
    const text = rows.map((r) => r.textContent).join(" ");
    expect(text).toContain("Batman");
    expect(text).toContain("Dark Knight");
  });
});

describe("<EventDetail /> player registration panel", () => {
  test("shows 'Register Now' when user not registered", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    expect(await screen.findByTestId("register-now-btn")).toBeInTheDocument();
  });

  test("shows player record and withdraw/refresh when registered", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      entrants: [{ id: 5, user_id: 1, name: "Nick", hero: { name: "Spiderman" } }],
      matches: [
        {
          id: 1,
          entrant1_id: 5,
          entrant2_id: 7,
          winner_id: 5,
          entrant1: { id: 5, name: "Nick" },
          entrant2: { id: 7, name: "Clark" },
          winner: { id: 5, name: "Nick" },
        },
      ],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    expect(await screen.findByTestId("record")).toHaveTextContent("1-0");
    expect(await screen.findByTestId("refresh-btn")).toBeInTheDocument();
  });
});

describe("<EventDetail /> edge cases & redirects", () => {
  test("renders TBD when winner missing", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      entrants: [{ id: 1, name: "Spidey" }],
      matches: [{ id: 101, round: 1, scores: "1-1", winner_id: null }],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    const matches = await screen.findByTestId("matches-table");
    expect(within(matches).getByText(/tbd/i)).toBeInTheDocument();
  });

  test("redirects to /404 on not found", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("404 Not Found"));
    renderWithRouter(
      <>
        <App />
        <Routes>
          <Route path="*" element={<LocationSpy />} />
        </Routes>
      </>,
      { route: "/events/404" }
    );
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/404")
    );
  });

  test("redirects to /500 on server error", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("500 Internal Server Error"));
    renderWithRouter(
      <>
        <App />
        <Routes>
          <Route path="*" element={<LocationSpy />} />
        </Routes>
      </>,
      { route: "/events/500" }
    );
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/500")
    );
  });
});
