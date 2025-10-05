// File: frontend/src/__tests__/api.test.jsx
// Purpose: Verify apiFetch and deleteEntrant behavior end-to-end with real Response objects.
// No mocking of apiFetch — only minimal fetch stubbing with real Response semantics.

import { apiFetch, deleteEntrant } from "../api";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("adds Authorization header when token exists", async () => {
    localStorage.setItem("token", "abc123");

    const mockResponse = { msg: "ok" };
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const data = await apiFetch("/events");
    expect(data).toEqual(mockResponse);

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/events");
    expect(opts.headers.Authorization).toBe("Bearer abc123");
  });

  test("returns true for 204 responses", async () => {
    global.fetch.mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );

    const result = await apiFetch("/events/1", { method: "DELETE" });
    expect(result).toBe(true);

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/events/1");
    expect(opts.method).toBe("DELETE");
  });

  test("throws an error when response is not ok", async () => {
    const errorBody = { error: "boom" };
    global.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify(errorBody), { status: 500, statusText: "Server Error" })
    );

    await expect(apiFetch("/events")).rejects.toThrow("boom");
  });
});

describe("deleteEntrant", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 })
    );
  });

  test("calls apiFetch with DELETE and correct URL", async () => {
    const result = await deleteEntrant(5);
    expect(result).toBe(true);

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/entrants/5");
    expect(opts.method).toBe("DELETE");
  });
});
