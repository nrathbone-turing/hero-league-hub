// File: frontend/src/components/EventRegistration.jsx
// Purpose: Register logged-in users for an event with hero selection.
// Notes:
// - Loads first page of heroes on mount so dropdown is populated.
// - Typing triggers server-side search, always capped at 25 results.
// - Persists entrant + chosen hero per user in localStorage.
// - No longer sends user_id explicitly (derived from token).

import { useState, useEffect, useRef } from "react";
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

const PAGE_SIZE = 25;

export default function EventRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [heroOptions, setHeroOptions] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingHeroes, setLoadingHeroes] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    event_id: "",
    hero_id: "",
    notes: "",
  });

  const latestTerm = useRef("");

  // Load events
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/events");
        setEvents(data);
      } catch {
        setError("Failed to load events");
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  // Load first heroes page on mount
  useEffect(() => {
    (async () => {
      setLoadingHeroes(true);
      try {
        const data = await apiFetch(`/heroes?search=a&page=1&per_page=${PAGE_SIZE}`);
        setHeroOptions(data.results || []);

        // Pre-populate if a hero is already chosen
        const storedHero = localStorage.getItem(`chosenHero_${user?.id}`);
        if (storedHero) {
          try {
            const parsed = JSON.parse(storedHero);
            setFormData((prev) => ({ ...prev, hero_id: parsed.id || "" }));
          } catch {
            /* ignore parse error */
          }
        }
      } catch {
        setError("Failed to load heroes");
      } finally {
        setLoadingHeroes(false);
      }
    })();
  }, [user?.id]);

  // Server-side search when typing
  async function handleHeroSearch(term) {
    latestTerm.current = term;
    if (!term) return; // don’t send empty search

    setLoadingHeroes(true);
    try {
      const url = `/heroes?search=${encodeURIComponent(term)}&page=1&per_page=${PAGE_SIZE}`;
      const data = await apiFetch(url);
      if (latestTerm.current === term) {
        setHeroOptions(data.results || []);
      }
    } catch {
      if (latestTerm.current === term) {
        setHeroOptions([]);
        setError("Failed to load heroes");
      }
    } finally {
      if (latestTerm.current === term) setLoadingHeroes(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const entrant = await apiFetch("/entrants/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      localStorage.setItem(`entrant_${user.id}`, JSON.stringify(entrant));
      if (entrant.hero) {
        localStorage.setItem(`chosenHero_${user.id}`, JSON.stringify(entrant.hero));
      }

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
          label="User"
          value={user?.username || ""}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Email"
          value={user?.email || ""}
          fullWidth
          margin="normal"
          InputProps={{ readOnly: true }}
        />

        {loadingEvents ? (
          <Box textAlign="center" mt={2}>
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

        <Autocomplete
          options={heroOptions}
          loading={loadingHeroes}
          filterOptions={(x) => x} // don’t filter client-side, backend handles it
          getOptionLabel={(option) =>
            option?.name ? `${option.name}${option.alias ? ` (${option.alias})` : ""}` : ""
          }
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name} ({option.alias || "No alias"})
            </li>
          )}
          value={
            heroOptions.find((h) => h.id === formData.hero_id) || null
          }
          onChange={(_, newValue) =>
            setFormData((prev) => ({
              ...prev,
              hero_id: newValue?.id || "",
            }))
          }
          onInputChange={(_, newInput) => {
            if (newInput && newInput.length > 1) {
              handleHeroSearch(newInput);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} label="Hero" margin="normal" fullWidth required />
          )}
          ListboxProps={{ style: { maxHeight: 300, overflow: "auto" } }}
          noOptionsText={loadingHeroes ? "Loading..." : "No options"}
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
