// File: frontend/src/__tests__/AuthFlow.test.jsx
// Purpose: Tests authentication flow and protected routes with Vitest.
// Notes:
// - Uses renderWithRouter for navigation simulation.
// - Mocks login/signup/events responses.

import { screen, fireEvent } from "@testing-library/react";
import { renderWithRouter } from "../test-utils.jsx";
import App from "../App";

beforeEach(() => {
  global.fetch = vi.fn((url, options) => {
    if (url.endsWith("/login")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ access_token: "fake-token" }),
      });
    }
    if (url.endsWith("/signup")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ username: "newuser", email: "new@example.com" }),
      });
    }
    if (url.includes("/events")) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { id: 1, name: "Hero Cup", date: "2025-09-12", status: "published" },
        ],
      });
    }
    return Promise.resolve({ ok: false, status: 404 });
  });
});

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

test("redirects unauthenticated user from / to /login", async () => {
  renderWithRouter(<App />, { route: "/" });
  expect(
    await screen.findByRole("button", { name: /log in/i }),
  ).toBeInTheDocument();
});

test("successful login redirects to dashboard", async () => {
  renderWithRouter(<App />, { route: "/login" });

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "pw123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /log in/i }));

  expect(await screen.findByText(/Welcome, test/i)).toBeInTheDocument();
});

test("navbar shows signup/login when logged out", async () => {
  renderWithRouter(<App />, { route: "/" });
  expect(
    await screen.findByRole("button", { name: /log in/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /signup/i })).toBeInTheDocument();
});

test("navbar shows welcome + logout when logged in", async () => {
  renderWithRouter(<App />, { route: "/login" });

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "pw123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /log in/i }));

  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
});

test("logout clears auth and redirects to login", async () => {
  renderWithRouter(<App />, { route: "/login" });

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "pw123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /log in/i }));

  const logoutBtn = await screen.findByRole("button", { name: /logout/i });
  fireEvent.click(logoutBtn);

  await screen.findByRole("button", { name: /log in/i });
});
