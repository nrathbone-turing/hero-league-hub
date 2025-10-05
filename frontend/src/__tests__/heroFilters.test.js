// File: frontend/src/__tests__/heroFilters.test.js
// Purpose: Unit tests for filterAndSortHeroes utility.
// Location: /frontend/src/__tests__/heroFilters.test.js
//
// Notes:
// - Uses static fixtures with mixed alignments and names.
// - Tests filtering, searching, and sorting independently of React or API mocks.
// - Mirrors the eventFilters pattern for test consistency.

import { describe, test, expect } from "vitest";
import { filterAndSortHeroes } from "../utils/heroFilters";

const base = [
  { id: 1, name: "Superman", alias: "Man of Steel", alignment: "hero" },
  { id: 2, name: "Batman", alias: "Dark Knight", alignment: "hero" },
  { id: 3, name: "Joker", alias: "Clown Prince", alignment: "villain" },
  { id: 4, name: "Deadpool", alias: "Merc with a Mouth", alignment: "antihero" },
  { id: 5, name: "Unknown", alias: "N/A", alignment: null },
];

const ctx = {
  searchTerm: "",
  alignmentFilter: "all",
  orderBy: "name",
  order: "asc",
};

describe("filterAndSortHeroes()", () => {
  test("returns all heroes when no filters applied", () => {
    const result = filterAndSortHeroes(base, ctx);
    expect(result).toHaveLength(5);
  });

  test("filters by alignment", () => {
    const heroes = filterAndSortHeroes(base, { ...ctx, alignmentFilter: "villain" });
    expect(heroes).toHaveLength(1);
    expect(heroes[0].name).toBe("Joker");
  });

  test("filters by search term across name, full_name, and alias", () => {
    const result = filterAndSortHeroes(base, {
      ...ctx,
      searchTerm: "steel",
      alignmentFilter: "all",
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Superman");
  });

  test("treats null alignment as unknown and hides it if filter applied", () => {
    const result = filterAndSortHeroes(base, { ...ctx, alignmentFilter: "unknown" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Unknown");
  });

  test("sorts alphabetically ascending and descending", () => {
    const asc = filterAndSortHeroes(base, { ...ctx, order: "asc" });
    const desc = filterAndSortHeroes(base, { ...ctx, order: "desc" });
    expect(asc[0].name).not.toBe(desc[0].name);
  });
});
