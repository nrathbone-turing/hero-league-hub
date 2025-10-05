// File: frontend/src/components/Events.jsx
// Purpose: Player-facing event list with filters, hero/villain placeholders, and admin visibility control.
// Notes:
// - Adds roles for accessibility and stable test querying.
// - Non-admins only see published, completed, or cancelled (if toggled).
// - Drafting events hidden for non-admin users.

import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
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

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await apiFetch("/events");
        setEvents(data || []);
        setError(null);
      } catch (err) {
        if (err.message.includes("500")) return setRedirect500(true);
        setError("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (redirect500) return <Navigate to="/500" replace />;

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (!user?.is_admin && e.status === "drafting") return false;
        if (!includeCancelled && e.status === "cancelled") return false;
        if (statusFilter === "all") return true;
        return e.status === statusFilter;
      })
      .filter((e) => e.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [events, user, searchTerm, statusFilter, includeCancelled]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const valA = a[orderBy] ?? "";
      const valB = b[orderBy] ?? "";
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredEvents, orderBy, order]);

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(col);
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 6 }}
      data-testid="events-page"
      role="main"
      aria-label="events page"
    >
      <Typography variant="h4" align="center" gutterBottom role="heading">
        Events
      </Typography>

      {/* Hero / Villain placeholders */}
      <Grid container justifyContent="space-between" sx={{ mb: 2 }} role="region" aria-label="placeholders">
        <Grid item xs={12} sm={4} md={3}>
          <Box
            sx={{
              bgcolor: "#e0e0e0",
              borderRadius: 2,
              height: 180,
              width: 180,
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "bold",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            }}
            aria-label="hero placeholder"
            role="img"
            data-testid="hero-placeholder"
          >
            Hero
          </Box>
        </Grid>

        <Grid item xs={12} sm={4} md={3}>
          <Box
            sx={{
              bgcolor: "#e0e0e0",
              borderRadius: 2,
              height: 180,
              width: 180,
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "bold",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            }}
            aria-label="villain placeholder"
            role="img"
            data-testid="villain-placeholder"
          >
            Villain
          </Box>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid
        container
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
        role="search"
        aria-label="event filters"
      >
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            label="Search by name"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="search events"
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
              inputProps={{ "aria-label": "status filter" }}
              role="combobox"
              data-testid="status-filter"
            >
              <MenuItem role="option" value="published">Published</MenuItem>
              <MenuItem role="option" value="completed">Completed</MenuItem>
              <MenuItem role="option" value="all">All</MenuItem>
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
              inputProps={{ "aria-label": "include cancelled" }}
              role="switch"
              data-testid="cancelled-toggle"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Event Table */}
      {loading ? (
        <Box
          sx={{ display: "flex", justifyContent: "center", mt: 4 }}
          data-testid="loading-events"
          role="status"
          aria-label="loading events"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography
          color="error"
          align="center"
          role="alert"
          data-testid="error-alert"
        >
          {error}
        </Typography>
      ) : sortedEvents.length === 0 ? (
        <Paper
          sx={{ p: 4, textAlign: "center" }}
          data-testid="no-events"
          role="status"
          aria-label="no events found"
        >
          <Typography>No events found.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflowX: "auto" }} data-testid="events-table" role="table" aria-label="events table">
          <Table size="small">
            <TableHead role="rowgroup">
              <TableRow role="row">
                {["name", "date", "status", "entrants"].map((col) => (
                  <TableCell key={col} role="columnheader">
                    <TableSortLabel
                      active={orderBy === col}
                      direction={orderBy === col ? order : "asc"}
                      onClick={() => handleSort(col)}
                      role="button"
                      aria-label={`sort by ${col}`}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center" role="columnheader">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody role="rowgroup">
              {sortedEvents.map((event) => (
                <TableRow key={event.id} hover role="row">
                  <TableCell
                    component={RouterLink}
                    to={`/events/${event.id}`}
                    sx={{
                      color: "primary.main",
                      textDecoration: "underline",
                      fontWeight: 500,
                    }}
                    role="link"
                    aria-label={`view details for ${event.name}`}
                    data-testid={`event-name-${event.id}`}
                  >
                    {event.name}
                  </TableCell>
                  <TableCell role="cell">{event.date || "TBA"}</TableCell>
                  <TableCell role="cell">
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color:
                          event.status === "published"
                            ? "success.main"
                            : event.status === "completed"
                            ? "info.main"
                            : event.status === "cancelled"
                            ? "error.main"
                            : "text.secondary",
                      }}
                      role="status"
                      aria-label={`event status ${event.status}`}
                    >
                      {event.status}
                    </Typography>
                  </TableCell>
                  <TableCell role="cell">
                    {`${event.entrant_count ?? event.entrants?.length ?? 0} entrants`}
                  </TableCell>
                  <TableCell align="center" role="cell">
                    <Button
                      variant="outlined"
                      size="small"
                      component={RouterLink}
                      to={`/events/${event.id}`}
                      sx={{ mr: 1 }}
                      role="button"
                      aria-label={`view ${event.name}`}
                      data-testid="view-event-btn"
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      disabled={event.status !== "published"}
                      component={RouterLink}
                      to={
                        event.status === "published"
                          ? "/register-event"
                          : undefined
                      }
                      role="button"
                      aria-label={`register for ${event.name}`}
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
