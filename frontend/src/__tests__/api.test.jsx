// File: frontend/src/__tests__/api.test.jsx
import { apiFetch, deleteEntrant } from "../api";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("adds Authorization header when token exists", async () => {
    localStorage.setItem("token", "abc123");
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ msg: "ok" }),
    });

    const data = await apiFetch("/events");
    expect(data.msg).toBe("ok");

    const call = global.fetch.mock.calls[0];
    expect(call[1].headers.Authorization).toBe("Bearer abc123");
  });

  test("returns true for 204 responses", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    const result = await apiFetch("/events/1", { method: "DELETE" });
    expect(result).toBe(true);
  });

  test("throws error on failure", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({ error: "boom" }),
    });
    await expect(apiFetch("/events")).rejects.toThrow(/boom/);
  });
});

describe("deleteEntrant", () => {
  test("calls apiFetch with DELETE", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });
    await deleteEntrant(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/entrants\/5$/),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
