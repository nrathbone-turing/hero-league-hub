// File: frontend/src/__tests__/Analytics.test.jsx
// Purpose: Verifies rendering, tab switching, and data loading for Analytics component.
// Notes:
// - Mocks API responses for /api/analytics/* endpoints.
// - Confirms hero usage, win rates, and participation charts render correctly.

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Analytics from "../components/Analytics";

describe("Analytics Component", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/analytics/heroes")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            heroes: [
              { name: "Superman", usage_rate: 0.3, win_rate: 0.75 },
              { name: "Batman", usage_rate: 0.25, win_rate: 0.68 },
            ],
          }),
        });
      }
      if (url.includes("/analytics/results")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ events: [] }),
        });
      }
      if (url.includes("/analytics/usage")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            participation: [
              { event: "Hero Cup", participants: 10 },
              { event: "Villain Showdown", participants: 8 },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders analytics page with default Hero Usage tab", async () => {
    renderWithRouter(<Analytics />);

    // Verify header and default tab render
    expect(await screen.findByTestId("analytics-header")).toHaveTextContent(
      "Hero League Analytics"
    );

    const chart = await screen.findByTestId("chart-usage");
    expect(chart).toBeInTheDocument();

    // Confirm pie slices render for each hero
    await waitFor(() => {
      const slices = within(chart).getAllByTestId(/usage-slice-/i);
      expect(slices.length).toBeGreaterThan(0);
    });
  });

  test("switches between tabs and renders charts", async () => {
    renderWithRouter(<Analytics />);

    // Wait for initial chart
    await waitFor(() =>
      expect(screen.getByTestId("chart-usage")).toBeInTheDocument()
    );

    // Switch to Win Rates tab
    await userEvent.click(screen.getByTestId("tab-winrates"));
    await waitFor(() =>
      expect(screen.getByTestId("chart-winrates")).toBeInTheDocument()
    );

    // Switch to Participation tab
    await userEvent.click(screen.getByTestId("tab-participation"));
    await waitFor(() =>
      expect(screen.getByTestId("chart-participation")).toBeInTheDocument()
    );
  });
});
