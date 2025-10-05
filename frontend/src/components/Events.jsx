// File: frontend/src/components/Events.jsx
// Purpose: Player-facing event list using pure filter/sort utilities.
// Notes:
// - Imports filterAndSortEvents for logic separation.
// - Easier to test business logic in isolation and UI rendering separately.
// - Matches test expectations for data-testid, error/loading/empty states, and disabled register buttons.

import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { filterAndSortEvents } from "../utils/eventFilters";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Switch,
} from "@mui/material";

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirect500, setRedirect500] = useState(false);

  const [statusFilter, setStatusFilter] = useState("published");
  const [searchTerm, setSearchTerm] = useState("");
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [orderBy, setOrderBy] = useState("date");
  const [order, setOrder] = useState("asc");

  // ---- Fetch events from API ----
  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await apiFetch("/events");
        setEvents(data || []);
      } catch (err) {
        if (err.message?.includes("500")) return setRedirect500(true);
        setError("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (redirect500) return <Navigate to="/500" replace />;

  // ---- Derived filtered/sorted events ----
  const sortedEvents = useMemo(
    () =>
      filterAndSortEvents(events, {
        user,
        searchTerm,
        statusFilter,
        includeCancelled,
        orderBy,
        order,
      }),
    [events, user, searchTerm, statusFilter, includeCancelled, orderBy, order]
  );

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(col);
  };

  // ---- Render ----
  return (
    <Container maxWidth="lg" sx={{ mt: 6 }} data-testid="events-page">
      <Typography variant="h4" align="center" gutterBottom>
        Events
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            label="Search by name"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="events-search"
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="status-filter"
            >
              <MenuItem value="published" data-value="published">
                Published
              </MenuItem>
              <MenuItem value="completed" data-value="completed">
                Completed
              </MenuItem>
              <MenuItem value="all" data-value="all">
                All
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4} md={3}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Include Cancelled
            </Typography>
            <Switch
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
              data-testid="cancelled-toggle"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Event Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }} data-testid="loading-events">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" data-testid="error-alert">
          {error}
        </Typography>
      ) : sortedEvents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }} data-testid="no-events">
          <Typography>No events found.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflowX: "auto" }} data-testid="events-table">
          <Table size="small" role="table">
            <TableHead>
              <TableRow>
                {["name", "date", "status", "entrants"].map((col) => (
                  <TableCell key={col}>
                    <TableSortLabel
                      active={orderBy === col}
                      direction={orderBy === col ? order : "asc"}
                      onClick={() => handleSort(col)}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell
                    component={RouterLink}
                    to={`/events/${event.id}`}
                    data-testid={`event-name-${event.id}`}
                    sx={{ color: "primary.main", textDecoration: "underline" }}
                  >
                    {event.name}
                  </TableCell>
                  <TableCell>{event.date || "TBA"}</TableCell>
                  <TableCell>{event.status}</TableCell>
                  <TableCell>{event.entrants?.length ?? 0}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      disabled={event.status !== "published"}
                      data-testid="register-btn"
                    >
                      Register
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
