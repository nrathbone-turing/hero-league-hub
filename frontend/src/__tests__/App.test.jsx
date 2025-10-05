// File: frontend/src/__tests__/App.test.jsx
// Purpose: Routing and access control tests for App component.
// Notes:
// - Covers all major routes: root redirect, dashboards, events, registration, heroes, and error pages.
// - Reflects unified EventDetail participant view (no admin-only CRUD panel).
// - Uses data-testid queries for stable assertions.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess } from "../setupTests";
import { useLocation } from "react-router-dom";
import React from "react";

function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("App routing", () => {
  test("renders Navbar brand title", async () => {
    mockFetchSuccess();
    renderWithRouter(<App />, { route: "/" });

    const title = await screen.findByTestId("nav-title");
    expect(title).toHaveTextContent(/hero league hub/i);
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
        JSON.stringify({
          id: 1,
          username: "participant",
          email: "p@example.com",
          is_admin: false,
        })
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
    });

    test("renders EventDetail in participant mode when visiting /events/:id", async () => {
      mockFetchSuccess({
        id: 1,
        name: "Hero Cup",
        date: "2025-09-12",
        status: "published",
        entrants: [],
        matches: [],
      });

      renderWithRouter(<App />, { route: "/events/1" });

      const header = await screen.findByTestId("event-header");
      expect(header).toHaveTextContent("Hero Cup");
      expect(await screen.findByTestId("register-now-btn")).toBeInTheDocument();
    });
  });

  describe("admin (event organizer) users", () => {
    beforeEach(() => {
      localStorage.setItem("token", "fake-jwt-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: "admin",
          email: "admin@example.com",
          is_admin: true,
        })
      );
    });

    test.skip("redirects / to Events for organizer", async () => {
      // kept for future admin linking between projects
      mockFetchSuccess([
        {
          id: 1,
          name: "Hero Cup",
          date: "2025-09-12",
          status: "published",
        },
      ]);

      renderWithRouter(<App />, { route: "/" });

      const dashboard = await screen.findByTestId("event-dashboard");
      expect(dashboard).toBeInTheDocument();
      expect(await screen.findByTestId("event-name")).toHaveTextContent("Hero Cup");
    });

    test.skip("navigates from Events → EventDetail", async () => {
      // kept for future admin linking between projects
      mockFetchSuccess([
        {
          id: 1,
          name: "Hero Cup",
          date: "2025-09-12",
          status: "published",
        },
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
      const header = await screen.findByTestId("event-header");
      expect(header).toHaveTextContent("Hero Cup");
    });
  });
});

describe("App routing (unauthenticated users)", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("redirects unauthenticated user to /login for /dashboard", async () => {
    renderWithRouter(
      <>
        <App />
        <LocationSpy />
      </>,
      { route: "/dashboard" }
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/login")
    );
  });

  test("redirects unauthenticated user to /login for /heroes", async () => {
    renderWithRouter(
      <>
        <App />
        <LocationSpy />
      </>,
      { route: "/heroes" }
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/login")
    );
  });

  test("redirects unauthenticated user to /login for /register-event", async () => {
    renderWithRouter(
      <>
        <App />
        <LocationSpy />
      </>,
      { route: "/register-event" }
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

    renderWithRouter(
      <>
        <App />
        <LocationSpy />
      </>,
      { route: "/events/999" }
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/500")
    );
  });

  test("renders NotFoundPage on unknown route", async () => {
    renderWithRouter(<App />, { route: "/does-not-exist" });
    expect(await screen.findByTestId("notfound-page")).toBeInTheDocument();
  });

  test("redirects to /404 on event 404", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    renderWithRouter(
      <>
        <App />
        <LocationSpy />
      </>,
      { route: "/events/999" }
    );

    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/404")
    );
  });
});
