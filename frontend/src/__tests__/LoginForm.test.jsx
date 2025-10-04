// Purpose: Tests for LoginForm component.
// Notes:
// - Uses renderWithRouter to wrap AuthProvider/MemoryRouter.
// - Less strict assertions: roles, text content, and test ids.

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../components/LoginForm";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess, mockFetchFailure } from "../setupTests";

describe("LoginForm", () => {
  test("renders username and password fields", () => {
    renderWithRouter(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test("successful login stores token and redirects", async () => {
    mockFetchSuccess({ access_token: "token123", user: { username: "bob" } });

    renderWithRouter(<LoginForm />, { route: "/login" });
    await userEvent.type(screen.getByLabelText(/email/i), "bob@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pw123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("token123");
    });
  });

  test("shows error on invalid credentials", async () => {
    mockFetchFailure({ error: "Invalid credentials" });

    renderWithRouter(<LoginForm />, { route: "/login" });
    await userEvent.type(screen.getByLabelText(/email/i), "bad@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/login failed/i);
  });
});
