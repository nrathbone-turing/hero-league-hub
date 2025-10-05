// File: frontend/src/components/UserDashboard.jsx
// Purpose: Participant dashboard with hero and event details.
// Notes:
// - Adds "Remove Hero" option
// - Makes event name clickable to navigate to event detail page

import { useAuth } from "../context/AuthContext";
import { deleteEntrant, apiFetch } from "../api";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chosenHero, setChosenHero] = useState(null);
  const [entrant, setEntrant] = useState(null);

  function syncFromStorage() {
    const entrantKey = `entrant_${user?.id}`;
    const heroKey = `chosenHero_${user?.id}`;

    const storedEntrant = entrantKey ? localStorage.getItem(entrantKey) : null;
    if (storedEntrant) {
      try {
        const parsedEntrant = JSON.parse(storedEntrant);
        setEntrant(parsedEntrant);
        if (parsedEntrant.hero) setChosenHero(parsedEntrant.hero);
        return;
      } catch {
        setEntrant(null);
      }
    }

    const storedHero = heroKey ? localStorage.getItem(heroKey) : null;
    if (storedHero) {
      try {
        setChosenHero(JSON.parse(storedHero));
      } catch {
        setChosenHero(null);
      }
    }
  }

  async function syncWithBackend() {
    if (!user?.id) return;
    try {
      const entrants = await apiFetch(`/entrants?user_id=${user.id}`);
      if (entrants && entrants.length > 0) {
        const backendEntrant = entrants[0];
        setEntrant(backendEntrant);
        if (backendEntrant.hero) setChosenHero(backendEntrant.hero);

        localStorage.setItem(`entrant_${user.id}`, JSON.stringify(backendEntrant));
        if (backendEntrant.hero) {
          localStorage.setItem(
            `chosenHero_${user.id}`,
            JSON.stringify(backendEntrant.hero)
          );
        }
      } else {
        setEntrant(null);
        localStorage.removeItem(`entrant_${user.id}`);
      }
    } catch (err) {
      console.error("❌ Failed to sync with backend entrants", err);
    }
  }

  useEffect(() => {
    syncFromStorage();
    const timeout = setTimeout(() => syncWithBackend(), 150);
    const handler = () => syncFromStorage();
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
      clearTimeout(timeout);
    };
  }, [user?.id]);

  async function handleCancelRegistration() {
    if (!entrant?.id) {
      alert("❌ No entrant to unregister");
      return;
    }
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;

    try {
      await deleteEntrant(entrant.id);
      localStorage.removeItem(`entrant_${user.id}`);

      if (entrant.matches && entrant.matches.length > 0) {
        localStorage.removeItem(`chosenHero_${user.id}`);
        setChosenHero(null);
      }

      setEntrant(null);
    } catch (err) {
      console.error("Failed to unregister", err);
      alert("❌ Failed to cancel registration");
    }
  }

  function handleRemoveHero() {
    if (!window.confirm("Remove your chosen hero?")) return;
    localStorage.removeItem(`chosenHero_${user.id}`);
    setChosenHero(null);
  }

  return (
    <Container sx={{ mt: 4 }} data-testid="user-dashboard">
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Welcome, {user?.username || "Participant"}
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Hero card */}
        <Grid item xs={12} md={6}>
          {chosenHero ? (
            <Card sx={{ p: 2 }} data-testid="hero-card">
              <CardContent>
                <Typography
                  variant="h6"
                  align="center"
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  {chosenHero.alignment?.toUpperCase() || "UNKNOWN"}
                </Typography>
                <Box textAlign="center" mb={2}>
                  {chosenHero.proxy_image && (
                    <img
                      src={chosenHero.proxy_image}
                      alt={chosenHero.name}
                      style={{
                        maxWidth: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                  {chosenHero.name}
                </Typography>
                <Typography align="center" gutterBottom>
                  {chosenHero.full_name || "-"}
                </Typography>
                <Typography align="center">
                  <strong>Alias:</strong> {chosenHero.alias || "-"}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {chosenHero.powerstats &&
                    Object.entries(chosenHero.powerstats).map(([key, value]) => (
                      <Typography key={key} align="center">
                        {key}: {value}
                      </Typography>
                    ))}
                </Box>

                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/heroes")}
                    sx={{ mr: 2 }}
                  >
                    Choose Another Hero
                  </Button>
                  <Button variant="outlined" color="error" onClick={handleRemoveHero}>
                    Remove Hero
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ p: 2 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography>You haven’t selected your hero yet.</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/heroes")}
                >
                  Choose Hero
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Event card */}
        <Grid item xs={12} md={6}>
          {entrant ? (
            <Card sx={{ p: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  align="center"
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  Registered Event
                </Typography>
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  sx={{
                    cursor: "pointer",
                    color: "primary.main",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() =>
                    entrant.event?.id && navigate(`/events/${entrant.event.id}`)
                  }
                >
                  {entrant.event?.name || "Event"}
                </Typography>
                <Typography align="center" gutterBottom>
                  {entrant.event?.date || "TBA"}
                </Typography>
                <Typography align="center" gutterBottom>
                  Status: {entrant.event?.status || "-"}
                </Typography>
                <Typography align="center" gutterBottom>
                  Entrants: {entrant.event?.entrant_count ?? "-"}
                </Typography>

                <Box textAlign="center" my={2}>
                  {entrant.hero?.proxy_image && (
                    <img
                      src={entrant.hero.proxy_image}
                      alt={entrant.hero.name}
                      style={{
                        maxWidth: "200px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h6" align="center">
                  {entrant.hero?.name}
                </Typography>
                <Typography align="center" gutterBottom>
                  {entrant.hero?.full_name || "-"}
                </Typography>
                <Typography align="center" gutterBottom>
                  Alias: {entrant.hero?.alias || "-"}
                </Typography>
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/register-event")}
                    sx={{ mr: 2 }}
                  >
                    Change Registration
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancelRegistration}
                  >
                    Cancel Registration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ p: 2 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography>You haven’t registered for an event yet.</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/register-event")}
                >
                  Register for Event
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
