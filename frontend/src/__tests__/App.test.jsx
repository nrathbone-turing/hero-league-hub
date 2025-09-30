// File: frontend/src/__tests__/App.test.jsx
// Purpose: Routing tests for App component.
// Notes:
// - Relies on global fetch mock from setupTests.js.
// - Explicitly mocks /events before navigation.
// - Covers success, 404, and 500 flows.

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
  beforeEach(() => {
    // bypass ProtectedRoute
    localStorage.setItem("token", "fake-jwt-token");
  });

  afterEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  test("renders EventDashboard with events when authenticated", async () => {
    // mock /events
    mockFetchSuccess([
      { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
    ]);

    renderWithRouter(<App />, { route: "/" });

    // assert the event appears (we're past the login page now)
    expect(await screen.findByText(/Hero Cup/i)).toBeInTheDocument();
  });

  test("navigates Dashboard → EventDetail when authenticated", async () => {
    // initial dashboard list
    mockFetchSuccess([
      { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
    ]);

    renderWithRouter(<App />, { route: "/" });
    expect(await screen.findByText(/Hero Cup/i)).toBeInTheDocument();

    // queue detail fetch before clicking
    mockFetchSuccess({
      id: 1,
      name: "Hero Cup",
      date: "2025-09-12",
      status: "published",
      entrants: [],
      matches: [],
    });

    // click the visible text in the list item
    await userEvent.click(screen.getByText(/Hero Cup/i));

    // confirm detail heading renders
    expect(
      await screen.findByText(/Hero Cup — 2025-09-12/i),
    ).toBeInTheDocument();
  });
});

describe("App - error handling", () => {
  beforeEach(() => {
    localStorage.setItem("token", "fake-jwt-token"); // bypass ProtectedRoute
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
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
