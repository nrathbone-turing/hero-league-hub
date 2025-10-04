// File: frontend/src/__tests__/Analytics.test.jsx
// Purpose: Verifies rendering and tab switching for Analytics component.
// Notes:
// - Uses stable DOM queries (legends, labels) instead of SVG slices for JSDOM compatibility.

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Analytics from "../components/Analytics";

describe("Analytics Component", () => {
  test("renders analytics page with default Hero Usage tab", async () => {
    renderWithRouter(<Analytics />);

    // Main heading
    expect(await screen.findByText(/Hero League Analytics/i)).toBeInTheDocument();

    // Chart container
    const chart = await screen.findByTestId("chart-usage");
    expect(chart).toBeInTheDocument();

    // Stable DOM: check legend labels (which are rendered)
    const heroNames = ["Superman", "Batman", "Wonder Woman", "Spiderman"];
    for (const name of heroNames) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
  });

  test("switches between tabs correctly", async () => {
    renderWithRouter(<Analytics />);

    const winRateTab = screen.getByRole("tab", { name: /Win Rates/i });
    await userEvent.click(winRateTab);
    expect(await screen.findByTestId("chart-winrates")).toBeInTheDocument();

    const participationTab = screen.getByRole("tab", { name: /Participation/i });
    await userEvent.click(participationTab);
    expect(await screen.findByTestId("chart-participation")).toBeInTheDocument();
  });
});
