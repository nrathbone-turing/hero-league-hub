// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with search, pagination, and filters.
// Notes:
// - Fetches from /api/heroes (backend proxy).
// - Skips API calls if search is empty (prevents 400 errors).
// - Includes search input and pagination controls.


import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Box,
  Button,
} from "@mui/material";
import { apiFetch } from "../api";

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function Heroes() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchHeroes(query = "", pageNum = 1) {
    if (!query) {
      // Skip API call if query is empty
      setHeroes([]);
      setError(null);
      setTotalPages(1); // reset pagination UI
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(
        `/heroes?search=${encodeURIComponent(query)}&page=${pageNum}`,
      );
      // Assume backend returns { results: [], totalPages: n }
      setHeroes(data.results || []);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch {
      setError("Failed to fetch heroes");
      setHeroes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHeroes(search, page);
  }, [search, page]);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    setPage((p) => (p === 1 ? 1 : 1));
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

      {!loading && !error && heroes.length === 0 && search && (
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

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Typography variant="body1" sx={{ alignSelf: "center" }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </Box>
      )}
    </Container>
  );
}
