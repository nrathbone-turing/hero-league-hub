// File: frontend/src/__tests__/Analytics.test.jsx
// Purpose: Verifies rendering and tab switching for Analytics component.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Analytics from "../components/Analytics";

describe("Analytics", () => {
  test("renders the analytics page with default tab", async () => {
    renderWithRouter(<Analytics />);
    expect(await screen.findByText(/Hero League Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Hero Usage Distribution/i)).toBeInTheDocument();
  });

  test("switches between analytics tabs", async () => {
    renderWithRouter(<Analytics />);
    const winRateTab = screen.getByRole("tab", { name: /Win Rates/i });
    await userEvent.click(winRateTab);
    expect(screen.getByText(/Hero Win Rates/i)).toBeInTheDocument();

    const participationTab = screen.getByRole("tab", { name: /Participation/i });
    await userEvent.click(participationTab);
    expect(screen.getByText(/Event Participation/i)).toBeInTheDocument();
  });
});
