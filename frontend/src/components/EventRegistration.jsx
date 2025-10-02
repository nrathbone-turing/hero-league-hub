// File: frontend/src/components/EventRegistration.jsx
// Purpose: Allow logged-in users to register for an event with prefilled info.
// Notes:
// - Auto-fills name, username, email from auth context.
// - Dropdowns for event selection and hero selection.
// - Submits to /api/entrants.
// - Displays confirmation on success.

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function EventRegistration({ chosenHeroes = [] }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.username || "",
    username: user?.username || "",
    email: user?.email || "",
    event_id: "",
    hero_id: "",
    notes: "",
  });

  // Load events on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await apiFetch("/events");
        setEvents(data);
        setLoadingEvents(false);
      } catch (err) {
        setError("Failed to load events");
        setLoadingEvents(false);
      }
    }
    fetchEvents();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      await apiFetch("/entrants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          alias: formData.username,
          event_id: Number(formData.event_id), // ✅ ensure numeric
          hero_id: Number(formData.hero_id),   // ✅ ensure numeric
          notes: formData.notes,
        }),
      });
      navigate("/dashboard");
    } catch (err) {
      // Handle both thrown Error and { error: "..."} objects
      const msg = err?.error || err?.message || "Registration failed";
      setError(msg);
    }
  }

  return (
    <Container sx={{ mt: 4 }} maxWidth="sm" data-testid="event-registration">
      <Typography variant="h4" gutterBottom>
        Register for an Event
      </Typography>

      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          name="name"
          value={formData.name}
          fullWidth
          margin="normal"
          onChange={handleChange}
        />
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          fullWidth
          margin="normal"
          onChange={handleChange}
        />
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          fullWidth
          margin="normal"
          onChange={handleChange}
        />

        {loadingEvents ? (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TextField
            select
            label="Event"
            name="event_id"
            value={formData.event_id}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          >
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name} ({event.date || "TBA"})
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          label="Hero"
          name="hero_id"
          value={formData.hero_id}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        >
          {chosenHeroes.length === 0 ? (
            <MenuItem value="">No heroes selected yet</MenuItem>
          ) : (
            chosenHeroes.map((hero) => (
              <MenuItem key={hero.id} value={hero.id}>
                {hero.name} ({hero.alias || "No alias"})
              </MenuItem>
            ))
          )}
        </TextField>

        <TextField
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button type="submit" variant="contained" color="primary">
            Register
          </Button>
        </Box>
      </form>
    </Container>
  );
}
