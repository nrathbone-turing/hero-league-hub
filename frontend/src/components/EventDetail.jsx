// File: frontend/src/components/EventDetail.jsx
// Purpose: Detailed view of a single event with entrants, matches, and status controls.
// Notes:
// - Fixes status update PUT request by including status in JSON body.
// - Handles soft-deleted entrants by showing "Dropped" instead of crashing.
// - Provides inline error feedback with role="alert".
// - Redirects to /404 or /500 for test-friendly error handling.
// - Adds debug logging for API flows.

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

  async function handleRemoveEntrant(e) {
    e.preventDefault();
    try {
      console.log("🗑 Removing entrant:", removeId);
      await apiFetch(`/entrants/${removeId}`, { method: "DELETE" });
      setRemoveId("");
      fetchEvent();
    } catch (err) {
      console.error("❌ Failed to remove entrant:", removeId, err.message);
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

        {/* Middle */}
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
            <Typography variant="h6" gutterBottom>
              Entrants
            </Typography>
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                maxHeight: 500,
              }}
              data-testid="entrants-scroll"
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Alias</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {event.entrants?.map((entrant) => (
                    <TableRow key={entrant.id}>
                      <TableCell>{entrant.id}</TableCell>
                      <TableCell>
                        {entrant.dropped ? "Dropped" : entrant.name}
                      </TableCell>
                      <TableCell>
                        {entrant.dropped ? "-" : entrant.alias}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Right */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Paper
            sx={{
              flex: 1,
              p: 2,
              height: 575,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Matches
            </Typography>
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                maxHeight: 500,
              }}
              data-testid="matches-scroll"
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Round</TableCell>
                    <TableCell>Entrant 1</TableCell>
                    <TableCell>Entrant 2</TableCell>
                    <TableCell>Scores</TableCell>
                    <TableCell>Winner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {event.matches?.map((m) => {
                    const e1 = event.entrants?.find(
                      (e) => e.id === m.entrant1_id,
                    );
                    const e2 = event.entrants?.find(
                      (e) => e.id === m.entrant2_id,
                    );
                    const w = event.entrants?.find((e) => e.id === m.winner_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell>{m.round}</TableCell>
                        <TableCell>
                          {e1?.dropped ? "Dropped" : e1?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {e2?.dropped ? "Dropped" : e2?.name || "-"}
                        </TableCell>
                        <TableCell>{m.scores}</TableCell>
                        <TableCell>
                          {w
                            ? w.dropped
                              ? "Dropped"
                              : `${w.name} (${w.alias})`
                            : "TBD"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
