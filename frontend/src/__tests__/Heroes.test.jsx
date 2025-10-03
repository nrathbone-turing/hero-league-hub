// File: frontend/src/__tests__/Heroes.test.jsx
// Purpose: Stable tests for Heroes component (search + pagination + dialog interactions).
// Notes:
// - Avoid fragile string matching; prefer roles, test ids, or localStorage side-effects.
// - Covers search, loading, error, empty state, pagination, sorting, dialog details, and hero selection.

import { screen, waitFor, within } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Heroes from "../components/Heroes";
import * as api from "../api";

vi.mock("../api");

const defaultEmpty = { results: [], page: 1, per_page: 25, total: 0, total_pages: 1 };

describe("Heroes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    api.apiFetch.mockResolvedValue(defaultEmpty);
  });

  test("renders heading", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByTestId("heroes-heading")).toBeInTheDocument();
  });

  test("does not fetch on mount with empty search", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    await waitFor(() => {});
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  test("shows loading state when fetching", async () => {
    let resolvePromise;
    api.apiFetch.mockReturnValue(new Promise((res) => (resolvePromise = res)));

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "LoadingTest", { allAtOnce: true });

    expect(await screen.findByText(/loading heroes/i)).toBeInTheDocument();
    resolvePromise?.(defaultEmpty);

    await waitFor(() =>
      expect(screen.queryByText(/loading heroes/i)).not.toBeInTheDocument(),
    );
  });

  test("shows error when fetch fails", async () => {
    api.apiFetch.mockImplementation(() => Promise.reject(new Error("boom")));

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "WillFail", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to fetch heroes/i),
    );
  });

  test("shows empty state when no heroes found", async () => {
    api.apiFetch.mockResolvedValue(defaultEmpty);

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "UnknownHero", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getByText(/no heroes found/i)).toBeInTheDocument(),
    );
  });

  test("search triggers fetch and displays heroes in table", async () => {
    api.apiFetch.mockResolvedValue({
      results: [{ id: 2, name: "Batman" }],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Batman", { allAtOnce: true });

    expect(await screen.findByText("Batman")).toBeInTheDocument();
  });
});

describe("Heroes - Pagination", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.apiFetch.mockResolvedValue(defaultEmpty);
  });

  test("renders pagination controls when multiple pages", async () => {
    api.apiFetch.mockResolvedValue({
      results: [{ id: 1, name: "Superman" }],
      page: 1,
      per_page: 25,
      total: 60,
      total_pages: 3,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    await waitFor(() =>
      expect(
        screen.getByText((content, node) =>
          node?.classList.contains("MuiTablePagination-displayedRows") &&
          /of 60/.test(content),
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: /go to next page/i })).toBeEnabled();
  });

  test("navigates to next and previous page", async () => {
    api.apiFetch.mockImplementation((url) => {
      const qs = url.split("?")[1] || "";
      const params = new URLSearchParams(qs);
      const p = Number(params.get("page") || "1");
      if (p === 1) {
        return Promise.resolve({
          results: [{ id: 1, name: "Superman" }],
          page: 1,
          per_page: 25,
          total: 60,
          total_pages: 3,
        });
      }
      if (p === 2) {
        return Promise.resolve({
          results: [{ id: 2, name: "Batman" }],
          page: 2,
          per_page: 25,
          total: 60,
          total_pages: 3,
        });
      }
      return Promise.resolve(defaultEmpty);
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    await waitFor(() => expect(screen.getByText("Superman")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /go to next page/i }));
    await waitFor(() => expect(screen.getByText("Batman")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /go to previous page/i }));
    await waitFor(() => expect(screen.getByText("Superman")).toBeInTheDocument());
  });
});

describe("Heroes - Table and Dialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    api.apiFetch.mockResolvedValue(defaultEmpty);
  });

  test("displays hero full_name, alias, and alignment in table", async () => {
    api.apiFetch.mockResolvedValue({
      results: [
        { id: 2, name: "Batman", full_name: "Bruce Wayne", alias: "Dark Knight", alignment: "good" },
      ],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Batman", { allAtOnce: true });

    expect(await screen.findByText("Bruce Wayne")).toBeInTheDocument();
    expect(screen.getByText("Dark Knight")).toBeInTheDocument();
    expect(screen.getByText("good")).toBeInTheDocument();
  });

  test("allows sorting heroes by name", async () => {
    api.apiFetch.mockResolvedValue({
      results: [
        { id: 1, name: "Superman", full_name: "Clark Kent", alias: "Man of Steel", alignment: "good" },
        { id: 2, name: "Batman", full_name: "Bruce Wayne", alias: "Dark Knight", alignment: "good" },
      ],
      page: 1,
      per_page: 25,
      total: 2,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Test", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getAllByRole("row")[1]).toHaveTextContent("Superman"),
    );

    const nameHeader = screen.getByRole("button", { name: /^Name$/i });
    await userEvent.click(nameHeader);

    await waitFor(() =>
      expect(screen.getAllByRole("row")[1]).toHaveTextContent("Batman"),
    );
  });

  test("opens dialog with hero details when row is clicked", async () => {
    api.apiFetch.mockResolvedValue({
      results: [
        {
          id: 2,
          name: "Batman",
          full_name: "Bruce Wayne",
          alias: "Dark Knight",
          alignment: "good",
        },
      ],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });

    // trigger a search to populate the table
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Batman", { allAtOnce: true });

    // click the table row using test id
    const row = await screen.findByTestId("hero-row-2");
    await userEvent.click(row);

    // dialog should open
    const dialog = await screen.findByTestId("hero-dialog");
    expect(dialog).toBeInTheDocument();

    // title should match hero name
    expect(within(dialog).getByTestId("hero-dialog-title")).toHaveTextContent("Batman");

    // alignment should be shown
    expect(within(dialog).getByTestId("hero-alignment")).toHaveTextContent("GOOD");

    // and we should see the Choose Hero button
    expect(within(dialog).getByTestId("choose-hero-btn")).toBeInTheDocument();
  });

  test("closes dialog when ESC pressed", async () => {
    api.apiFetch.mockResolvedValue({
      results: [
        { id: 1, name: "Superman", full_name: "Clark Kent", alias: "Man of Steel", alignment: "good" },
      ],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    await userEvent.click(await screen.findByText("Superman"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  test("shows 'No image available' when hero lacks image", async () => {
    api.apiFetch.mockResolvedValue({
      results: [{ id: 1, name: "Nameless", alignment: "neutral" }],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Nameless", { allAtOnce: true });

    await userEvent.click(await screen.findByText("Nameless"));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText(/No image available/i)).toBeInTheDocument();
  });

  test("dialog displays alignment in uppercase", async () => {
    api.apiFetch.mockResolvedValue({
      results: [{ id: 1, name: "Thor", alignment: "hero" }],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Thor", { allAtOnce: true });

    await userEvent.click(await screen.findByText("Thor"));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("HERO")).toBeInTheDocument();
  });

  test("dialog displays powerstats when present", async () => {
    api.apiFetch.mockResolvedValue({
      results: [
        { id: 1, name: "Flash", alignment: "good", powerstats: { speed: 100, strength: 50 } },
      ],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Flash", { allAtOnce: true });

    await userEvent.click(await screen.findByText("Flash"));
    const dialog = await screen.findByRole("dialog");

    // Scope to Powerstats section (heading role)
    const statsHeading = within(dialog).getByRole("heading", { name: /powerstats/i });
    expect(statsHeading).toBeInTheDocument();

    // Then check for individual stats using label text (strong tags get flattened into text)
    expect(within(dialog).getByText(/Speed/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Strength/i)).toBeInTheDocument();
  });

  test("Choose Hero stores chosenHero in localStorage if no entrant exists", async () => {
    api.apiFetch.mockResolvedValue({
      results: [{ id: 1, name: "Wonder Woman", alignment: "good" }],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Wonder Woman", { allAtOnce: true });

    await userEvent.click(await screen.findByText("Wonder Woman"));
    const dialog = await screen.findByRole("dialog");

    await userEvent.click(within(dialog).getByRole("button", { name: /choose hero/i }));
    const stored = JSON.parse(localStorage.getItem("chosenHero"));
    expect(stored?.name).toBe("Wonder Woman");
  });

  test("Choose Hero replaces hero in entrant if entrant exists", async () => {
    localStorage.setItem(
      "entrant",
      JSON.stringify({ id: 1, event: { name: "Hero Cup" }, hero: { id: 2, name: "Old Hero" } }),
    );

    api.apiFetch.mockResolvedValue({
      results: [{ id: 3, name: "New Hero", alignment: "good" }],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "New Hero", { allAtOnce: true });

    await userEvent.click(await screen.findByText("New Hero"));
    const dialog = await screen.findByRole("dialog");

    // Mock confirm to always return true
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await userEvent.click(within(dialog).getByRole("button", { name: /choose hero/i }));
    const entrant = JSON.parse(localStorage.getItem("entrant"));
    expect(entrant?.hero?.name).toBe("New Hero");
  });

  test("Choose Hero redirects to /dashboard after selection", async () => {
    api.apiFetch.mockResolvedValue({
      results: [{ id: 5, name: "RedirectHero", alignment: "good" }],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });

    renderWithRouter(
      <Routes>
        <Route path="/heroes" element={<Heroes />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
      </Routes>,
      { route: "/heroes" }
    );

    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "RedirectHero", { allAtOnce: true });

    await userEvent.click(await screen.findByText("RedirectHero"));
    const dialog = await screen.findByRole("dialog");

    await userEvent.click(within(dialog).getByRole("button", { name: /choose hero/i }));

    // Assert hero persisted
    const stored = JSON.parse(localStorage.getItem("chosenHero"));
    expect(stored?.name).toBe("RedirectHero");

    // Assert we navigated to dashboard
    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument();
  });

 describe("Heroes - Dialog Accordion Sections", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.apiFetch.mockResolvedValue({
      results: [
        {
          id: 10,
          name: "AccordionHero",
          alignment: "hero",
          biography: {
            "full-name": "Test Name",
            "place-of-birth": "Test City",
            "publisher": "Test Publisher",
          },
          appearance: {
            "eye-color": "Green",
            "hair-color": "Black",
          },
          work: {
            base: "Test Base",
            occupation: "Tester",
          },
          connections: {
            "group-affiliation": "Test Group",
            relatives: "Test Relative",
          },
        },
      ],
      page: 1,
      per_page: 25,
      total: 1,
      total_pages: 1,
    });
  });

  test("renders accordion sections for Biography, Appearance, Work, Connections", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "AccordionHero", { allAtOnce: true });

    await userEvent.click(await screen.findByText("AccordionHero"));
    const dialog = await screen.findByRole("dialog");

    // Verify accordions exist by heading text
    expect(within(dialog).getByText("Biography")).toBeInTheDocument();
    expect(within(dialog).getByText("Appearance")).toBeInTheDocument();
    expect(within(dialog).getByText("Work")).toBeInTheDocument();
    expect(within(dialog).getByText("Connections")).toBeInTheDocument();
  });

  test("accordion shows formatted fields with capitalization", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "AccordionHero", { allAtOnce: true });

    await userEvent.click(await screen.findByText("AccordionHero"));
    const dialog = await screen.findByRole("dialog");

    // Biography section expands by default
    expect(within(dialog).getByText(/Full Name:/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Place Of Birth:/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Publisher:/i)).toBeInTheDocument();
  });

  test("accordion expands Appearance when clicked", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "AccordionHero", { allAtOnce: true });

    await userEvent.click(await screen.findByText("AccordionHero"));
    const dialog = await screen.findByRole("dialog");

    // Click to expand Appearance
    const appearanceHeader = within(dialog).getByText("Appearance");
    await userEvent.click(appearanceHeader);

    expect(within(dialog).getByText(/Eye Color:/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Hair Color:/i)).toBeInTheDocument();
  });
}); 
});
