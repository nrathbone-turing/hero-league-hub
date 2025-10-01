// File: frontend/src/__tests__/UserDashboard.test.jsx
// Purpose: Tests UserDashboard with AuthProvider and routing.
// Notes:
// - Uses AuthProvider directly instead of manually mocking AuthContext.
// - Verifies welcome message and hero selection button render.

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider, { useAuth } from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";

function Harness() {
  const { setUser } = useAuth();

  // Simulate a logged-in user
  React.useEffect(() => {
    setUser({ username: "player1", email: "player1@example.com", is_admin: false });
  }, [setUser]);

  return <UserDashboard />;
}

describe("UserDashboard", () => {
  test("renders welcome message with username", async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Harness />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(await screen.findByText(/welcome, player1/i)).toBeInTheDocument();
  });

  test("renders choose heroes button", async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Harness />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(await screen.findByRole("button", { name: /choose heroes/i })).toBeInTheDocument();
  });
});
