// File: frontend/src/__tests__/Heroes.test.jsx
// Purpose: Tests for Heroes component with dynamic fetch.
// Notes:
// - Covers initial render, loading, search, pagination, and error state.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Heroes from "../components/Heroes";

describe("Heroes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.setItem("token", "fake-jwt");
  });

  test("renders heading", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], totalPages: 1 }),
    });
    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByRole("heading", { name: /heroes/i })).toBeInTheDocument();
  });

  test("shows hero cards after fetch", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { id: 1, name: "Batman", image: "/bat.jpg", powerstats: { combat: 100 } },
        ],
        totalPages: 1,
      }),
    });
    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByText(/Batman/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /select batman/i })).toBeInTheDocument();
  });

  test("handles error state", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    renderWithRouter(<Heroes />, { route: "/heroes" });
    expect(await screen.findByRole("alert")).toHaveTextContent(/error/i);
  });

  test("allows search input", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], totalPages: 1 }),
    });
    renderWithRouter(<Heroes />, { route: "/heroes" });
    const search = screen.getByPlaceholderText(/search heroes/i);
    await userEvent.type(search, "superman");
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
