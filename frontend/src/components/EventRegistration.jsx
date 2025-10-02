// File: frontend/src/components/EventRegistration.jsx
// Purpose: Allow logged-in users to register for an event with prefilled info.
// Notes:
// - Auto-fills name, username, email from auth context.
// - Dropdowns for event selection and hero selection (searchable with limit).
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
  Link,
  Autocomplete,
} from "@mui/material";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function EventRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingHeroes, setLoadingHeroes] = useState(true);
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

  // Load heroes (first page, limit 100 for now)
  useEffect(() => {
    async function fetchHeroes() {
      try {
        const data = await apiFetch("/heroes?search=a&page=1&per_page=100");
        setHeroes(data.results || []);
        setLoadingHeroes(false);
      } catch (err) {
        setError("Failed to load heroes");
        setLoadingHeroes(false);
      }
    }
    fetchHeroes();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await apiFetch("/entrants", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          alias: formData.username,
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

        {loadingHeroes ? (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Autocomplete
              options={heroes}
              getOptionLabel={(option) =>
                option?.name
                  ? `${option.name}${option.alias ? ` (${option.alias})` : ""}`
                  : ""
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name} ({option.alias || "No alias"})
                </li>
              )}
              filterOptions={(options, state) =>
                options
                  .filter((h) =>
                    h.name.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
                  .slice(0, 25)
              }
              onChange={(e, newValue) =>
                setFormData((prev) => ({
                  ...prev,
                  hero_id: newValue?.id || "",
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Hero"
                  margin="normal"
                  fullWidth
                  required
                />
              )}
              ListboxProps={{ style: { maxHeight: 300, overflow: "auto" } }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Not sure who to pick?{" "}
              <Link href="/heroes" target="_blank" rel="noopener">
                Browse characters
              </Link>
            </Typography>
          </>
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
