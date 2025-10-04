// File: frontend/src/__tests__/Analytics.test.jsx
// Purpose: Robust tests for Analytics tabs and charts.
// Notes:
// - Uses data-testid and aria-labels for reliable queries (avoids text-only assertions).

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Analytics from "../components/Analytics";

describe("Analytics Component", () => {
  beforeEach(() => {
    renderWithRouter(<Analytics />);
  });

  test("renders analytics page with default Hero Usage tab", async () => {
    const page = await screen.findByTestId("analytics-page");
    expect(page).toBeInTheDocument();
    expect(screen.getByTestId("analytics-title")).toHaveTextContent(
      /Hero League Analytics/i
    );

    // Default tab content
    expect(screen.getByTestId("chart-usage")).toBeInTheDocument();
    const chart = screen.getByLabelText("Hero Usage Chart");
    expect(within(chart).getAllByTestId(/usage-slice-/i).length).toBeGreaterThan(0);
  });

  test("switches to Win Rates tab and shows correct chart", async () => {
    const winTab = screen.getByTestId("tab-winrates");
    await userEvent.click(winTab);

    const winChart = await screen.findByTestId("chart-winrates");
    expect(winChart).toBeInTheDocument();
    expect(within(winChart).getByLabelText("Hero Win Rates Bar Chart")).toBeVisible();
  });

  test("switches to Participation tab and shows correct chart", async () => {
    const participationTab = screen.getByTestId("tab-participation");
    await userEvent.click(participationTab);

    const partChart = await screen.findByTestId("chart-participation");
    expect(partChart).toBeInTheDocument();
    expect(within(partChart).getByLabelText("Event Participation Bar Chart")).toBeVisible();
  });
});
