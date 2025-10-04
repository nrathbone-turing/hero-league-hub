// File: frontend/src/components/EventDetail.jsx
// Purpose: Detailed view of a single event with entrants, matches, and status controls.
// Notes:
// - Adds TableSortLabel sorting to Entrants and Matches tables.
// - Default sort by ID ascending. Sorting is client-side only.
// - Keeps all other dashboards, layout, and UI unchanged.

import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  TableSortLabel,
} from "@mui/material";
import EntrantDashboard from "./EntrantDashboard";
import MatchDashboard from "./MatchDashboard";
import { apiFetch } from "../api";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirect500, setRedirect500] = useState(false);
  const [redirect404, setRedirect404] = useState(false);

  const [tab, setTab] = useState(0);
  const [removeId, setRemoveId] = useState("");

  // Sorting state
  const [entrantOrderBy, setEntrantOrderBy] = useState("id");
  const [entrantOrder, setEntrantOrder] = useState("asc");
  const [matchOrderBy, setMatchOrderBy] = useState("id");
  const [matchOrder, setMatchOrder] = useState("asc");

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔎 Fetching event:", id);
      const data = await apiFetch(`/events/${id}`);
      setEvent(data);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch event:", id, err.message);
      if (err.message.includes("404")) {
        setRedirect404(true);
        return;
      }
      if (err.message.includes("500")) {
        setRedirect500(true);
        return;
      }
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  async function handleRemoveEntrant(e, idOverride) {
    e?.preventDefault();
    const fallbackId = event?.entrants?.length
      ? event.entrants[event.entrants.length - 1].id
      : undefined;
    const targetId = idOverride || removeId || fallbackId;
    if (!targetId) {
      setError("Failed to remove entrant");
      return;
    }
    try {
      console.log("🗑 Removing entrant:", targetId);
      await apiFetch(`/entrants/${targetId}`, { method: "DELETE" });
      setRemoveId("");
      fetchEvent();
    } catch (err) {
      console.error("❌ Failed to remove entrant:", targetId, err.message);
      setError("Failed to remove entrant");
    }
  }

  async function handleStatusChange(e) {
    if (!event) return;
    const newStatus = e.target.value;
    const prevStatus = event.status;
    try {
      console.log("🔄 Updating event status:", { id, newStatus });
      await apiFetch(`/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchEvent();
    } catch (err) {
      console.error("❌ Failed to update status:", err.message);
      setError("Failed to update status");
      setEvent({ ...event, status: prevStatus });
    }
  }

  if (redirect404) return <Navigate to="/404" replace />;
  if (redirect500) return <Navigate to="/500" replace />;

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Loading event...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h6">Error</Typography>
        <Typography role="alert">{error}</Typography>
      </Container>
    );
  }

  if (!event) return <Navigate to="/404" replace />;

  // Generic sort helper
  const sortData = (array, orderBy, order) => {
    return [...(array || [])].sort((a, b) => {
      const valA = a[orderBy] ?? "";
      const valB = b[orderBy] ?? "";
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedEntrants = sortData(event.entrants, entrantOrderBy, entrantOrder);
  const sortedMatches = sortData(event.matches, matchOrderBy, matchOrder);

  const handleEntrantSort = (property) => {
    const isAsc = entrantOrderBy === property && entrantOrder === "asc";
    setEntrantOrder(isAsc ? "desc" : "asc");
    setEntrantOrderBy(property);
  };

  const handleMatchSort = (property) => {
    const isAsc = matchOrderBy === property && matchOrder === "asc";
    setMatchOrder(isAsc ? "desc" : "asc");
    setMatchOrderBy(property);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, px: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/" variant="outlined">
          Back to Events
        </Button>
        <Typography variant="subtitle1" color="text.secondary">
          Event Details
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {event.name} — {event.date}
        </Typography>
        <FormControl size="small">
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status-select"
            label="Status"
            value={event.status || ""}
            onChange={handleStatusChange}
            inputProps={{ "data-testid": "status-select" }}
          >
            <MenuItem value="drafting">Drafting</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 3-column layout */}
      <Grid
        container
        spacing={2}
        sx={{ alignItems: "stretch", flexWrap: { xs: "wrap", md: "nowrap" } }}
      >
        {/* Left */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
          <Paper
            sx={{
              flex: 1,
              p: 2,
              height: 575,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Tabs value={tab} onChange={(e, val) => setTab(val)} centered>
              <Tab label="Add Entrant" />
              <Tab label="Add Match" />
            </Tabs>
            <Box
              sx={{
                mt: 2,
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {tab === 0 ? (
                <>
                  <EntrantDashboard eventId={id} onEntrantAdded={fetchEvent} />
                  <Box
                    component="form"
                    onSubmit={handleRemoveEntrant}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      mt: "auto",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Remove Entrant
                    </Typography>
                    <TextField
                      label="Entrant ID"
                      type="number"
                      value={removeId}
                      onChange={(e) => setRemoveId(e.target.value)}
                      required
                      size="small"
                    />
                    <Button type="submit" variant="contained" color="error">
                      Remove Entrant
                    </Button>
                  </Box>
                </>
              ) : (
                <MatchDashboard eventId={id} onMatchAdded={fetchEvent} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Middle - Entrants */}
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
          <Paper sx={{ flex: 1, p: 2, height: 575, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Entrants
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 500 }} data-testid="entrants-scroll">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["id", "name", "alias"].map((col) => (
                      <TableCell key={col} sortDirection={entrantOrderBy === col ? entrantOrder : false}>
                        <TableSortLabel
                          active={entrantOrderBy === col}
                          direction={entrantOrderBy === col ? entrantOrder : "asc"}
                          onClick={() => handleEntrantSort(col)}
                        >
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedEntrants?.map((entrant) => (
                    <TableRow key={entrant.id}>
                      <TableCell>{entrant.id}</TableCell>
                      <TableCell>
                        {entrant.dropped
                          ? "Dropped"
                          : entrant.user?.name || entrant.name}
                      </TableCell>
                      <TableCell>
                        {entrant.dropped ? "-" : entrant.user?.alias || entrant.alias}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Right - Matches */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Paper sx={{ flex: 1, p: 2, height: 575, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Matches
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 500 }} data-testid="matches-scroll">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["id", "round", "entrant1_id", "entrant2_id", "scores", "winner_id"].map((col) => (
                      <TableCell key={col} sortDirection={matchOrderBy === col ? matchOrder : false}>
                        <TableSortLabel
                          active={matchOrderBy === col}
                          direction={matchOrderBy === col ? matchOrder : "asc"}
                          onClick={() => handleMatchSort(col)}
                        >
                          {col.replace("_id", "").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedMatches?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell>{m.round}</TableCell>
                      <TableCell>{m.entrant1_id}</TableCell>
                      <TableCell>{m.entrant2_id}</TableCell>
                      <TableCell>{m.scores}</TableCell>
                      <TableCell>{m.winner_id || "TBD"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
