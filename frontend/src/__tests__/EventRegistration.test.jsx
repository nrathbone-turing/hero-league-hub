// File: frontend/src/components/__tests__/EventRegistration.test.jsx
// Purpose: Test EventRegistration component form behavior.
// Notes:
// - Mocks apiFetch for events + entrants.
// - Verifies prefilled fields, dropdowns, and submission logic.

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EventRegistration from "../EventRegistration";
import { apiFetch } from "../../api";
import { AuthContext } from "../../context/AuthContext";

// Mock apiFetch
jest.mock("../../api", () => ({
  apiFetch: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

function renderWithAuth(ui, { user, chosenHeroes = [] } = {}) {
  return render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("EventRegistration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders prefilled user info", async () => {
    apiFetch.mockResolvedValueOnce([{ id: 1, name: "Hero Cup", date: "2025-10-01" }]);
    renderWithAuth(<EventRegistration />, {
      user: { username: "nick", email: "nick@test.com" },
    });

    expect(await screen.findByDisplayValue("nick")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("nick@test.com")).toBeInTheDocument();
  });

  it("loads and displays events in dropdown", async () => {
    apiFetch.mockResolvedValueOnce([{ id: 42, name: "Winter Games", date: "2025-12-01" }]);

    renderWithAuth(<EventRegistration />, { user: { username: "nick" } });

    const eventSelect = await screen.findByLabelText("Event");
    fireEvent.mouseDown(eventSelect);
    expect(await screen.findByText(/Winter Games/)).toBeInTheDocument();
  });

  it("shows chosen heroes in dropdown", async () => {
    apiFetch.mockResolvedValueOnce([]);
    renderWithAuth(<EventRegistration chosenHeroes={[{ id: 10, name: "Spiderman", alias: "Webslinger" }]} />, {
      user: { username: "nick" },
    });

    const heroSelect = await screen.findByLabelText("Hero");
    fireEvent.mouseDown(heroSelect);
    expect(await screen.findByText(/Spiderman/)).toBeInTheDocument();
  });

  it("submits form successfully", async () => {
    apiFetch.mockResolvedValueOnce([{ id: 1, name: "Hero Cup" }]); // events
    apiFetch.mockResolvedValueOnce({ id: 99, name: "nick" }); // entrant created

    renderWithAuth(<EventRegistration chosenHeroes={[{ id: 1, name: "Batman" }]} />, {
      user: { username: "nick", email: "nick@test.com" },
    });

    // Wait for events
    await screen.findByText(/Hero Cup/);

    fireEvent.change(screen.getByLabelText("Event"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Hero"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Register/ }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/entrants", expect.any(Object));
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error when submission fails", async () => {
    apiFetch.mockResolvedValueOnce([{ id: 1, name: "Hero Cup" }]);
    apiFetch.mockRejectedValueOnce(new Error("Registration failed"));

    renderWithAuth(<EventRegistration chosenHeroes={[{ id: 1, name: "Batman" }]} />, {
      user: { username: "nick" },
    });

    await screen.findByText(/Hero Cup/);

    fireEvent.change(screen.getByLabelText("Event"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Hero"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Register/ }));

    expect(await screen.findByText(/Registration failed/)).toBeInTheDocument();
  });
});
