// File: frontend/src/__tests__/Heroes.test.jsx
// Purpose: Stable tests for Heroes component (search + pagination).
// Notes:
// - Uses MUI Table + TablePagination (so queries must look for displayedRows + icon buttons).
// - Empty state only shows when search is non-empty and results are empty.
// - Pagination tests now assume rowsPerPage=25 by default and mock totals large enough to enable Next.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Heroes from "../components/Heroes";
import * as api from "../api";

vi.mock("../api");

// Default mirrors component expectations but empty
const defaultEmpty = { results: [], page: 1, per_page: 25, total: 0, total_pages: 1 };

describe("Heroes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

    await waitFor(() => expect(screen.getByText(/Batman/)).toBeInTheDocument());
  });
});

describe("Heroes - Pagination", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.apiFetch.mockResolvedValue(defaultEmpty);
  });

  test("renders pagination controls when multiple pages", async () => {
    // With rowsPerPage=25, make total large enough to enable Next
    api.apiFetch.mockResolvedValue({
      results: [{ id: 1, name: "Superman" }],
      page: 1,
      per_page: 25,
      total: 60,        // > 25 so multiple pages
      total_pages: 3,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    // Check the displayed rows element (dash may vary)
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
    // Mock backend pagination: per_page=25, total=60, two pages we care about
    api.apiFetch.mockImplementation((url) => {
      const qs = url.split("?")[1] || "";
      const params = new URLSearchParams(qs);
      const q = params.get("search");
      const p = Number(params.get("page") || "1");
      const per = Number(params.get("per_page") || "25");

      if (q === "Superman" && p === 1) {
        return Promise.resolve({
          results: [{ id: 1, name: "Superman" }],
          page: 1,
          per_page: per,
          total: 60,
          total_pages: Math.ceil(60 / per),
        });
      }
      if (q === "Superman" && p === 2) {
        return Promise.resolve({
          results: [{ id: 2, name: "Batman" }],
          page: 2,
          per_page: per,
          total: 60,
          total_pages: Math.ceil(60 / per),
        });
      }
      return Promise.resolve(defaultEmpty);
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    await waitFor(() => expect(screen.getByText(/Superman/)).toBeInTheDocument());

    // Next → page 2 (should be enabled because total > rowsPerPage)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /go to next page/i })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: /go to next page/i }));
    await waitFor(() => expect(screen.getByText(/Batman/)).toBeInTheDocument());

    // Previous → back to page 1
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /go to previous page/i })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: /go to previous page/i }));
    await waitFor(() => expect(screen.getByText(/Superman/)).toBeInTheDocument());
  });
});
