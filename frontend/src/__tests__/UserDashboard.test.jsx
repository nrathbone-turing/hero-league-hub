// File: frontend/src/__tests__/UserDashboard.test.jsx
// Purpose: Tests UserDashboard with AuthProvider and routing.
// Notes:
// - Covers all three states: no hero/event, hero only, entrant with event.
// - Seeds localStorage before render to avoid race conditions.
// - Uses robust role/text queries (not brittle string matching).

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";

function renderWithAuth({ withHero = false, withEntrant = false } = {}) {
  localStorage.clear();
  localStorage.setItem("token", "fake-token");
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: 5,
      username: "player1",
      email: "player1@example.com",
      is_admin: false,
    })
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
        id: 77,
        event: {
          id: 12,
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
          proxy_image: "/api/heroes/644/image",
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
  });

  test("renders welcome message with username", async () => {
    renderWithAuth();
    expect(await screen.findByText(/welcome, player1/i)).toBeInTheDocument();
  });

  test("renders hero + event prompts if nothing selected", async () => {
    renderWithAuth();
    expect(await screen.findByText(/you haven’t selected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose hero/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register for event/i })).toBeInTheDocument();
  });

  test("renders chosen hero card with powerstats", async () => {
    renderWithAuth({ withHero: true });
    expect(await screen.findByText(/combat:\s*100/i)).toBeInTheDocument();
    expect(screen.getByText(/intelligence:\s*100/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another hero/i })).toBeInTheDocument();
  });

  test("renders entrant event card with hero details", async () => {
    renderWithAuth({ withEntrant: true });

    // Event info
    expect(await screen.findByText(/hero cup/i)).toBeInTheDocument();
    expect(screen.getByText(/2025-09-12/i)).toBeInTheDocument();
    expect(screen.getByText(/status: published/i)).toBeInTheDocument();
    expect(screen.getByText(/entrants: 16/i)).toBeInTheDocument();

    // Entrant hero info
    expect(screen.getByText(/superman/i)).toBeInTheDocument();
    expect(screen.getByText(/clark kent/i)).toBeInTheDocument();
    expect(screen.getByText(/man of steel/i)).toBeInTheDocument();

    // CTA
    expect(screen.getByRole("button", { name: /change registration/i })).toBeInTheDocument();
  });
});
