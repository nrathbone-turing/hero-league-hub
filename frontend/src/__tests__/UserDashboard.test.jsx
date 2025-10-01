// File: frontend/src/__tests__/UserDashboard.test.jsx
// Purpose: Baseline tests for UserDashboard routing + rendering.

import { screen } from "@testing-library/react";
import { renderWithRouter } from "../test-utils";
import UserDashboard from "../components/UserDashboard";
import { AuthContext } from "../context/AuthContext";

function renderWithUser(user) {
  return renderWithRouter(
    <AuthContext.Provider value={{ user, isAuthenticated: true }}>
      <UserDashboard />
    </AuthContext.Provider>,
    { route: "/dashboard" }
  );
}

describe("UserDashboard", () => {
  test("renders welcome message with username", () => {
    renderWithUser({ username: "player1" });
    expect(screen.getByText(/welcome, player1/i)).toBeInTheDocument();
  });

  test("renders choose heroes button", () => {
    renderWithUser({ username: "player1" });
    expect(
      screen.getByRole("button", { name: /choose heroes/i })
    ).toBeInTheDocument();
  });
});
