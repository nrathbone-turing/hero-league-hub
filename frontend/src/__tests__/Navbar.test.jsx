// File: frontend/src/__tests__/Navbar.test.jsx
// Purpose: Tests for Navbar auth-aware UI and routing.
// Notes:
// - Covers logged out UI (login/signup links).
// - Covers logged in UI (welcome + logout).
// - Ensures logout clears localStorage and resets user.
// - Verifies navigation works for /, /login, and /signup.

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AuthProvider, { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

// Test harness page to check navigation + auth state
function EventsPage() {
  const { user } = useAuth();
  return <div>Events Dashboard {user ? `(user: ${user.username})` : ""}</div>;
}

// Harness to expose auth API to tests
function AuthTestHarness({ onReady }) {
  const auth = useAuth();
  React.useEffect(() => {
    onReady(auth);
  }, [auth, onReady]);
  return null;
}

function renderWithRouter(initialEntries = ["/"], onAuthReady = () => {}) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Navbar />
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
        </Routes>
        <AuthTestHarness onReady={onAuthReady} />
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  // Mock fetch for /login and /signup
  global.fetch = jest.fn((url) => {
    if (url.endsWith("/login")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: "fake-jwt-token" }),
      });
    }
    if (url.endsWith("/signup")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ username: "testuser", email: "test@example.com" }),
      });
    }
    return Promise.reject(new Error("Unknown endpoint: " + url));
  });
});

afterEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

describe("Navbar", () => {
  test("shows login/signup links when logged out", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /signup/i })).toBeInTheDocument();
  });

  test("navigates to login and signup pages", () => {
    renderWithRouter();

    fireEvent.click(screen.getByRole("link", { name: /login/i }));
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /signup/i }));
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  test("shows welcome + logout when logged in", async () => {
    let authApi;
    renderWithRouter(["/"], (api) => (authApi = api));

    await waitFor(() => expect(authApi).toBeDefined());

    await authApi.login("test@example.com", "password123");

    await waitFor(() => {
      expect(screen.getByText(/welcome test/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("logout clears token and resets user", async () => {
    let authApi;
    renderWithRouter(["/"], (api) => (authApi = api));

    await waitFor(() => expect(authApi).toBeDefined());

    await authApi.login("test@example.com", "password123");

    // token should persist to localStorage
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
    });

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
    });

    await waitFor(() => {
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
    });
  });
});
