// File: frontend/src/components/EventDetail.jsx
// Purpose: Player-facing event detail view with registration, entrants, and matches.
// Notes:
// - Non-admins see a "Register Now" panel if not registered.
// - Entrants display entrant.name consistently.
// - Adjusted grid widths to prevent overlap and maintain balanced layout.

import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirect404, setRedirect404] = useState(false);
  const [redirect500, setRedirect500] = useState(false);

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

  if (redirect404) return <Navigate to="/404" replace />;
  if (redirect500) return <Navigate to="/500" replace />;

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Loading event...
        </Typography>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h6" color="error" role="alert">
          {error}
        </Typography>
      </Container>
    );
  }

  if (!event) return <Navigate to="/404" replace />;

  const isRegistered = event.entrants?.some(
    (e) => e.user_id === user?.id && !e.dropped
  );

  const handleRegister = async () => {
    navigate("/register-event");
  };

  const sortData = (array, orderBy, order) => {
    return [...(array || [])].sort((a, b) => {
      let valA, valB;
      if (["entrant1", "entrant2", "winner"].includes(orderBy)) {
        valA = a[orderBy]?.name || "";
        valB = b[orderBy]?.name || "";
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
        <Button component={RouterLink} to="/events" variant="outlined">
          Back to Events
        </Button>
        <Typography variant="subtitle1" color="text.secondary">
          Event Details
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {event.name} — {event.date}
        </Typography>
        <Typography
          sx={{
            textTransform: "uppercase",
            ml: 2,
            fontWeight: 600,
            color:
              event.status === "published"
                ? "success.main"
                : event.status === "completed"
                ? "info.main"
                : event.status === "cancelled"
                ? "error.main"
                : "text.secondary",
          }}
        >
          {event.status}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {/* Left panel - registration info */}
        <Grid item xs={12} md={2.5}>
          <Paper
            sx={{
              p: 2,
              height: 575,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {isRegistered ? (
              <>
                <Typography variant="h6" gutterBottom>
                  You’re registered for this event!
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Good luck, hero!
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ mt: 2 }}
                  onClick={() => {
                    // withdraw logic placeholder
                  }}
                >
                  Withdraw
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  You’re not registered for this event.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                  data-testid="register-now-btn"
                >
                  Register Now
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Entrants table */}
        <Grid item xs={12} md={3.5} sx={{ display: "flex" }}>
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
                        sortDirection={entrantOrderBy === col ? entrantOrder : false}
                      >
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
                    <TableRow key={entrant.id} data-testid={`entrant-row-${entrant.id}`}>
                      <TableCell>{entrant.id}</TableCell>
                      <TableCell>
                        {entrant.dropped ? "Dropped" : entrant.name || "-"}
                      </TableCell>
                      <TableCell>
                        {entrant.dropped ? "-" : entrant.hero?.name || entrant.alias || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Matches table */}
        <Grid item xs={12} md={6} sx={{ display: "flex" }}>
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
                    {["id", "round", "entrant1", "entrant2", "scores", "winner"].map(
                      (col) => (
                        <TableCell
                          key={col}
                          sortDirection={matchOrderBy === col ? matchOrder : false}
                        >
                          <TableSortLabel
                            active={matchOrderBy === col}
                            direction={matchOrderBy === col ? matchOrder : "asc"}
                            onClick={() => handleMatchSort(col)}
                          >
                            {col.charAt(0).toUpperCase() + col.slice(1)}
                          </TableSortLabel>
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedMatches?.map((m) => (
                    <TableRow key={m.id} data-testid={`match-row-${m.id}`}>
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
