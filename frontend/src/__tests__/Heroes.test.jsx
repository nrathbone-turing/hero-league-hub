// File: frontend/src/__tests__/Heroes.test.jsx
// Purpose: Tests for Heroes component (search + fetch + display).
// Notes:
// - Mocks apiFetch for controlled responses.
// - Covers loading, error, search, and empty results.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Heroes from "../components/Heroes";
import * as api from "../api";
import { mockFetchSuccess } from "../setupTests";

vi.mock("../api");

describe("Heroes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders heading and hero list", async () => {
    api.apiFetch.mockResolvedValueOnce([
      { id: 1, name: "Spiderman", image: "spidey.jpg", powerstats: { strength: 55 } },
    ]);

    renderWithRouter(<Heroes />, { route: "/heroes" });

    expect(await screen.findByTestId("heroes-heading")).toBeInTheDocument();
    expect(await screen.findByText(/Spiderman/)).toBeInTheDocument();
    expect(await screen.findByText(/Strength: 55/)).toBeInTheDocument();
  });

  test("shows loading spinner while fetching", async () => {
    api.apiFetch.mockReturnValue(new Promise(() => {})); // never resolves

    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByText(/loading heroes/i)).toBeInTheDocument();
  });

  test("shows error when fetch fails", async () => {
    api.apiFetch.mockRejectedValueOnce(new Error("Network fail"));

    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to fetch heroes/i);
  });

  test("shows empty state when no heroes found", async () => {
    api.apiFetch.mockResolvedValueOnce([]);

    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByText(/no heroes found/i)).toBeInTheDocument();
  });

  test("search updates fetch call", async () => {
    api.apiFetch
      .mockResolvedValueOnce([]) // initial
      .mockResolvedValueOnce([{ id: 2, name: "Batman", powerstats: { intelligence: 100 } }]);

    renderWithRouter(<Heroes />, { route: "/heroes" });
    const input = await screen.findByLabelText(/search heroes/i);

    await userEvent.type(input, "Batman");
    await waitFor(() => expect(api.apiFetch).toHaveBeenCalledWith("/heroes?search=Batman"));

    expect(await screen.findByText(/Batman/)).toBeInTheDocument();
  });
});

describe("Heroes - Pagination", () => {
  test("renders pagination controls when multiple pages", async () => {
    mockFetchSuccess({
      results: [{ id: 1, name: "Superman" }],
      totalPages: 3,
    });

    renderWithRouter(<Heroes />, { route: "/heroes" });

    expect(
      await screen.findByText(/Page 1 of 3/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  test("navigates to next and previous page", async () => {
    // Page 1
    mockFetchSuccess({
      results: [{ id: 1, name: "Superman" }],
      totalPages: 2,
    });
    renderWithRouter(<Heroes />, { route: "/heroes" });

    expect(await screen.findByText(/superman/i)).toBeInTheDocument();

    // Simulate clicking next
    mockFetchSuccess({
      results: [{ id: 2, name: "Batman" }],
      totalPages: 2,
    });
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(await screen.findByText(/batman/i)).toBeInTheDocument();

    // Simulate clicking previous
    mockFetchSuccess({
      results: [{ id: 1, name: "Superman" }],
      totalPages: 2,
    });
    await userEvent.click(screen.getByRole("button", { name: /previous/i }));

    expect(await screen.findByText(/superman/i)).toBeInTheDocument();
  });
});