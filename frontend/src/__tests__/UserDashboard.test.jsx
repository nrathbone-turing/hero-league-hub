// File: frontend/src/__tests__/UserDashboard.test.jsx
// Purpose: Stable tests for UserDashboard with AuthProvider and routing.
// Notes:
// - Relies on test IDs from UserDashboard to avoid brittle string queries.

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";

function renderWithAuth({ withHero = false, withEntrant = false } = {}) {
  localStorage.clear();
  localStorage.setItem("token", "fake-token");
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: 1,
      username: "player1",
      email: "player1@example.com",
      is_admin: false,
    })
  );

  if (withHero) {
    localStorage.setItem(
      "chosenHero_1",
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
      "entrant_1",
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
        matches: [],
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
    expect(await screen.findByTestId("user-dashboard")).toHaveTextContent(
      "Welcome, player1"
    );
  });

  test("renders hero prompt and event prompt when nothing chosen", async () => {
    renderWithAuth();

    expect(await screen.findByTestId("hero-card-empty")).toBeInTheDocument();
    expect(screen.getByTestId("choose-hero-btn")).toBeInTheDocument();

    expect(await screen.findByTestId("event-card-empty")).toBeInTheDocument();
    expect(screen.getByTestId("register-event-btn")).toBeInTheDocument();
  });

  test("renders chosen hero card with powerstats", async () => {
    renderWithAuth({ withHero: true });

    const heroCard = await screen.findByTestId("hero-card");
    expect(within(heroCard).getByTestId("hero-name")).toHaveTextContent("Batman");
    expect(within(heroCard).getByText(/combat/i)).toBeInTheDocument();
    expect(within(heroCard).getByText(/intelligence/i)).toBeInTheDocument();
    expect(within(heroCard).getByTestId("choose-another-hero")).toBeInTheDocument();
  });

  test("renders entrant event card with hero details", async () => {
    renderWithAuth({ withEntrant: true });

    const eventCard = await screen.findByTestId("event-card");
    expect(within(eventCard).getByTestId("event-name")).toHaveTextContent("Hero Cup");
    expect(within(eventCard).getByTestId("event-date")).toHaveTextContent("2025-09-12");
    expect(within(eventCard).getByTestId("event-status")).toHaveTextContent(
      "published"
    );
    expect(within(eventCard).getByTestId("event-entrants")).toHaveTextContent("16");

    expect(within(eventCard).getByTestId("event-hero-name")).toHaveTextContent(
      "Superman"
    );
    expect(
      within(eventCard).getByTestId("change-registration-btn")
    ).toBeInTheDocument();
    expect(
      within(eventCard).getByTestId("cancel-registration-btn")
    ).toBeInTheDocument();
  });

  test("cancel registration clears entrant and reverts UI", async () => {
    renderWithAuth({ withEntrant: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 204 }));

    const eventCard = await screen.findByTestId("event-card");
    await userEvent.click(within(eventCard).getByTestId("cancel-registration-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("register-event-btn")).toBeInTheDocument()
    );
    expect(localStorage.getItem("entrant_1")).toBeNull();
  });

  test("cancel registration confirm → user clicks cancel, nothing happens", async () => {
    renderWithAuth({ withEntrant: true });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    global.fetch = vi.fn();

    const eventCard = await screen.findByTestId("event-card");
    await userEvent.click(within(eventCard).getByTestId("cancel-registration-btn"));

    expect(eventCard).toBeInTheDocument();
    expect(localStorage.getItem("entrant_1")).not.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
