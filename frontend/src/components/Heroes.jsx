// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with search, pagination, and filters.
// Notes:
// - Fetches from /api/heroes (backend proxy).
// - Provides search input and displays hero cards in a grid.
// - Pagination + advanced filters come later.

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  CircularProgress,
  Box,
} from "@mui/material";
import { apiFetch } from "../api";

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function Heroes() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  async function fetchHeroes(query = "") {
    setLoading(true);
    try {
      const data = await apiFetch(
        query ? `/heroes?search=${encodeURIComponent(query)}` : "/heroes",
      );
      setHeroes(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch heroes");
      setHeroes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHeroes();
  }, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    fetchHeroes(value);
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ mt: 2, mb: 3, fontWeight: "bold" }}
        data-testid="heroes-heading"
      >
        Heroes
      </Typography>

      <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
        <TextField
          label="Search Heroes"
          aria-label="search heroes"
          value={search}
          onChange={handleSearchChange}
        />
      </Box>

      {loading && (
        <Typography align="center" sx={{ mt: 2 }}>
          Loading heroes...
        </Typography>
      )}

      {error && (
        <Typography color="error" role="alert" align="center" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && heroes.length === 0 && (
        <Typography align="center" sx={{ mt: 2 }}>
          No heroes found
        </Typography>
      )}

      <Grid container spacing={2} justifyContent="center" sx={{ marginTop: 2 }}>
        {heroes.map((hero) => (
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
              {hero.image && (
                <CardMedia
                  component="img"
                  sx={{ height: 250, objectFit: "cover" }}
                  image={hero.image}
                  alt={hero.name}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3">
                  {hero.name}
                </Typography>
                {hero.powerstats &&
                  Object.entries(hero.powerstats).map(([key, val]) => (
                    <Typography key={key} variant="body2">
                      {capitalize(key)}: {val}
                    </Typography>
                  ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
