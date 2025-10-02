// File: frontend/src/components/UserDashboard.jsx
// Purpose: Landing page for non-admin participants.
// Notes:
// - Displays welcome + selected hero card styled like battle page.
// - Shows powerstats + alignment prominently.
// - Includes "Choose Another Hero" button.
// - Placeholder parallel card for future analytics.

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

  useEffect(() => {
    const stored = localStorage.getItem("chosenHero");
    if (stored) {
      try {
        setChosenHero(JSON.parse(stored));
      } catch {
        setChosenHero(null);
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
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/heroes")}
                  >
                    Choose Another Hero
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

        {/* Placeholder analytics card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, minHeight: "100%" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                Future Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stats and performance tracking will appear here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
