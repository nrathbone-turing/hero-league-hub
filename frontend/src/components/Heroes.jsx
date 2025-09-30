// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with search, pagination, and filters.
// Notes:
// - Replaces static Characters from P1.
// - Fetches from /api/heroes.
// - Reuses P1 stat card UI for hero display.

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

// Utility to capitalize the first letter of a word
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function Heroes() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch heroes from backend
  useEffect(() => {
    async function loadHeroes() {
      setLoading(true);
      try {
        const data = await apiFetch(`/heroes?search=${encodeURIComponent(search)}`);
        setHeroes(data);
        setError(null);
      } catch (err) {
        console.error("❌ Failed to fetch heroes:", err.message);
        setError("Failed to fetch heroes");
      } finally {
        setLoading(false);
      }
    }

    loadHeroes();
  }, [search]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading heroes...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error" role="alert">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      {/* Heading */}
      <Typography
        variant="h4"
        align="center"
        sx={{ mt: 2, mb: 3, fontWeight: "bold" }}
        data-testid="heroes-heading"
      >
        Heroes
      </Typography>

      {/* Search bar */}
      <Box display="flex" justifyContent="center" sx={{ mb: 3 }}>
        <TextField
          label="Search heroes"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "50%" }}
        />
      </Box>

      {/* Hero grid */}
      <Grid container spacing={2} justifyContent="center">
        {heroes.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ mt: 4 }}>
            No heroes found
          </Typography>
        ) : (
          heroes.map((hero) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={hero.id}>
              <Card
                data-testid={`hero-card-${hero.id}`}
                sx={{
                  maxWidth: 300,
                  margin: "auto",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Hero image */}
                {hero.image && (
                  <CardMedia
                    component="img"
                    sx={{ height: 250, objectFit: "cover" }}
                    image={hero.image}
                    alt={hero.name}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Hero name */}
                  <Typography variant="h6" component="h3">
                    {hero.name}
                  </Typography>

                  {/* Render all available stats */}
                  {hero.powerstats &&
                    Object.entries(hero.powerstats).map(([key, val]) => (
                      <Typography key={key} variant="body2">
                        {capitalize(key)}: {val}
                      </Typography>
                    ))}

                  {/* Select button */}
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1 }}
                    aria-label={`select ${hero.name.toLowerCase()}`}
                    onClick={() => navigate("/battle", { state: { hero } })}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}
