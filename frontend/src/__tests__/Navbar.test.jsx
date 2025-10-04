// File: frontend/src/__tests__/Navbar.test.jsx
// Purpose: Tests for Navbar auth-aware UI and routing.
// Notes:
// - Uses shared renderWithRouter from test-utils (includes Router + AuthProvider).
// - Covers logged out UI (login/signup links).
// - Covers logged in UI (welcome + logout).
// - Ensures Heroes and Events nav links appear and navigate.

import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import { renderWithRouter } from "../test-utils";

function HeroesPage() {
  return <div data-testid="heroes-page">Heroes Page</div>;
}

function EventsPage() {
  return <div data-testid="events-page">Events Page</div>;
}

// Harness to expose auth API to tests
function AuthTestHarness({ onReady }) {
  const auth = useAuth();
  React.useEffect(() => {
    onReady(auth);
  }, [auth, onReady]);
  return null;
}

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();

  global.fetch = vi.fn((url) => {
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
  vi.resetAllMocks();
  localStorage.clear();
});

describe("Navbar", () => {
  test("shows login/signup links when logged out", () => {
    renderWithRouter(
      <>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
        </Routes>
      </>
    );
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /signup/i })).toBeInTheDocument();
  });

  test("navigates to login and signup pages", () => {
    renderWithRouter(
      <>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
        </Routes>
      </>
    );

    fireEvent.click(screen.getByRole("link", { name: /login/i }));
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /signup/i }));
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  test("shows welcome + logout when logged in", async () => {
    let authApi;
    renderWithRouter(
      <>
        <Navbar />
        <AuthTestHarness onReady={(api) => (authApi = api)} />
      </>
    );

    await waitFor(() => expect(authApi).toBeDefined());
    await authApi.login("test@example.com", "password123");

    await waitFor(() => {
      expect(screen.getByText(/welcome test/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("logout clears token and resets user", async () => {
    let authApi;
    renderWithRouter(
      <>
        <Navbar />
        <AuthTestHarness onReady={(api) => (authApi = api)} />
      </>
    );

    await waitFor(() => expect(authApi).toBeDefined());
    await authApi.login("test@example.com", "password123");

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

  test("navigates to Heroes page", () => {
    renderWithRouter(
      <>
        <Navbar />
        <Routes>
          <Route path="/heroes" element={<HeroesPage />} />
        </Routes>
      </>
    );
    fireEvent.click(screen.getByTestId("nav-heroes"));
    expect(screen.getByTestId("heroes-page")).toBeInTheDocument();
  });

  test("navigates to Events page", () => {
    renderWithRouter(
      <>
        <Navbar />
        <Routes>
          <Route path="/events" element={<EventsPage />} />
        </Routes>
      </>
    );
    fireEvent.click(screen.getByTestId("nav-events"));
    expect(screen.getByTestId("events-page")).toBeInTheDocument();
  });
});
