// File: frontend/src/__tests__/App.test.jsx
// Purpose: Routing tests for App component with Vitest.
// Notes:
// - Uses global fetch mock from setupTests.js.
// - Covers navbar, dashboard, event detail, error routes, and event registration.

import { screen, waitFor, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess } from "../setupTests";
import { MemoryRouter, useLocation } from "react-router-dom";

function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("App routing", () => {
  test("renders Navbar brand link", async () => {
    mockFetchSuccess();
    renderWithRouter(<App />, { route: "/" });

    expect(
      await screen.findByRole("link", { name: /hero tournament manager/i }),
    ).toBeInTheDocument();
  });
});

describe("App routing (auth happy path)", () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe("non-admin users", () => {
    beforeEach(() => {
      localStorage.setItem("token", "fake-jwt-token");
      localStorage.setItem(
        "user",
        JSON.stringify({ username: "participant", email: "p@example.com", is_admin: false })
      );
    });

    test("redirects / to UserDashboard", async () => {
      renderWithRouter(<App />, { route: "/" });

      const dashboard = await screen.findByTestId("user-dashboard");
      expect(dashboard).toBeInTheDocument();
      expect(screen.getByText(/welcome, participant/i)).toBeInTheDocument();
    });

    test("navigates to EventRegistration page when authenticated", async () => {
      renderWithRouter(<App />, { route: "/register-event" });

      expect(await screen.findByTestId("event-registration")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /event registration/i })).toBeInTheDocument();
    });
  });

  describe("admin users", () => {
    beforeEach(() => {
      localStorage.setItem("token", "fake-jwt-token");
      localStorage.setItem(
        "user",
        JSON.stringify({ username: "admin", email: "admin@example.com", is_admin: true })
      );
    });

    test("redirects / to EventDashboard", async () => {
      mockFetchSuccess([
        { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
      ]);

      renderWithRouter(<App />, { route: "/" });

      const dashboard = await screen.findByTestId("event-dashboard");
      expect(dashboard).toBeInTheDocument();
      expect(await screen.findByTestId("event-name")).toHaveTextContent("Hero Cup");
    });

    test("navigates from EventDashboard → EventDetail", async () => {
      mockFetchSuccess([
        { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
      ]);

      renderWithRouter(<App />, { route: "/events" });

      const eventName = await screen.findByTestId("event-name");
      expect(eventName).toHaveTextContent("Hero Cup");

      mockFetchSuccess({
        id: 1,
        name: "Hero Cup",
        date: "2025-09-12",
        status: "published",
        entrants: [],
        matches: [],
      });

      await userEvent.click(eventName);
      expect(await screen.findByText(/Hero Cup — 2025-09-12/i)).toBeInTheDocument();
    });
  });
});

describe("App routing (unauthenticated users)", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("redirects unauthenticated user to /login for /register-event", async () => {
    render(
      <MemoryRouter initialEntries={["/register-event"]}>
        <App />
        <LocationSpy />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/login")
    );
  });
});

describe("App - error handling", () => {
  beforeEach(() => {
    localStorage.setItem("token", "fake-jwt-token"); // bypass ProtectedRoute
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test("redirects to /500 on server error", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(
      <MemoryRouter initialEntries={["/events/999"]}>
        <App />
        <LocationSpy />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/500"),
    );
  });

  test("renders NotFoundPage on unknown route", async () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("notfound-page")).toBeInTheDocument();
  });

  test("redirects to /404 on event 404", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    render(
      <MemoryRouter initialEntries={["/events/999"]}>
        <App />
        <LocationSpy />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/404"),
    );
  });
});
