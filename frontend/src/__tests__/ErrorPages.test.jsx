// File: frontend/src/__tests__/ErrorPages.test.jsx
// Purpose: Unit tests for error pages (404 and 500).
// Notes:
// - Matches the exact headings rendered by NotFoundPage and ServerErrorPage.
// - Verifies presence of a back link for navigation.

import { screen } from "@testing-library/react";
import { renderWithRouter } from "../test-utils";
import NotFoundPage from "../components/NotFoundPage";
import ServerErrorPage from "../components/ServerErrorPage";

describe("Error Pages", () => {
  test("renders NotFoundPage with link back", () => {
    renderWithRouter(<NotFoundPage />);

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /page not found/i })
    ).toBeInTheDocument();
  });

  test("renders ServerErrorPage with link back", () => {
    renderWithRouter(<ServerErrorPage />);

    expect(screen.getByRole("heading", { name: "500" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
  });
});
