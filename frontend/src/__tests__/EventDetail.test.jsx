// File: frontend/src/__tests__/EventDetail.test.jsx
// Purpose: Robust EventDetail tests using structural queries (no fragile text matching).
// Notes:
// - Uses data-testid attributes for stability with MUI rendering.
// - Tests cover rendering, CRUD actions, edge cases, and redirect behavior.

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
  localStorage.setItem("token", "fake-jwt-token");
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe("EventDetail", () => {
  test("renders event header with name and date", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    // Wait explicitly until loading spinner disappears
    await waitFor(() => {
      expect(screen.queryByText(/Loading event/i)).not.toBeInTheDocument();
    });

    const headings = await screen.findAllByRole("heading");
    const headerText = headings.map((h) => h.textContent).join(" ");
    expect(headerText).toContain("Hero Cup");
    expect(headerText).toContain("2025-09-12");
  });

  test("renders entrants table and lists entrant rows", async () => {
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

    const entrantsTable = await screen.findByTestId("entrants-table");
    const rows = within(entrantsTable).getAllByRole("row");
    const text = rows.map((r) => r.textContent).join(" ");
    expect(text).toContain("Spiderman");
    expect(text).toContain("Batman");
  });

  test("adds and removes entrant successfully", async () => {
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
    mockFetchSuccess({}); // DELETE success
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

    const entrantsTable = await screen.findByTestId("entrants-table");
    await waitFor(() =>
      expect(within(entrantsTable).getByText("Ironman")).toBeInTheDocument()
    );

    const idInput = await screen.findByLabelText(/entrant id/i);
    await userEvent.clear(idInput);
    await userEvent.type(idInput, "3");
    await userEvent.click(screen.getByRole("button", { name: /remove entrant/i }));

    await waitFor(() =>
      expect(within(entrantsTable).queryByText("Ironman")).not.toBeInTheDocument()
    );
  });

  test("renders match table with winner name and alias", async () => {
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
          winner_id: 2,
          winner: { id: 2, name: "Batman", hero: { name: "Dark Knight" } },
        },
      ],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const matchTable = await screen.findByTestId("matches-table");
    const rows = within(matchTable).getAllByRole("row");
    const rowText = rows.map((r) => r.textContent).join(" ");
    expect(rowText).toMatch(/Batman/);
    expect(rowText).toMatch(/Dark Knight/);
  });

  test("shows status select with correct initial value", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "drafting",
      entrants: [],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });
    const select = await screen.findByTestId("status-select");
    expect(select).toHaveValue("drafting");
  });

  test("renders dropped entrant row as placeholder", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [{ id: 5, name: "Dropped", alias: null, dropped: true }],
      matches: [],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const entrantsTable = await screen.findByTestId("entrants-table");
    const rows = within(entrantsTable).getAllByRole("row");
    const droppedRow = rows.find((r) => r.textContent.includes("Dropped"));
    expect(droppedRow).toBeTruthy();
    expect(droppedRow.textContent).toContain("-");
  });
});

describe("EventDetail - edge cases", () => {
  test("remove entrant failure triggers alert", async () => {
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
      .mockResolvedValueOnce({ ok: false });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const idInput = await screen.findByLabelText(/entrant id/i);
    await userEvent.type(idInput, "5");
    await userEvent.click(screen.getByRole("button", { name: /remove entrant/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to remove entrant/i
    );
  });

  test("status update failure reverts select to previous value", async () => {
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

    const select = await screen.findByRole("combobox");
    await userEvent.click(select);
    await userEvent.click(screen.getByRole("option", { name: /published/i }));

    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveTextContent(/drafting/i)
    );
  });

  test("renders TBD when match winner is null", async () => {
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      entrants: [{ id: 1, name: "Spidey", alias: "Webhead" }],
      matches: [{ id: 101, round: 1, scores: "1-1", winner_id: null }],
    });

    renderWithRouter(<EventDetail />, { route: "/events/1" });

    const matchTable = await screen.findByTestId("matches-table");
    const rows = within(matchTable).getAllByRole("row");
    const tbdRow = rows.find((r) => /tbd/i.test(r.textContent));
    expect(tbdRow).toBeTruthy();
  });
});

describe("EventDetail redirects", () => {
  test("redirects to /404 on 404 response", async () => {
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
      expect(screen.getByTestId("location").textContent).toBe("/404")
    );
  });

  test("redirects to /500 on 500 response", async () => {
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
      expect(screen.getByTestId("location").textContent).toBe("/500")
    );
  });
});
