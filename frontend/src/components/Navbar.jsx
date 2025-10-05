// File: frontend/src/components/Navbar.jsx
// Purpose: Global navigation bar with modern polish and active route highlighting.
// Notes:
// - Matches Hero vs Villain Showdown blue theme for consistency.
// - Highlights active route with underline and bold text.
// - Auth-aware: shows Login/Signup when logged out; Welcome + Logout when logged in.

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
} from "@mui/material";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { label: "Heroes", to: "/heroes", testid: "nav-heroes" },
    { label: "Events", to: "/events", testid: "nav-events" },
    { label: "Analytics", to: "/analytics", testid: "nav-analytics" },
  ];

  return (
    <AppBar
      position="static"
      color="primary"
      elevation={3}
      data-testid="navbar"
      aria-label="main navigation"
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 3,
          minHeight: 64,
        }}
      >
        {/* Left: Logo / Title */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: "none",
            color: "#fff",
            fontWeight: "bold",
            "&:hover": { textDecoration: "underline" },
          }}
          aria-label="home link"
          data-testid="nav-title"
        >
          Hero League Hub
        </Typography>

        {/* Center: Navigation links */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {navLinks.map((link) => {
            const active = location.pathname.startsWith(link.to);
            return (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                color="inherit"
                sx={{
                  color: "#fff",
                  fontWeight: active ? "bold" : "normal",
                  borderBottom: active ? "2px solid white" : "none",
                  borderRadius: 0,
                  "&:hover": {
                    borderBottom: "2px solid white",
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
                aria-label={`${link.label} navigation`}
                data-testid={link.testid}
              >
                {link.label}
              </Button>
            );
          })}
        </Box>

        {/* Right: Auth-aware actions */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {!user ? (
            <>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{ color: "#fff", borderColor: "#fff" }}
                data-testid="nav-login"
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                color="secondary"
                data-testid="nav-signup"
              >
                Signup
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="body1"
                sx={{ alignSelf: "center", fontWeight: 500, color: "#fff" }}
                data-testid="nav-welcome"
              >
                Welcome {user.username}
              </Typography>
              <Button
                onClick={handleLogout}
                variant="outlined"
                sx={{
                  color: "#fff",
                  borderColor: "#fff",
                  "&:hover": { backgroundColor: theme.palette.primary.dark },
                }}
                aria-label="logout"
                data-testid="nav-logout"
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
