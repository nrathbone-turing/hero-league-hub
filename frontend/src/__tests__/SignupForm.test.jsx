import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test-utils";
import { mockFetchSuccess, mockFetchFailure } from "../setupTests";
import SignupForm from "../components/SignupForm";

describe("SignupForm", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("renders username, email, and password fields", () => {
    renderWithRouter(<SignupForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test("successful signup stores token and redirects", async () => {
    mockFetchSuccess({
      access_token: "fake-signup-token",
      user: { username: "newuser", email: "n@example.com", is_admin: false },
    });

    renderWithRouter(<SignupForm />, { route: "/signup" });
    await userEvent.type(screen.getByLabelText(/username/i), "newuser");
    await userEvent.type(screen.getByLabelText(/email/i), "n@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(localStorage.getItem("token")).toBe("fake-signup-token");
  });

  test("shows error on duplicate email", async () => {
    mockFetchFailure({ error: "Email already exists" });

    renderWithRouter(<SignupForm />);
    await userEvent.type(screen.getByLabelText(/username/i), "dupe");
    await userEvent.type(screen.getByLabelText(/email/i), "dupe@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });
});
