// File: frontend/src/components/UserDashboard.jsx
// Purpose: Participant dashboard.
// Notes:
// - Uses namespaced keys: entrant_<id>, chosenHero_<id>
// - Cancels registration but preserves chosenHero if no matches exist.
// - Includes data-testid hooks for stable tests.
// - Renders hero powerstats when available.

import { useAuth } from "../context/AuthContext";
import { deleteEntrant } from "../api";
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

   
  useEffect(() => {
    syncFromStorage();
    const handler = () => syncFromStorage();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
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

      // Only clear chosenHero if entrant had matches
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
                  data-testid="hero-alignment"
                >
                  {chosenHero.alignment?.toUpperCase() || "UNKNOWN"}
                </Typography>
                <Box textAlign="center" mb={2}>
                  {chosenHero.proxy_image && (
                    <img
                      src={chosenHero.proxy_image}
                      alt={chosenHero.name}
                      data-testid="hero-image"
                      style={{
                        maxWidth: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="h5"
                  align="center"
                  gutterBottom
                  data-testid="hero-name"
                >
                  {chosenHero.name}
                </Typography>
                <Typography
                  align="center"
                  gutterBottom
                  data-testid="hero-full-name"
                >
                  {chosenHero.full_name || "-"}
                </Typography>
                <Typography data-testid="hero-alias">
                  <strong>Alias:</strong> {chosenHero.alias || "-"}
                </Typography>

                {/* Powerstats block */}
                <Box sx={{ mt: 2 }} data-testid="hero-powerstats">
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
                    data-testid="choose-another-hero"
                  >
                    Choose Another Hero
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ p: 2 }} data-testid="hero-card-empty">
              <CardContent sx={{ textAlign: "center" }}>
                <Typography>You haven’t selected your hero yet.</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/heroes")}
                  data-testid="choose-hero-btn"
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
            <Card sx={{ p: 2 }} data-testid="event-card">
              <CardContent>
                <Typography variant="h6" align="center" sx={{ fontWeight: "bold", mb: 2 }}>
                  Registered Event
                </Typography>
                <Typography variant="h5" align="center" gutterBottom data-testid="event-name">
                  {entrant.event?.name || "Event"}
                </Typography>
                <Typography align="center" gutterBottom data-testid="event-date">
                  {entrant.event?.date || "TBA"}
                </Typography>
                <Typography align="center" gutterBottom data-testid="event-status">
                  Status: {entrant.event?.status || "-"}
                </Typography>
                <Typography align="center" gutterBottom data-testid="event-entrants">
                  Entrants: {entrant.event?.entrant_count ?? "-"}
                </Typography>
                <Box textAlign="center" my={2}>
                  {entrant.hero?.proxy_image && (
                    <img
                      src={entrant.hero.proxy_image}
                      alt={entrant.hero.name}
                      data-testid="event-hero-image"
                      style={{
                        maxWidth: "200px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h6" align="center" data-testid="event-hero-name">
                  {entrant.hero?.name}
                </Typography>
                <Typography align="center" gutterBottom data-testid="event-hero-full-name">
                  {entrant.hero?.full_name || "-"}
                </Typography>
                <Typography align="center" gutterBottom data-testid="event-hero-alias">
                  Alias: {entrant.hero?.alias || "-"}
                </Typography>
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/register-event")}
                    sx={{ mr: 2 }}
                    data-testid="change-registration-btn"
                  >
                    Change Registration
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancelRegistration}
                    data-testid="cancel-registration-btn"
                  >
                    Cancel Registration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ p: 2 }} data-testid="event-card-empty">
              <CardContent sx={{ textAlign: "center" }}>
                <Typography>You haven’t registered for an event yet.</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/register-event")}
                  data-testid="register-event-btn"
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
