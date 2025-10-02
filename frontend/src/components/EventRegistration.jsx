// File: frontend/src/components/EventRegistration.jsx
// Purpose: Unified event + hero registration form.
// Notes:
// - Auto-fills user info from auth context.
// - Dropdowns for event + hero.
// - Preview card renders below hero dropdown after selection.
// - Small help text with link to /heroes for browsing info.
// - Submits to /api/entrants to create entrant record.

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
  Card,
  CardContent,
  Link,
} from "@mui/material";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function EventRegistration({ availableHeroes = [] }) {
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

  const [selectedHero, setSelectedHero] = useState(null);

  // Load events on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await apiFetch("/events");
        setEvents(data);
      } catch (err) {
        setError("Failed to load events");
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchEvents();
  }, []);

  // Update hero preview when hero_id changes
  useEffect(() => {
    if (formData.hero_id) {
      const hero = availableHeroes.find((h) => String(h.id) === String(formData.hero_id));
      setSelectedHero(hero || null);
    } else {
      setSelectedHero(null);
    }
  }, [formData.hero_id, availableHeroes]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await apiFetch("/entrants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          alias: formData.username,
          email: formData.email,
          event_id: formData.event_id,
          hero_id: formData.hero_id,
          notes: formData.notes,
        }),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <Container sx={{ mt: 4 }} maxWidth="sm" data-testid="event-registration">
      <Typography variant="h4" gutterBottom>
        Register for an Event
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
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
          {availableHeroes.length === 0 ? (
            <MenuItem value="">No heroes available</MenuItem>
          ) : (
            availableHeroes.map((hero) => (
              <MenuItem key={hero.id} value={hero.id}>
                {hero.name} ({hero.alias || "No alias"})
              </MenuItem>
            ))
          )}
        </TextField>

        {/* Help text under hero dropdown */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Not sure which hero to pick?{" "}
          <Link href="/heroes" target="_blank" rel="noopener noreferrer">
            Browse full hero list
          </Link>
        </Typography>

        {/* Hero preview card */}
        {selectedHero && (
          <Card sx={{ mt: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom align="center">
                {selectedHero.alignment?.toUpperCase() || "UNKNOWN"}
              </Typography>
              <Box textAlign="center" mb={2}>
                {selectedHero.proxy_image && (
                  <img
                    src={selectedHero.proxy_image}
                    alt={selectedHero.name}
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  />
                )}
              </Box>
              <Typography variant="h5" align="center" gutterBottom>
                {selectedHero.name}
              </Typography>
              <Typography align="center" gutterBottom>
                {selectedHero.full_name || "-"}
              </Typography>
              <Typography>
                <strong>Alias:</strong> {selectedHero.alias || "-"}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {selectedHero.powerstats &&
                  Object.entries(selectedHero.powerstats).map(([stat, val]) => (
                    <Typography key={stat}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}: {val}
                    </Typography>
                  ))}
              </Box>
            </CardContent>
          </Card>
        )}

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
