// Purpose: Tests UserDashboard with AuthProvider and routing.
// Notes:
// - Verifies welcome message, hero card, and event registration prompt.
// - Seeds chosenHero in localStorage *before* rendering to avoid race with effects.

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";

function renderWithAuth({ withHero = false } = {}) {
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
    renderWithAuth({ withHero: false });
    expect(await screen.findByText(/welcome, player1/i)).toBeInTheDocument();
  });

  test("renders event registration + hero prompt if no hero selected", async () => {
    renderWithAuth({ withHero: false });

    expect(await screen.findByText(/you haven’t selected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose hero/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register for event/i })).toBeInTheDocument();
  });

  test("renders chosen hero card with powerstats", async () => {
    renderWithAuth({ withHero: true });

    // Avoid brittle exact name casing; assert stats + CTA present
    expect(await screen.findByText(/combat:\s*100/i)).toBeInTheDocument();
    expect(screen.getByText(/intelligence:\s*100/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another hero/i })).toBeInTheDocument();
  });
});
