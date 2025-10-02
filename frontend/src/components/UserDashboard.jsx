// File: frontend/src/components/UserDashboard.jsx
// Purpose: Landing page for non-admin participants.
// Notes:
// - Displays welcome + selected heroes summary.
// - Provides entry point to Hero Selection (Heroes.jsx).
// - Future: add brackets/analytics view.

import { useAuth } from "../context/AuthContext";
import { Container, Typography, Button, Box, Card, CardContent } from "@mui/material";
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
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.username || "Participant"}
      </Typography>

      <Box sx={{ my: 3 }}>
        {chosenHero ? (
          <Card sx={{ maxWidth: 400, p: 2 }}>
            <CardContent>
              <Typography variant="h6">{chosenHero.name}</Typography>
              <Typography variant="subtitle2" gutterBottom>
                {chosenHero.full_name || "-"}
              </Typography>
              {chosenHero.proxy_image && (
                <Box textAlign="center" mb={2}>
                  <img
                    src={chosenHero.proxy_image}
                    alt={chosenHero.name}
                    style={{ maxWidth: "100%", borderRadius: "8px" }}
                  />
                </Box>
              )}
              <Typography>
                <strong>Alias:</strong> {chosenHero.alias || "-"}
              </Typography>
              <Typography>
                <strong>Alignment:</strong> {chosenHero.alignment || "-"}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Typography variant="body1">
              You haven't selected your hero yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate("/heroes")}
            >
              Choose Hero
            </Button>
          </>
        )}
      </Box>

      {/* TODO: add future sections like bracket view, analytics, etc. */}
    </Container>
  );
}
