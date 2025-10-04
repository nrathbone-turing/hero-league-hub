// File: frontend/src/components/EventDetail.jsx
// Purpose: Detailed view of a single event with entrants, matches, and status controls.
// Notes:
// - Entrants table shows User.username (fallback) and Hero.name (alias).
// - Added aria-labels and data-testids to improve test reliability with MUI.
// - Preserves existing behavior, sorting, and layout.

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

  const [entrantOrderBy, setEntrantOrderBy] = useState("id");
  const [entrantOrder, setEntrantOrder] = useState("asc");
  const [matchOrderBy, setMatchOrderBy] = useState("id");
  const [matchOrder, setMatchOrder] = useState("asc");

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/${id}`);
      setEvent(data);
      setError(null);
    } catch (err) {
      if (err.message.includes("404")) return setRedirect404(true);
      if (err.message.includes("500")) return setRedirect500(true);
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
    const fallbackId = event?.entrants?.at(-1)?.id;
    const targetId = idOverride || removeId || fallbackId;
    if (!targetId) return setError("Failed to remove entrant");

    try {
      await apiFetch(`/entrants/${targetId}`, { method: "DELETE" });
      setRemoveId("");
      fetchEvent();
    } catch {
      setError("Failed to remove entrant");
    }
  }

  async function handleStatusChange(e) {
    if (!event) return;
    const newStatus = e.target.value;
    const prevStatus = event.status;
    try {
      await apiFetch(`/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchEvent();
    } catch {
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

  const sortData = (array, orderBy, order) => {
    return [...(array || [])].sort((a, b) => {
      let valA, valB;
      if (["entrant1", "entrant2", "winner"].includes(orderBy)) {
        valA = a[orderBy]?.user?.username || a[`${orderBy}_id`] || "";
        valB = b[orderBy]?.user?.username || b[`${orderBy}_id`] || "";
      } else {
        valA = a[orderBy] ?? "";
        valB = b[orderBy] ?? "";
      }
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedEntrants = sortData(event.entrants, entrantOrderBy, entrantOrder);
  const sortedMatches = sortData(event.matches, matchOrderBy, matchOrder);

  const handleEntrantSort = (col) => {
    const isAsc = entrantOrderBy === col && entrantOrder === "asc";
    setEntrantOrder(isAsc ? "desc" : "asc");
    setEntrantOrderBy(col);
  };

  const handleMatchSort = (col) => {
    const isAsc = matchOrderBy === col && matchOrder === "asc";
    setMatchOrder(isAsc ? "desc" : "asc");
    setMatchOrderBy(col);
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

      <Grid container spacing={2} sx={{ flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {/* Left panel */}
        <Grid xs={12} md={3} sx={{ display: "flex" }}>
          <Paper
            sx={{
              flex: 1,
              p: 2,
              height: 575,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
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

        {/* Entrants table */}
        <Grid xs={12} md={3} sx={{ display: "flex" }}>
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
              sx={{ flex: 1, overflowY: "auto", maxHeight: 500 }}
              aria-label="entrants list"
              data-testid="entrants-scroll"
            >
              <Table
                size="small"
                stickyHeader
                aria-label="entrants"
                data-testid="entrants-table"
              >
                <TableHead>
                  <TableRow>
                    {["id", "name", "alias"].map((col) => (
                      <TableCell
                        key={col}
                        sortDirection={
                          entrantOrderBy === col ? entrantOrder : false
                        }
                      >
                        <TableSortLabel
                          active={entrantOrderBy === col}
                          direction={
                            entrantOrderBy === col ? entrantOrder : "asc"
                          }
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
                    <TableRow
                      key={entrant.id}
                      data-testid={`entrant-row-${entrant.id}`}
                    >
                      <TableCell>{entrant.id}</TableCell>
                      <TableCell>
                        {entrant.dropped
                          ? "Dropped"
                          : entrant.user?.username ||
                            entrant.name ||
                            "-"}
                      </TableCell>
                      <TableCell>
                        {entrant.dropped
                          ? "-"
                          : entrant.hero?.name || entrant.alias || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Matches table */}
        <Grid xs={12} md={6} sx={{ display: "flex" }}>
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
              sx={{ flex: 1, overflowY: "auto", maxHeight: 500 }}
              aria-label="matches list"
              data-testid="matches-scroll"
            >
              <Table
                size="small"
                stickyHeader
                aria-label="matches"
                data-testid="matches-table"
              >
                <TableHead>
                  <TableRow>
                    {[
                      "id",
                      "round",
                      "entrant1",
                      "entrant2",
                      "scores",
                      "winner",
                    ].map((col) => (
                      <TableCell
                        key={col}
                        sortDirection={
                          matchOrderBy === col ? matchOrder : false
                        }
                      >
                        <TableSortLabel
                          active={matchOrderBy === col}
                          direction={
                            matchOrderBy === col ? matchOrder : "asc"
                          }
                          onClick={() => handleMatchSort(col)}
                        >
                          {col.charAt(0).toUpperCase() + col.slice(1)}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedMatches?.map((m) => (
                    <TableRow
                      key={m.id}
                      data-testid={`match-row-${m.id}`}
                    >
                      <TableCell>{m.id}</TableCell>
                      <TableCell>{m.round}</TableCell>
                      <TableCell>
                        {m.entrant1
                          ? `${m.entrant1.name} (${m.entrant1.hero?.name})`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {m.entrant2
                          ? `${m.entrant2.name} (${m.entrant2.hero?.name})`
                          : "-"}
                      </TableCell>
                      <TableCell>{m.scores}</TableCell>
                      <TableCell>
                        {m.winner
                          ? `${m.winner.name} (${m.winner.hero?.name})`
                          : "TBD"}
                      </TableCell>
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
