// File: frontend/src/api.js
// Purpose: Centralize API base URL and inject JWT auth headers into fetch calls.
// Notes:
// - Wraps fetch calls with Authorization header if token exists.
// - Adds console.error logging for failures.
// - Exports helper for DELETE entrant (others can reuse apiFetch).

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5500";

// Get headers including Authorization if token exists
function getAuthHeaders() {
  const token = localStorage.getItem("token"); // matches AuthContext localStorage key
  return token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : { "Content-Type": "application/json" };
}

// Generic fetch wrapper
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("🔎 apiFetch:", url, options);

  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `API error: ${res.status} ${res.statusText || ""}`.trim();
    try {
      const body = await res.json();
      if (body?.error) message = body.error; // prefer backend error messages
    } catch {
      /* ignore parse error */
    }
    console.error("❌ apiFetch failed:", url, message);
    throw new Error(message);
  }

  // If no body (204), return true
  if (res.status === 204) return true;

  return res.json();
}

// Delete entrant by ID
export async function deleteEntrant(entrantId) {
  return apiFetch(`/entrants/${entrantId}`, { method: "DELETE" });
}
