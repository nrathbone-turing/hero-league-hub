// frontend/src/test-utils.js
// Purpose: Custom render utilities for Vitest.
// Notes:
// - Wraps components in MemoryRouter so <Link>/<Route> always have context.
// - Extend later with more providers (Redux, Context, etc).

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

export function renderWithRouter(ui, { route = "/" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
