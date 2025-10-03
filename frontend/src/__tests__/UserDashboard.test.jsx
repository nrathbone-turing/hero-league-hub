// File: frontend/src/__tests__/UserDashboard.test.jsx
// Purpose: Stable tests for UserDashboard with AuthProvider and routing.
// Notes:
// - Scopes queries within specific cards to avoid duplicate hero/event name conflicts.
// - Seeds chosenHero or entrant in localStorage *before* render to avoid race with effects.

import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";

function renderWithAuth({ withHero = false, withEntrant = false } = {}) {
  localStorage.clear();
  localStorage.setItem("token", "fake-token");
  localStorage.setItem(
    "user",
    JSON.stringify({ username: "player1", email: "player1@example.com", is_admin: false })
  );

  if (withHero) {
    localStorage.setItem(
      "chosenHero",
      JSON.stringify({
        id: 1,
        name: "Batman",
        alignment: "hero",
        full_name: "Bruce Wayne",
        alias: "Dark Knight",
        proxy_image: "/api/heroes/70/image",
        powerstats: { combat: 100, intelligence: 100 },
      })
    );
  }

  if (withEntrant) {
    localStorage.setItem(
      "entrant",
      JSON.stringify({
        id: 101,
        event: {
          id: 7,
          name: "Hero Cup",
          date: "2025-09-12",
          status: "published",
          entrant_count: 16,
        },
        hero: {
          id: 2,
          name: "Superman",
          full_name: "Clark Kent",
          alias: "Man of Steel",
          proxy_image: "/api/heroes/2/image",
        },
      })
    );
  }

  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserDashboard />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("UserDashboard", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("renders welcome message with username", async () => {
    renderWithAuth();
    expect(await screen.findByText(/welcome, player1/i)).toBeInTheDocument();
  });

  test("renders event registration + hero prompt if no hero selected", async () => {
    renderWithAuth();

    const heroCard = await screen.findByText(/you haven’t selected/i);
    const heroUtils = within(heroCard.closest(".MuiCard-root"));

    expect(heroUtils.getByRole("button", { name: /choose hero/i })).toBeInTheDocument();

    const eventCard = await screen.findByText(/you haven’t registered/i);
    const eventUtils = within(eventCard.closest(".MuiCard-root"));

    expect(eventUtils.getByRole("button", { name: /register for event/i })).toBeInTheDocument();
  });

  test("renders chosen hero card with powerstats", async () => {
    renderWithAuth({ withHero: true });

    const heroCard = await screen.findByText(/batman/i);
    const heroUtils = within(heroCard.closest(".MuiCard-root"));

    // Scoped inside hero card
    expect(heroUtils.getByText(/combat:\s*100/i)).toBeInTheDocument();
    expect(heroUtils.getByText(/intelligence:\s*100/i)).toBeInTheDocument();
    expect(heroUtils.getByRole("button", { name: /choose another hero/i })).toBeInTheDocument();
  });

  test("renders entrant event card with hero details", async () => {
    renderWithAuth({ withEntrant: true });

    const eventCard = await screen.findByText(/hero cup/i);
    const eventUtils = within(eventCard.closest(".MuiCard-root"));

    // Event info
    expect(eventUtils.getByText(/hero cup/i)).toBeInTheDocument();
    expect(eventUtils.getByText(/2025-09-12/i)).toBeInTheDocument();
    expect(eventUtils.getByText(/status:\s*published/i)).toBeInTheDocument();
    expect(eventUtils.getByText(/entrants:\s*16/i)).toBeInTheDocument();

    // Hero info
    expect(eventUtils.getByRole("img", { name: /superman/i })).toBeInTheDocument();
    expect(eventUtils.getByText(/superman/i)).toBeInTheDocument();
    expect(eventUtils.getByText(/clark kent/i)).toBeInTheDocument();
    expect(eventUtils.getByText(/man of steel/i)).toBeInTheDocument();

    // CTAs
    expect(eventUtils.getByRole("button", { name: /change registration/i })).toBeInTheDocument();
    expect(eventUtils.getByRole("button", { name: /cancel registration/i })).toBeInTheDocument();
  });

  test("cancel registration clears entrant and reverts UI", async () => {
    renderWithAuth({ withEntrant: true });

    // Mock confirm → OK
    vi.spyOn(window, "confirm").mockReturnValue(true);

    // Mock fetch DELETE success
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, status: 204 })
    );

    const eventCard = await screen.findByText(/hero cup/i);
    const eventUtils = within(eventCard.closest(".MuiCard-root"));

    await userEvent.click(eventUtils.getByRole("button", { name: /cancel registration/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /register for event/i })).toBeInTheDocument()
    );

    expect(localStorage.getItem("entrant")).toBeNull();
  });

  test("cancel registration confirm → user clicks cancel, nothing happens", async () => {
    renderWithAuth({ withEntrant: true });

    // Mock confirm → Cancel
    vi.spyOn(window, "confirm").mockReturnValue(false);
    global.fetch = vi.fn();

    const eventCard = await screen.findByText(/hero cup/i);
    const eventUtils = within(eventCard.closest(".MuiCard-root"));

    await userEvent.click(eventUtils.getByRole("button", { name: /cancel registration/i }));

    // Entrant card should still be visible
    expect(eventUtils.getByText(/hero cup/i)).toBeInTheDocument();
    expect(localStorage.getItem("entrant")).not.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
