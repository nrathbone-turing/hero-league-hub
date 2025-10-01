// File: frontend/src/context/AuthContext.js
// Purpose: Provides authentication context and helper functions.
// Notes:
// - Stores current user and JWT token in localStorage.
// - Uses centralized apiFetch for all API calls.
// - Exposes signup, login, logout, and isAuthenticated.

import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Signup
  const signup = async (username, email, password) => {
    const data = await apiFetch("/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    const newToken = data.access_token || data.token;
    if (newToken) setToken(newToken);

    const userData = data.user || { username, email };
    const normalized = { ...userData, is_admin: userData.is_admin ?? false };
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

    const userData = data.user || { username: email.split("@")[0], email };
    const normalized = { ...userData, is_admin: userData.is_admin ?? false };
    setUser(normalized);

    return data;
  };

  // Logout
  const logout = async () => {
    try {
      await apiFetch("/logout", { method: "DELETE" });
    } catch (err) {
      console.warn("⚠️ Logout API failed, clearing locally:", err.message);
    }
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    setUser,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
