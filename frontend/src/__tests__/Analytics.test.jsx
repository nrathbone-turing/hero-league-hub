// File: frontend/src/__tests__/Analytics.test.jsx
// Purpose: Verifies rendering, tab switching, and API data loading.

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import Analytics from "../components/Analytics";
import { mockFetchSuccess } from "../setupTests";

describe("Analytics Component", () => {
  test("renders analytics page with default Hero Usage tab", async () => {
    mockFetchSuccess({
      heroes: [
        { hero_name: "Superman", usage_count: 10, win_rate: 0.75 },
        { hero_name: "Batman", usage_count: 8, win_rate: 0.65 },
      ],
      participation: [],
    });

    renderWithRouter(<Analytics />);
    expect(await screen.findByTestId("analytics-header")).toHaveTextContent(
      "Hero League Analytics"
    );

    const chart = await screen.findByTestId("chart-usage");
    expect(chart).toBeInTheDocument();

    await waitFor(() => {
      const slices = within(chart).getAllByTestId(/usage-slice-/i);
      expect(slices.length).toBeGreaterThan(0);
    });
  });

  test("switches between tabs correctly", async () => {
    renderWithRouter(<Analytics />);
    await waitFor(() =>
      expect(screen.getByTestId("chart-usage")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByTestId("tab-winrates"));
    expect(screen.getByTestId("chart-winrates")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("tab-participation"));
    expect(screen.getByTestId("chart-participation")).toBeInTheDocument();
  });
});
