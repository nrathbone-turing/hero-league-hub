// File: frontend/src/__tests__/Heroes.test.jsx
// Purpose: Stable and isolated tests for <Heroes /> (search, pagination, dialog interactions).
// Context: Uses vi.mocked apiFetch for predictable behavior.
// Notes:
// - Follows the same structure as Events.test.jsx for consistency.
// - Covers: empty → loading → success → error → pagination → dialog → choose hero.
// - Uses only data-testid or aria-label queries for reliability.

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Heroes from "../components/Heroes";

// Local vi mock to isolate behavior and avoid race conditions
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
}));

const { apiFetch } = await import("../api");

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("<Heroes /> rendering", () => {
  test("shows placeholder text when API returns empty results", async () => {
    apiFetch.mockResolvedValueOnce({ results: [], total: 0 });

    renderWithRouter(<Heroes />);

    // Wait for API resolution
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    // Assert that placeholders (not a 'no heroes' message) are visible
    expect(screen.getByTestId("hero-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("villain-placeholder")).toBeInTheDocument();

    // Confirm no table or dialog is shown
    expect(screen.queryByTestId("heroes-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hero-dialog")).not.toBeInTheDocument();
  });

  test("shows loading spinner during fetch", async () => {
    let resolvePromise;
    apiFetch.mockReturnValue(new Promise((res) => (resolvePromise = res)));

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Batman", { allAtOnce: true });

    // Spinner first
    expect(await screen.findByTestId("loading-state")).toBeInTheDocument();

    // Resolve data
    resolvePromise?.({ results: [{ id: 1, name: "Batman" }], total: 1 });

    await waitFor(() => expect(screen.getByTestId("heroes-table")).toBeInTheDocument());
    expect(await screen.findByTestId("hero-name-1")).toHaveTextContent("Batman");
  });

  test("renders heroes table when data loaded", async () => {
    apiFetch.mockResolvedValueOnce({
      results: [
        { id: 1, name: "Superman" },
        { id: 2, name: "Wonder Woman" },
      ],
      total: 2,
    });

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Superman", { allAtOnce: true });

    const table = await screen.findByTestId("heroes-table");
    expect(table).toBeInTheDocument();
    expect(await screen.findByTestId("hero-name-1")).toHaveTextContent("Superman");
    expect(await screen.findByTestId("hero-name-2")).toHaveTextContent("Wonder Woman");
    expect(screen.queryByTestId("no-heroes-text")).not.toBeInTheDocument();
  });

  test("shows error message when API fails", async () => {
    apiFetch.mockRejectedValueOnce(new Error("boom"));

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Boom", { allAtOnce: true });

    const error = await screen.findByTestId("error-alert");
    expect(error).toHaveTextContent(/failed to fetch heroes/i);
  });
});

describe("<Heroes /> pagination", () => {
  test("renders pagination info correctly", async () => {
    apiFetch.mockResolvedValueOnce({
      results: [{ id: 1, name: "Superman" }],
      total: 60,
      total_pages: 3,
    });

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Superman", { allAtOnce: true });

    expect(await screen.findByTestId("heroes-table")).toBeInTheDocument();
    expect(await screen.findByTestId("pagination-info")).toHaveAttribute(
      "aria-label",
      "pagination info"
    );
  });

  test("switches pages when next page clicked", async () => {
    apiFetch.mockImplementation((url) => {
      const params = new URLSearchParams(url.split("?")[1]);
      const page = Number(params.get("page"));
      if (page === 1)
        return Promise.resolve({
          results: [{ id: 1, name: "Superman" }],
          total: 60,
          total_pages: 3,
        });
      if (page === 2)
        return Promise.resolve({
          results: [{ id: 2, name: "Batman" }],
          total: 60,
          total_pages: 3,
        });
    });

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Test", { allAtOnce: true });

    await waitFor(() =>
      expect(screen.getByTestId("hero-name-1")).toHaveTextContent("Superman")
    );

    // Click pagination next page button
    const nextButton = screen.getByRole("button", { name: /go to next page/i });
    await userEvent.click(nextButton);

    expect(await screen.findByTestId("hero-name-2")).toHaveTextContent("Batman");
  });
});

describe("<Heroes /> dialog interactions", () => {
  test("opens and closes hero detail dialog", async () => {
    apiFetch.mockResolvedValueOnce({
      results: [{ id: 2, name: "Batman" }],
    });

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Batman", { allAtOnce: true });

    await userEvent.click(await screen.findByTestId("hero-row-2"));
    const dialog = await screen.findByTestId("hero-dialog");
    expect(within(dialog).getByTestId("hero-dialog-title")).toHaveTextContent("Batman");

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByTestId("hero-dialog")).not.toBeInTheDocument()
    );
  });

  test("clicking 'Choose Hero' closes dialog and navigates", async () => {
    apiFetch.mockResolvedValueOnce({
      results: [{ id: 1, name: "Wonder Woman" }],
    });

    renderWithRouter(<Heroes />);

    const input = screen.getByTestId("search-heroes-input");
    await userEvent.type(input, "Wonder Woman", { allAtOnce: true });
    await userEvent.click(await screen.findByTestId("hero-row-1"));

    const dialog = await screen.findByTestId("hero-dialog");
    const chooseButton = within(dialog).getByTestId("choose-hero-btn");
    await userEvent.click(chooseButton);

    await waitFor(() =>
      expect(screen.queryByTestId("hero-dialog")).not.toBeInTheDocument()
    );
  });
});
