// File: frontend/src/context/AuthContext.js
// Purpose: Provides authentication context and helper functions.
// Notes:
// - Stores current user and JWT token.
// - Exposes login, signup, and logout methods.
// - Persists token in localStorage for reloads.
// - Provides isAuthenticated flag.

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const signup = async (username, email, password) => {
    const data = await apiFetch("/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    const newToken = data.access_token || data.token;
    if (newToken) setToken(newToken);
    setUser({ username, email });
    return data;
  };

  const login = async (email, password) => {
    const data = await apiFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const newToken = data.access_token || data.token;
    if (newToken) setToken(newToken);
    setUser({ username: email.split("@")[0], email });
    return data;
  };

  const logout = () => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
