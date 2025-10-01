// File: frontend/src/components/SignupForm.jsx
// Purpose: Signup form for new users with Material UI styling.
// Notes:
// - Calls useAuth().signup which uses centralized apiFetch.
// - Redirects to / after successful signup.
// - Displays success or error message.

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";

export default function SignupForm() {
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(username, email, password);
      setMessage(`✅ Signed up as ${username}`);
      setTimeout(() => navigate("/"), 1000);
    } catch {
      setMessage("❌ Signup failed — please try again");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Sign Up
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" fullWidth>
            Sign Up
          </Button>
          {message && (
            <Typography
              color={message.startsWith("✅") ? "success.main" : "error"}
              role="alert"
            >
              {message}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
