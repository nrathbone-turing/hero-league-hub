// File: frontend/src/test-utils.js
// Purpose: Custom render utilities for Vitest.
// Notes:
// - Wraps components in MemoryRouter and AuthProvider so both routing and auth context are available.
// - Extend later with more providers (Redux, other contexts, etc).

import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthProvider from "./context/AuthContext";

export function renderWithRouter(ui, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
