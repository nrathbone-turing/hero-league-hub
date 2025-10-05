// File: frontend/src/utils/eventFilters.js
// Purpose: Pure data utilities for filtering and sorting events, independent of React or MUI.
// Context: Supports <Events /> page logic by handling filtering, search, and ordering in isolation.
//
// Parameters:
// - events: Array of event objects (each containing at least id, name, status, date)
// - options: {
//     user: { is_admin: boolean },
//     searchTerm: string,
//     statusFilter: "published" | "completed" | "all",
//     includeCancelled: boolean,
//     orderBy: string (usually "date"),
//     order: "asc" | "desc"
//   }
//
// Returns:
// - A new array of events filtered and sorted according to the provided options.
//
// Notes:
// - Drafting events are hidden from non-admins.
// - Cancelled events are excluded unless explicitly included.
// - Designed for unit testing without any DOM or API dependencies.

export function filterAndSortEvents(
  events,
  { user, searchTerm, statusFilter, includeCancelled, orderBy, order }
) {
  const filtered = (events || [])
    .filter((e) => {
      if (!user?.is_admin && e.status === "drafting") return false;
      if (!includeCancelled && e.status === "cancelled") return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    })
    .filter((e) => e.name?.toLowerCase().includes((searchTerm || "").toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[orderBy] ?? "";
    const valB = b[orderBy] ?? "";
    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}
