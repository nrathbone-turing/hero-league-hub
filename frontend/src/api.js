// File: frontend/src/api.js
// Purpose: Centralize API base URL and inject JWT auth headers into fetch calls.
// Notes:
// - Uses Vite's import.meta.env for environment variables.
// - Always prefixes with /api (handled by Vite proxy in dev).
// - Wraps fetch calls with Authorization header if token exists.
// - Adds console.error logging for failures.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Get headers including Authorization if token exists
function getAuthHeaders(customHeaders = {}) {
  const token = localStorage.getItem("token"); // matches AuthContext localStorage key
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
}

// Generic fetch wrapper
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;
  console.log("🔎 apiFetch:", url, options);

  const res = await fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers),
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
