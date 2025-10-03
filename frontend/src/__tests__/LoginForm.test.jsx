import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess, mockFetchFailure } from "../setupTests";
import LoginForm from "../components/LoginForm";

describe("LoginForm", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("renders username and password fields", () => {
    renderWithRouter(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test("successful login stores token and redirects", async () => {
    mockFetchSuccess({
      access_token: "fake-jwt-token",
      user: { username: "tester", email: "t@example.com", is_admin: false },
    });

    renderWithRouter(<LoginForm />, { route: "/login" });

    await userEvent.type(screen.getByLabelText(/email/i), "t@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(localStorage.getItem("token")).toBe("fake-jwt-token")
    );
  });

  test("shows error on invalid credentials", async () => {
    mockFetchFailure({ error: "Invalid credentials" });

    renderWithRouter(<LoginForm />, { route: "/login" });
    await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "badpass");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
