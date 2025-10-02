// Purpose: Robust tests for EventRegistration without fragile portal/option queries.
// Notes:
// - Uses AuthProvider + MemoryRouter.
// - Uses helpers from setupTests (mockFetchSuccess/Failure).
// - Interacts with MUI Select via aria-expanded + keyboard, not role="option".
// - Verifies submit payload rather than exact menu text.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import EventRegistration from "../components/EventRegistration";
import { mockFetchSuccess, mockFetchFailure } from "../setupTests";

function renderWithAuth(ui, { route = "/register-event", user } = {}) {
  if (user) {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify(user));
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

function seedChosenHero(hero = { id: 1, name: "Batman" }) {
  localStorage.setItem("chosenHero", JSON.stringify(hero));
}

describe("EventRegistration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("prefills user info fields (name/username/email) from AuthProvider", async () => {
    // First fetch: events list (avoid error alert)
    mockFetchSuccess([]);

    renderWithAuth(<EventRegistration />, {
      user: { username: "nick", email: "nick@test.com", is_admin: false },
    });

    // Page renders
    expect(await screen.findByTestId("event-registration")).toBeInTheDocument();

    // We avoid relying on label collisions; just assert values appear.
    // There will be two "nick" textboxes (name + username).
    const nickFields = await screen.findAllByDisplayValue("nick");
    expect(nickFields.length).toBeGreaterThanOrEqual(1);

    // Email value present
    expect(screen.getByDisplayValue("nick@test.com")).toBeInTheDocument();
  });

  test("shows events select can be opened (without relying on portal options)", async () => {
    // Events list present
    mockFetchSuccess([{ id: 1, name: "Hero Cup", date: "2025-09-12" }]);

    renderWithAuth(<EventRegistration />, {
      user: { username: "nick", email: "nick@test.com" },
    });

    const eventSelect = await screen.findByRole("combobox", { name: /event/i });

    // Open menu and assert aria-expanded flips to true (robust against portal)
    await userEvent.click(eventSelect);
    expect(eventSelect).toHaveAttribute("aria-expanded", "true");
  });

  test("can select event & hero via keyboard and submits expected payload", async () => {
    // 1) GET /events
    mockFetchSuccess([{ id: 7, name: "Winter Games", date: "2025-12-01" }]);
    // 2) POST /entrants (success)
    mockFetchSuccess({ id: 99 });

    // Ensure there is at least one hero option
    seedChosenHero({ id: 42, name: "Spiderman" });

    renderWithAuth(<EventRegistration />, {
      user: { username: "nick", email: "nick@test.com" },
    });

    // Select first (and only) event via keyboard
    const eventSelect = await screen.findByRole("combobox", { name: /event/i });
    await userEvent.click(eventSelect);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    // Select first (and only) hero via keyboard
    const heroSelect = await screen.findByRole("combobox", { name: /hero/i });
    await userEvent.click(heroSelect);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    // Submit
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    // Assert that second fetch was a POST to entrants with correct ids.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    const [, postCall] = global.fetch.mock.calls;
    const [url, init] = postCall;

    expect(String(url)).toMatch(/\/entrants/);
    expect(init?.method).toBe("POST");

    const sent = JSON.parse(init?.body ?? "{}");
    // We don't assert exact text labels; just that ids got wired.
    // selected event id should be 7, hero id 42
    expect(sent.event_id).toBe(7);
    expect(sent.hero_id).toBe(42);
  });

  test("shows error on failed submission (alert rendered)", async () => {
    // 1) GET /events
    mockFetchSuccess([{ id: 1, name: "Hero Cup" }]);
    // 2) POST /entrants -> failure
    mockFetchFailure({ error: "Registration failed" });

    seedChosenHero({ id: 1, name: "Batman" });

    renderWithAuth(<EventRegistration />, {
      user: { username: "nick", email: "nick@test.com" },
    });

    // Choose event via keyboard
    const eventSelect = await screen.findByRole("combobox", { name: /event/i });
    await userEvent.click(eventSelect);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    // Choose hero via keyboard
    const heroSelect = await screen.findByRole("combobox", { name: /hero/i });
    await userEvent.click(heroSelect);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    // Submit
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    // Generic check: an error alert appears
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
