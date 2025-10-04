// File: frontend/src/__tests__/EventDetail.test.jsx
// Purpose: Tests EventDetail with Entrants + Matches.
// Notes:
// - Uses shared renderWithRouter to ensure AuthProvider + Router are included.
// - Covers rendering, CRUD flows, edge cases, and redirect behavior.

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventDetail from "../components/EventDetail";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess } from "../setupTests";
import { useLocation, Routes, Route } from "react-router-dom";
import App from "../App";

function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

beforeEach(() => {
  localStorage.setItem("token", "fake-jwt-token"); // bypass ProtectedRoute
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe("EventDetail", () => {
  test("renders event name and date", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    expect(await screen.findByText(/Hero Cup/)).toBeInTheDocument();
    expect(await screen.findByText(/2025-09-12/)).toBeInTheDocument();
  });

  test("renders entrants list", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [
        { id: 1, name: "Spiderman", alias: "Webslinger" },
        { id: 2, name: "Batman", alias: "Dark Knight" },
      ],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    expect(await screen.findByText(/Spiderman/)).toBeInTheDocument();
    expect(await screen.findByText(/Batman/)).toBeInTheDocument();
  });

  test("adds and removes entrant", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [],
      matches: [],
    });
    mockFetchSuccess({ id: 3, name: "Ironman", alias: "Tony", event_id: 1 });
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [{ id: 3, name: "Ironman", alias: "Tony" }],
      matches: [],
    });
    mockFetchSuccess({}); // DELETE /entrants/3
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    await userEvent.type(await screen.findByLabelText(/name/i), "Ironman");
    await userEvent.type(screen.getByLabelText(/alias/i), "Tony");
    await userEvent.click(screen.getByRole("button", { name: /add entrant/i }));

    // Added entrant is visible
    await screen.findByText(/Ironman/);

    // Remove via the Entrant ID form in the left panel
    const idInput = await screen.findByLabelText(/entrant id/i);
    await userEvent.clear(idInput);
    await userEvent.type(idInput, "3");
    await userEvent.click(
      screen.getByRole("button", { name: /remove entrant/i }),
    );

    await waitFor(() =>
      expect(screen.queryByText(/Ironman/)).not.toBeInTheDocument(),
    );
  });

  test("renders match winner by entrant id", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [
        { id: 1, name: "Spiderman", alias: "Webslinger" },
        { id: 2, name: "Batman", alias: "Dark Knight" },
      ],
      matches: [{ id: 10, round: 1, scores: "2-1", winner_id: 2 }],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const scoreCell = await screen.findByText("2-1");
    const row = scoreCell.closest("tr");
    expect(row).toBeTruthy();

    // Winner cell shows `2` (entrant ID)
    expect(within(row).getByText("2")).toBeInTheDocument();
  });

  test("updates event status via dropdown", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "drafting",
      entrants: [],
      matches: [],
    });
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const statusSelect = await screen.findByLabelText(/status/i);
    await userEvent.click(statusSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /published/i }),
    );
    await waitFor(() => expect(statusSelect).toHaveTextContent(/published/i));
  });

  test("renders dropped entrant as placeholder", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [
        { id: 5, name: "Dropped", alias: null, event_id: 1, dropped: true },
      ],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    expect(await screen.findByText(/Dropped/)).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument(); // alias column shows dash
  });
});

describe("EventDetail - edge cases", () => {
  test("remove entrant failure shows alert", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: "Hero Cup",
          entrants: [{ id: 5, name: "Thor", alias: "Odinson" }],
          matches: [],
        }),
      })
      .mockResolvedValueOnce({ ok: false }); // DELETE /entrants/5 fails

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const idInput = await screen.findByLabelText(/entrant id/i);
    await userEvent.type(idInput, "5");
    await userEvent.click(
      screen.getByRole("button", { name: /remove entrant/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to remove entrant/i,
    );
  });

  test("status update failure reverts value", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: "Hero Cup",
          status: "drafting",
          entrants: [],
          matches: [],
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const statusSelect = await screen.findByLabelText(/status/i);
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByRole("option", { name: /published/i }));
    await waitFor(() => expect(statusSelect).toHaveTextContent(/drafting/i));
  });

  test("renders TBD when winner_id is null", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: "Hero Cup",
        entrants: [{ id: 1, name: "Spidey", alias: "Webhead" }],
        matches: [{ id: 101, round: 1, scores: "1-1", winner_id: null }],
      }),
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    expect(await screen.findByText(/tbd/i)).toBeInTheDocument();
  });
});

describe("EventDetail redirects", () => {
  test("navigates to /404 on 404 response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

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
      expect(screen.getByTestId("location").textContent).toBe("/404"),
    );
  });

  test("navigates to /500 on 500 response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

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
      expect(screen.getByTestId("location").textContent).toBe("/500"),
    );
  });
});
