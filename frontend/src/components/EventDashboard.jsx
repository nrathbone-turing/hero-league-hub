// File: frontend/src/components/EventDashboard.jsx
// Purpose: Manage list of events and allow event creation.
// Notes:
// - Multi-level sorting handled in backend.
// - Hero image placeholders replaced with static hero/villain images.
// - Exposes data-testid="event-name" for clean test querying.

import { useEffect, useState } from "react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

export default function EventDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [redirect500, setRedirect500] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    status: "drafting",
  });

  async function fetchEvents() {
    try {
      const data = await apiFetch("/events");
      setEvents(data);
      setFetchError(null);
    } catch (err) {
      if (err.message.includes("500")) {
        setRedirect500(true);
        return;
      }
      setFetchError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await apiFetch("/events", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!res || res.error) {
        throw new Error("Failed to create event");
      }

      setEvents([...events, res]);
      setFormData({ name: "", date: "", status: "drafting" });
      setCreateError(null);
    } catch {
      setCreateError("Failed to create event");
    }
  }


  if (redirect500) return <Navigate to="/500" replace />;

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }} data-testid="event-dashboard">
      <Typography variant="h4" gutterBottom align="center">
        Events Dashboard
      </Typography>

      {/* Hero images + form */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        {/* Hero side */}
        <Paper
          sx={{
            flex: 1,
            height: 200,
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <img
            src="https://placehold.co/600x400/cccccc/000000?text=Hero"
            alt="Hero placeholder"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Paper>

        {/* Form */}
        <Box
          component="form"
          role="form"
          onSubmit={handleSubmit}
          sx={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            id="name"
            label="Event Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            id="date"
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />

          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={formData.status}
              label="Status"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              required
            >
              <MenuItem value="drafting">Drafting</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit" variant="contained" color="primary">
            Create Event
          </Button>

          {createError && (
            <Typography color="error" role="alert">
              {createError}
            </Typography>
          )}
        </Box>

        {/* Villain side */}
        <Paper
          sx={{
            flex: 1,
            height: 200,
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <img
            src="https://placehold.co/600x400/cccccc/000000?text=Villain"
            alt="Villain placeholder"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Paper>
      </Box>

      {/* Event list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : fetchError ? (
        <Typography color="error" role="alert" align="center">
          {fetchError}
        </Typography>
      ) : events.length === 0 ? (
        <>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography>No events yet</Typography>
          </Paper>
        </>
      ) : (
        <Paper
          data-testid="event-list"
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "10px" },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#555" },
          }}
        >
          <List>
            {events.map((e) => (
              <ListItem
                key={e.id}
                component={RouterLink}
                to={`/events/${e.id}`}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemText
                  primary={e.name}
                  primaryTypographyProps={{
                    component: "span",
                    "data-testid": "event-name",
                  }}
                  secondary={`${e.date} (${e.status}) — ${
                    e.entrant_count ?? e.entrants?.length ?? 0
                  } entrants`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}
