// File: frontend/src/__tests__/eventFilters.test.js
// Purpose: Unit tests for filterAndSortEvents utility.
// Location: /frontend/src/__tests__/eventFilters.test.js
//
// Notes:
// - Uses a static base fixture with mixed statuses (published, completed, cancelled, drafting).
// - Tests each filter rule and sort order independently of React/MUI.
// - Verifies data-level correctness (the pure function’s job), not UI rendering.

import { describe, test, expect } from "vitest";
import { filterAndSortEvents } from "../utils/eventFilters";

const base = [
  { id: 1, name: "Alpha", status: "published", date: "2025-01-01" },
  { id: 2, name: "Beta", status: "completed", date: "2025-01-02" },
  { id: 3, name: "Gamma", status: "cancelled", date: "2025-01-03" },
  { id: 4, name: "Delta", status: "drafting", date: "2025-01-04" },
];

const ctx = {
  user: { is_admin: false },
  searchTerm: "",
  statusFilter: "published",
  includeCancelled: false,
  orderBy: "date",
  order: "asc",
};

describe("filterAndSortEvents()", () => {
  test("hides drafting events for non-admins", () => {
    const result = filterAndSortEvents(base, ctx);
    expect(result.some((e) => e.status === "drafting")).toBe(false);
  });

  test("hides cancelled when includeCancelled=false", () => {
    const result = filterAndSortEvents(base, { ...ctx, statusFilter: "all" });
    expect(result.some((e) => e.status === "cancelled")).toBe(false);
  });

  test("shows cancelled when includeCancelled=true", () => {
    const result = filterAndSortEvents(base, {
      ...ctx,
      includeCancelled: true,
      statusFilter: "all",
    });
    expect(result.some((e) => e.status === "cancelled")).toBe(true);
  });

  test("filters by search term", () => {
    const result = filterAndSortEvents(base, {
      ...ctx,
      searchTerm: "beta",
      statusFilter: "all",
      includeCancelled: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Beta");
  });

  test("sorts correctly by date ascending and descending", () => {
    const asc = filterAndSortEvents(base, {
      ...ctx,
      includeCancelled: true,
      statusFilter: "all",
      order: "asc",
    });
    const desc = filterAndSortEvents(base, {
      ...ctx,
      includeCancelled: true,
      statusFilter: "all",
      order: "desc",
    });
    expect(asc[0].id).not.toBe(desc[0].id);
  });
});
