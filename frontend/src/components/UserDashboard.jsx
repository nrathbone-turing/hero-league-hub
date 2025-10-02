// File: frontend/src/components/UserDashboard.jsx
// Purpose: Landing page for non-admin participants.
// Notes:
// - Left: hero card (chosenHero logic preserved).
// - Right: registered event card (replaces analytics placeholder).
// - Shows event + hero if registered, otherwise prompt to register.

import { useAuth } from "../context/AuthContext";
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

  useEffect(() => {
    // Load hero from localStorage (legacy support)
    const storedHero = localStorage.getItem("chosenHero");
    if (storedHero) {
      try {
        const parsed = JSON.parse(storedHero);
        setChosenHero(Array.isArray(parsed) ? parsed[0] : parsed);
      } catch {
        setChosenHero(null);
      }
    }

    // Load event registration
    const storedEntrant = localStorage.getItem("entrant");
    if (storedEntrant) {
      try {
        setEntrant(JSON.parse(storedEntrant));
      } catch {
        setEntrant(null);
      }
    }
  }, []);

  return (
    <Container sx={{ mt: 4 }} data-testid="user-dashboard">
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Welcome, {user?.username || "Participant"}
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Hero card */}
        <Grid item xs={12} md={6}>
          {chosenHero ? (
            <Card sx={{ p: 2 }}>
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
                <Typography>
                  <strong>Alias:</strong> {chosenHero.alias || "-"}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {chosenHero.powerstats &&
                    Object.entries(chosenHero.powerstats).map(([stat, val]) => (
                      <Typography key={stat}>
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {val}
                      </Typography>
                    ))}
                </Box>
                <Box
                  sx={{
                    mt: 3,
                    textAlign: "center",
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/heroes")}
                  >
                    Choose Another Hero
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/register-event")}
                  >
                    Register for Event
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ p: 2 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body1" gutterBottom>
                  You haven’t selected your hero yet.
                </Typography>
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
                <Typography variant="h5" align="center" gutterBottom>
                  {entrant.event?.name || "Event"}
                </Typography>
                <Typography align="center" gutterBottom>
                  {entrant.event?.date || "TBA"}
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
                  >
                    Change Registration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ p: 2 }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body1" gutterBottom>
                  You haven’t registered for an event yet.
                </Typography>
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
