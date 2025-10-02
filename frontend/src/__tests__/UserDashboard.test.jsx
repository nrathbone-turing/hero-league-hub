// File: frontend/src/__tests__/UserDashboard.test.jsx
// Purpose: Tests UserDashboard with AuthProvider and routing.
// Notes:
// - Verifies welcome message, hero card, and event registration prompt.

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider, { useAuth } from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";

function Harness({ withHero = false }) {
  const { setUser } = useAuth();

  React.useEffect(() => {
    setUser({ username: "player1", email: "player1@example.com", is_admin: false });
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
    } else {
      localStorage.removeItem("chosenHero");
    }
  }, [setUser, withHero]);

  return <UserDashboard />;
}

describe("UserDashboard", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("renders welcome message with username", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Harness />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(await screen.findByText(/welcome, player1/i)).toBeInTheDocument();
  });

  test("renders event registration + hero prompt if no hero selected", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Harness withHero={false} />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(await screen.findByText(/you haven’t selected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose hero/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register for event/i })).toBeInTheDocument();
  });

  test("renders chosen hero card with powerstats", async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Harness withHero={true} />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(await screen.findByText(/BATMAN/i)).toBeInTheDocument();
    expect(screen.getByText(/combat: 100/i)).toBeInTheDocument();
    expect(screen.getByText(/intelligence: 100/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another hero/i })).toBeInTheDocument();
  });
});
