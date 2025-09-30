// File: frontend/src/__tests__/MatchDashboard.test.jsx
// Purpose: Tests for MatchDashboard component.
// Notes:
// - Verifies casting, validation, success, and failure flows.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import MatchDashboard from "../components/MatchDashboard";
import { mockFetchSuccess, mockFetchFailure } from "../setupTests";

describe("MatchDashboard", () => {
  test("renders Add Match form", () => {
    renderWithRouter(<MatchDashboard eventId={1} />, { route: "/" });
    expect(
      screen.getByRole("heading", { name: /add match/i }),
    ).toBeInTheDocument();
  });

  test("submits new match with numeric IDs", async () => {
    const mockOnAdded = jest.fn();
    mockFetchSuccess({
      id: 99,
      round: 1,
      entrant1_id: 1,
      entrant2_id: 2,
      scores: "2-0",
      winner_id: 1,
      event_id: 1,
    });

    renderWithRouter(
      <MatchDashboard eventId={1} onMatchAdded={mockOnAdded} />,
      {
        route: "/",
      },
    );
    await userEvent.type(screen.getByLabelText(/round/i), "1");
    await userEvent.type(screen.getByLabelText(/entrant 1 id/i), "1");
    await userEvent.type(screen.getByLabelText(/entrant 2 id/i), "2");
    await userEvent.type(screen.getByLabelText(/scores/i), "2-0");
    await userEvent.type(screen.getByLabelText(/winner id/i), "1");
    await userEvent.click(screen.getByRole("button", { name: /add match/i }));

    await waitFor(() => expect(mockOnAdded).toHaveBeenCalled());
  });

  test("shows error when winner_id does not match entrants", async () => {
    renderWithRouter(<MatchDashboard eventId={1} />, { route: "/" });
    await userEvent.type(screen.getByLabelText(/round/i), "1");
    await userEvent.type(screen.getByLabelText(/entrant 1 id/i), "1");
    await userEvent.type(screen.getByLabelText(/entrant 2 id/i), "2");
    await userEvent.type(screen.getByLabelText(/scores/i), "2-0");
    await userEvent.type(screen.getByLabelText(/winner id/i), "99");
    await userEvent.click(screen.getByRole("button", { name: /add match/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /winner id must match one of the entrants/i,
    );
  });

  test("shows error on API failure", async () => {
    mockFetchFailure();
    renderWithRouter(<MatchDashboard eventId={1} />, { route: "/" });
    await userEvent.type(screen.getByLabelText(/round/i), "1");
    await userEvent.type(screen.getByLabelText(/entrant 1 id/i), "1");
    await userEvent.type(screen.getByLabelText(/entrant 2 id/i), "2");
    await userEvent.type(screen.getByLabelText(/scores/i), "2-0");
    await userEvent.type(screen.getByLabelText(/winner id/i), "1");
    await userEvent.click(screen.getByRole("button", { name: /add match/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to add match/i,
    );
  });
});
