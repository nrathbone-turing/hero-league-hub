// File: frontend/src/test-utils.js
// Purpose: Custom render utilities for Vitest.
// Notes:
// - Ensures MemoryRouter always wraps AuthProvider so useNavigate has context.
// - Extend later with more providers if needed.

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
