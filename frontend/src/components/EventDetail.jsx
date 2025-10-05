// File: frontend/src/components/EventDetail.jsx
// Purpose: Player-facing event detail view with registration, entrants, and matches.
// Notes:
// - Adds avatar, total W-L record, and opponent win % summary on the left panel.
// - Removes auto-refresh interval; adds manual refresh icon button beside Withdraw.

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
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
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

  // --- Fetch Event Data ---
  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        cache: "no-store",
      });
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

  // --- Registration + Stats ---
  const myEntrant = event.entrants?.find((e) => e.user_id === user?.id);
  const isRegistered = !!myEntrant && !myEntrant.dropped;
  const myMatches = event.matches?.filter(
    (m) => m.entrant1_id === myEntrant?.id || m.entrant2_id === myEntrant?.id
  );

  const wins = myMatches?.filter((m) => m.winner_id === myEntrant?.id).length || 0;
  const losses =
    myMatches?.filter(
      (m) =>
        m.winner_id &&
        m.winner_id !== myEntrant?.id &&
        (m.entrant1_id === myEntrant?.id || m.entrant2_id === myEntrant?.id)
    ).length || 0;

  const opponentWinRates = myMatches?.map((m) => {
    const opponent = m.entrant1_id === myEntrant?.id ? m.entrant2 : m.entrant1;
    if (!opponent || opponent.dropped) return null;
    const oppMatches = event.matches?.filter(
      (x) => x.entrant1_id === opponent.id || x.entrant2_id === opponent.id
    );
    const oppWins =
      oppMatches?.filter((x) => x.winner_id === opponent.id).length || 0;
    const oppLosses =
      oppMatches?.filter(
        (x) =>
          x.winner_id &&
          x.winner_id !== opponent.id &&
          (x.entrant1_id === opponent.id || x.entrant2_id === opponent.id)
      ).length || 0;
    const total = oppWins + oppLosses;
    return total ? oppWins / total : null;
  });

  const avgOpponentWinRate =
    opponentWinRates?.filter((v) => v !== null).length > 0
      ? (
          (opponentWinRates.reduce((a, b) => a + (b || 0), 0) /
            opponentWinRates.filter((v) => v !== null).length) *
          100
        ).toFixed(1)
      : "—";

  const handleRegister = async () => navigate("/register-event");

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

      {/* Main Layout */}
      <Grid container spacing={2} sx={{ flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {/* Left panel */}
        <Grid item xs={12} md={2.5}>
          <Paper
            sx={{
              p: 2,
              height: 575,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "center",
              gap: 1.5,
            }}
          >
            {isRegistered ? (
              <>
                <Avatar
                  variant="square"
                  src={myEntrant?.hero?.image_url || ""}
                  sx={{
                    width: 140,
                    height: 140,
                    mt: 1,
                    mb: 1,
                    borderRadius: 2,
                    boxShadow: 2,
                    bgcolor: "grey.200",
                  }}
                >
                  🛡️
                </Avatar>

                <Typography variant="h6" gutterBottom>
                  You’re registered for this event!
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                  Record: {wins}-{losses}
                </Typography>

                <Box sx={{ width: "70%", mt: 1, mb: 1 }}>
                  <Box
                    sx={{
                      height: 10,
                      bgcolor: "grey.300",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${(wins / (wins + losses || 1)) * 100}%`,
                        bgcolor: wins > losses ? "success.main" : "warning.main",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {`${((wins / (wins + losses || 1)) * 100).toFixed(0)}% Win Rate`}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Avg Opponent Win %: {avgOpponentWinRate}
                </Typography>

                {myMatches?.length > 0 && (
                  <Box sx={{ mt: 2, width: "100%" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent Opponents
                    </Typography>
                    {myMatches
                      .slice(-3)
                      .reverse()
                      .map((m) => {
                        const opponent =
                          m.entrant1_id === myEntrant?.id ? m.entrant2 : m.entrant1;
                        if (!opponent) return null;
                        return (
                          <Typography
                            key={m.id}
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: 13 }}
                          >
                            {opponent.name} ({m.scores}){" "}
                            {m.winner_id === myEntrant?.id ? "✅" : "❌"}
                          </Typography>
                        );
                      })}
                  </Box>
                )}

                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ mt: "auto", fontStyle: "italic" }}
                >
                  “Victory favors the prepared.”
                </Typography>

                {/* Withdraw + Refresh Row */}
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <Button variant="outlined" color="secondary">
                    Withdraw
                  </Button>
                  <Tooltip title="Refresh Event Data">
                    <IconButton
                      onClick={fetchEvent}
                      color="primary"
                      size="small"
                      aria-label="refresh"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <>
                <Avatar
                  variant="square"
                  sx={{
                    width: 140,
                    height: 140,
                    mb: 2,
                    bgcolor: "grey.200",
                    borderRadius: 2,
                  }}
                >
                  ❔
                </Avatar>
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

        {/* Entrants Table */}
        <Grid item xs={12} md={3.5}>
          <Paper sx={{ p: 2, height: 575, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Entrants
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 500 }}>
              <Table size="small" stickyHeader>
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
                    <TableRow key={entrant.id}>
                      <TableCell>{entrant.id}</TableCell>
                      <TableCell>{entrant.dropped ? "Dropped" : entrant.name || "-"}</TableCell>
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

        {/* Matches Table */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 575, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Matches
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["id", "round", "entrant1", "entrant2", "scores", "winner"].map((col) => (
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
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedMatches?.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell>{m.round}</TableCell>
                      <TableCell>
                        {m.entrant1 ? `${m.entrant1.name} (${m.entrant1.hero?.name})` : "-"}
                      </TableCell>
                      <TableCell>
                        {m.entrant2 ? `${m.entrant2.name} (${m.entrant2.hero?.name})` : "-"}
                      </TableCell>
                      <TableCell>{m.scores}</TableCell>
                      <TableCell>
                        {m.winner ? `${m.winner.name} (${m.winner.hero?.name})` : "TBD"}
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
