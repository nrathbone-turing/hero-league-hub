// File: frontend/src/context/AuthContext.js
// Purpose: Provides authentication context and helper functions.
// Notes:
// - Stores current user and JWT token in localStorage.
// - Uses centralized apiFetch for all API calls.
// - Exposes signup, login, logout, validateToken, and isAuthenticated.
// - Skips token validation automatically during tests (NODE_ENV=test).
// - Safe use of useNavigate (only called inside component, not top-level).

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  // persist token
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // -------------------------
  // Helper: validate token
  // -------------------------
  const validateToken = useCallback(async () => {
    if (!token) return false;
    try {
      const res = await apiFetch("/protected"); // backend validates JWT
      console.log("✅ Token validated:", res);
      return true;
    } catch (err) {
      console.warn("⚠️ Invalid/expired token, logging out:", err.message);
      logout(true); // auto redirect on failure
      return false;
    }
  }, [token]);

  // run token validation once on mount (skip in tests)
  useEffect(() => {
    if (process.env.NODE_ENV !== "test") {
      validateToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signup
  const signup = async (username, email, password) => {
    const data = await apiFetch("/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    const newToken = data.access_token || data.token;
    if (newToken) setToken(newToken);

    const normalized = {
      ...(data.user || { username, email }),
      is_admin: data.user?.is_admin ?? false,
    };
    setUser(normalized);

    return data;
  };

  // Login
  const login = async (email, password) => {
    const data = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const newToken = data.access_token || data.token;
    if (newToken) setToken(newToken);

    const normalized = {
      ...(data.user || { username: email.split("@")[0], email }),
      is_admin: data.user?.is_admin ?? false,
    };
    setUser(normalized);

    return data;
  };

  // Logout
  const logout = useCallback(
    async (redirect = false) => {
      try {
        await apiFetch("/logout", { method: "DELETE" });
      } catch (err) {
        console.warn("⚠️ Logout API failed, clearing locally:", err.message);
      }
      setToken(null);
      setUser(null);

      if (redirect) {
        navigate("/login");
      }
    },
    [navigate]
  );

  const value = {
    user,
    token,
    setUser,
    signup,
    login,
    logout,
    validateToken,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
