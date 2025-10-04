// File: frontend/src/__tests__/EntrantDashboard.test.jsx
// Purpose: Tests for EntrantDashboard component.
// Notes:
// - Only tests form behavior (EventDetail owns entrant list).
// - Ensures callback is called after POST.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import EntrantDashboard from "../components/EntrantDashboard";
import { mockFetchSuccess } from "../setupTests";

describe("EntrantDashboard", () => {
  test("renders form", () => {
    renderWithRouter(<EntrantDashboard eventId={1} />, { route: "/" });
    expect(screen.getByRole("heading", { name: /add entrant/i })).toBeInTheDocument();
  });

  test("submits new entrant and triggers callback", async () => {
    const mockOnAdded = vi.fn();
    mockFetchSuccess({
      id: 3,
      name: "Wonder Woman",
      alias: "Amazon Princess",
      event_id: 1,
      dropped: false,
    });

    renderWithRouter(<EntrantDashboard eventId={1} onEntrantAdded={mockOnAdded} />, {
      route: "/",
    });
    await userEvent.type(screen.getByLabelText(/name/i), "Wonder Woman");
    await userEvent.type(screen.getByLabelText(/alias/i), "Amazon Princess");
    await userEvent.click(screen.getByRole("button", { name: /add entrant/i }));

    await waitFor(() => expect(mockOnAdded).toHaveBeenCalled());
  });
});

describe("EntrantDashboard - edge cases", () => {
  test("blocks submission when fields are empty", async () => {
    renderWithRouter(<EntrantDashboard eventId={1} />, { route: "/" });
    await userEvent.click(screen.getByRole("button", { name: /add entrant/i }));
    // expect inline error message
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to add entrant/i
    );
  });

  test("shows error when API call fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    renderWithRouter(<EntrantDashboard eventId={1} />, { route: "/" });
    await userEvent.type(screen.getByLabelText(/name/i), "ErrorHero");
    await userEvent.type(screen.getByLabelText(/alias/i), "Oops");
    await userEvent.click(screen.getByRole("button", { name: /add entrant/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to add entrant/i
    );
  });

  test("ignores duplicate submission (double click)", async () => {
    const mockOnAdded = vi.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 10, name: "Flash", alias: "Barry" }),
    });

    renderWithRouter(<EntrantDashboard eventId={1} onEntrantAdded={mockOnAdded} />, {
      route: "/",
    });

    await userEvent.type(screen.getByLabelText(/name/i), "Flash");
    await userEvent.type(screen.getByLabelText(/alias/i), "Barry");

    const button = screen.getByRole("button", { name: /add entrant/i });

    // First click triggers submitting state
    await userEvent.click(button);

    // Wait for React to re-render disabled button
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /adding.../i })).toBeDisabled()
    );

    // Ensure callback only fired once
    expect(mockOnAdded).toHaveBeenCalledTimes(1);
  });
});
