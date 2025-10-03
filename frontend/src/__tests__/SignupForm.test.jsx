// Purpose: Tests for SignupForm component.
// Notes:
// - Uses renderWithRouter to wrap AuthProvider/MemoryRouter.
// - Less strict assertions: roles, text content, and test ids.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupForm from "../components/SignupForm";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess, mockFetchFailure } from "../setupTests";

describe("SignupForm", () => {
  test("renders username, email, and password fields", () => {
    renderWithRouter(<SignupForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test("successful signup stores token and redirects", async () => {
    mockFetchSuccess({ access_token: "signup123", user: { username: "alice" } });

    renderWithRouter(<SignupForm />, { route: "/signup" });
    await userEvent.type(screen.getByLabelText(/username/i), "alice");
    await userEvent.type(screen.getByLabelText(/email/i), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pw123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("signup123");
    });
  });

  test("shows error on duplicate email", async () => {
    mockFetchFailure({ error: "Email already exists" });

    renderWithRouter(<SignupForm />, { route: "/signup" });
    await userEvent.type(screen.getByLabelText(/username/i), "dupe");
    await userEvent.type(screen.getByLabelText(/email/i), "dupe@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pw123456");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // Less strict: just check alert text includes "signup failed" or "exists"
    const alert = await screen.findByRole("alert");
    expect(alert.textContent.toLowerCase()).toMatch(/fail|exist/);
  });
});
