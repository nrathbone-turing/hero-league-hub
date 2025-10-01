// File: frontend/src/__tests__/Heroes.test.jsx
// Purpose: Stable tests for Heroes component that account for StrictMode double-effects.
// Notes:
// - apiFetch is mocked with defaults so any duplicate/eager calls won't crash the component.
// - Empty state only shows when search is non-empty and results are empty.
// - Pagination tests key off the "page" query param.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Heroes from "../components/Heroes";
import * as api from "../api";

vi.mock("../api");

const defaultEmpty = { results: [], totalPages: 1 };

describe("Heroes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: resolve to empty so any unexpected/duplicate calls don't throw
    api.apiFetch.mockResolvedValue(defaultEmpty);
  });

  test("renders heading", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByTestId("heroes-heading")).toBeInTheDocument();
  });

  test("does not fetch on mount with empty search", async () => {
    renderWithRouter(<Heroes />, { route: "/heroes" });
    // give React a tick
    await waitFor(() => {});
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  test("shows loading state when fetching", async () => {
    // return a promise that we resolve after asserting loading
    let resolvePromise;
    api.apiFetch.mockReturnValue(
      new Promise((res) => {
        resolvePromise = res;
      }),
    );

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
    // Reject ALL calls in this test (StrictMode + double effect safe)
    api.apiFetch.mockImplementation(() => Promise.reject(new Error("boom")));

    renderWithRouter(<Heroes />, { route: "/heroes" });

    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "WillFail", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to fetch heroes/i),
    );
  });

  test("shows empty state when no heroes found", async () => {
    // Ensure every call during this test resolves to empty to avoid StrictMode flakiness
    api.apiFetch.mockResolvedValue(defaultEmpty);

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "UnknownHero", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getByText(/no heroes found/i)).toBeInTheDocument(),
    );
  });

  test("search triggers fetch and displays heroes", async () => {
    api.apiFetch.mockImplementation((url) => {
      const qs = url.split("?")[1] || "";
      const params = new URLSearchParams(qs);
      const q = params.get("search");

      if (q === "Batman") {
        return Promise.resolve({
          results: [{ id: 2, name: "Batman", powerstats: { intelligence: 100 } }],
          totalPages: 1,
        });
      }
      return Promise.resolve(defaultEmpty);
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Batman", { allAtOnce: true });

    await waitFor(() => {
      expect(screen.getByText(/Batman/)).toBeInTheDocument();
      expect(screen.getByText(/Intelligence:\s*100/i)).toBeInTheDocument();
    });
  });
});

describe("Heroes - Pagination", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.apiFetch.mockResolvedValue(defaultEmpty);
  });

  test("renders pagination controls when multiple pages", async () => {
    api.apiFetch.mockImplementation((url) => {
      const qs = url.split("?")[1] || "";
      const params = new URLSearchParams(qs);
      const q = params.get("search");
      if (q === "Superman") {
        return Promise.resolve({
          results: [{ id: 1, name: "Superman" }],
          totalPages: 3,
        });
      }
      return Promise.resolve(defaultEmpty);
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getByText(/Page\s*1\s*of\s*3/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  test("navigates to next and previous page", async () => {
    api.apiFetch.mockImplementation((url) => {
      const qs = url.split("?")[1] || "";
      const params = new URLSearchParams(qs);
      const q = params.get("search");
      const p = Number(params.get("page") || "1");

      if (q === "Superman" && p === 1) {
        return Promise.resolve({
          results: [{ id: 1, name: "Superman" }],
          totalPages: 2,
        });
      }
      if (q === "Superman" && p === 2) {
        return Promise.resolve({
          results: [{ id: 2, name: "Batman" }],
          totalPages: 2,
        });
      }
      return Promise.resolve(defaultEmpty);
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });

    const input = await screen.findByRole("textbox", { name: /search heroes/i });
    await userEvent.type(input, "Superman", { allAtOnce: true });

    await waitFor(() => expect(screen.getByText(/Superman/)).toBeInTheDocument());

    // Next → page 2 (Batman)
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByText(/Batman/)).toBeInTheDocument());

    // Previous → back to page 1 (Superman)
    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    await waitFor(() => expect(screen.getByText(/Superman/)).toBeInTheDocument());
  });
});
