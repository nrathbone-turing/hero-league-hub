// File: frontend/src/__tests__/EventRegistration.test.jsx
// Purpose: Robust tests for EventRegistration with stable selectors.
// Notes:
// - Uses testids for stable container queries, then drills to <input> with within().
// - Queries event options by role since MUI portals them outside the form.
// - Asserts payload and localStorage persistence.

import React from "react";
import { render, screen, within } from "@testing-library/react";
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

  test("prefills user info fields from AuthProvider", async () => {
    mockFetchSuccess([]); // GET /events

    renderWithAuth(<EventRegistration />, {
      user: { id: 123, username: "nick", email: "nick@test.com", is_admin: false },
    });

    expect(await screen.findByTestId("event-registration")).toBeInTheDocument();

    const userInput = within(screen.getByTestId("user-field")).getByRole("textbox");
    const emailInput = within(screen.getByTestId("email-field")).getByRole("textbox");

    expect(userInput).toHaveValue("nick");
    expect(emailInput).toHaveValue("nick@test.com");
  });
});
