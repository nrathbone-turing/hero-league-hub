// File: frontend/src/__tests__/EventRegistration.test.jsx
// Purpose: Robust tests for EventRegistration without fragile portal/option queries.
// Notes:
// - Wraps in AuthProvider + MemoryRouter.
// - Heroes mock returns { results: [...] } to match component.
// - Uses role-based queries for MUI Select + Autocomplete.
// - Asserts POST payload by parsing body (no brittle string matching).

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "../context/AuthContext";
import EventRegistration from "../components/EventRegistration";
import { mockFetchSuccess } from "../setupTests";

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

describe("EventRegistration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("prefills user info fields (name/username/email) from AuthProvider", async () => {
    // First fetch: events (avoid error alert)
    mockFetchSuccess([]);

    renderWithAuth(<EventRegistration />, {
      user: { id: 123, username: "nick", email: "nick@test.com", is_admin: false },
    });

    expect(await screen.findByTestId("event-registration")).toBeInTheDocument();

    // Validate values by display value (less brittle than label text)
    const nickFields = await screen.findAllByDisplayValue("nick");
    expect(nickFields.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue("nick@test.com")).toBeInTheDocument();
  });

  test("submits selected event and hero, stores entrant", async () => {
    // 1) GET /events
    mockFetchSuccess([{ id: 7, name: "Winter Games", date: "2025-12-01" }]);
    // 2) GET /heroes — must be { results: [...] }
    mockFetchSuccess({ results: [{ id: 42, name: "Spiderman", alias: "Webslinger" }] });
    // 3) POST /entrants/register
    mockFetchSuccess({
      id: 99,
      event_id: 7,
      hero: { id: 42, name: "Spiderman" },
    });

    renderWithAuth(<EventRegistration />, {
      user: { id: 123, username: "nick", email: "nick@test.com" },
    });

    // Pick event
    const eventSelect = await screen.findByRole("combobox", { name: /event/i });
    await userEvent.click(eventSelect);
    await userEvent.keyboard("{ArrowDown}{Enter}");

    // Open hero autocomplete (click input). With our filterOptions, opening without typing shows all options.
    const heroInput = await screen.findByRole("combobox", { name: /hero/i });
    await userEvent.click(heroInput);

    // Select the first (and only) option by role. Use name that matches label content.
    const spideyOption = await screen.findByRole("option", { name: /spiderman/i });
    await userEvent.click(spideyOption);

    // Submit
    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    // Assert POST call happened and payload contains numeric ids
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    const lastCall = global.fetch.mock.calls[2];
    const [url, init] = lastCall;

    expect(String(url)).toMatch(/\/entrants\/register$/);
    expect(init?.method).toBe("POST");

    const sent = JSON.parse(init?.body ?? "{}");
    expect(sent.event_id).toBe(7);
    expect(sent.hero_id).toBe(42);
    // user_id should be present from AuthProvider
    expect(sent.user_id).toBe(123);

    // Entrant persisted locally (redirect is handled by navigate; we assert side-effect)
    const entrant = JSON.parse(localStorage.getItem("entrant"));
    expect(entrant?.hero?.id).toBe(42);
  });
});
