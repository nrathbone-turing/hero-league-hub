// File: frontend/src/components/Navbar.jsx
// Purpose: Global navigation bar with auth-aware UI.
// Notes:
// - Shows Login/Signup when logged out.
// - Shows Welcome + Logout when logged in.
// - Added navigation links for Heroes and Events.
// - Persists token handling via AuthContext.

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left: Logo / Title */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: "none",
            color: "inherit",
            fontWeight: "bold",
          }}
        >
          Hero Tournament Manager
        </Typography>

        {/* Center: Navigation links */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            component={Link}
            to="/heroes"
            color="inherit"
            data-testid="nav-heroes"
          >
            Heroes
          </Button>
          <Button
            component={Link}
            to="/events"
            color="inherit"
            data-testid="nav-events"
          >
            Events
          </Button>
        </Box>

        {/* Right: Auth-aware actions */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {!user ? (
            <>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                color="primary"
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                color="primary"
              >
                Signup
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="body1"
                sx={{ alignSelf: "center", fontWeight: "500" }}
              >
                Welcome {user.username}
              </Typography>
              <Button
                onClick={handleLogout}
                variant="outlined"
                color="secondary"
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
