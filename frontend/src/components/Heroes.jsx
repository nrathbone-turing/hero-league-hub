// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with search, pagination, and filters.
// Notes:
// - Fetches from /api/heroes (backend proxy).
// - Skips API calls if search is empty (prevents 400 errors).
// - Includes search input and pagination controls.
// - Displays results in a MUI table (consistent with EventDetail).

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { apiFetch } from "../api";

export default function Heroes() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // MUI TablePagination is 0-indexed
  const [page, setPage] = useState(0);

  // Per your request: rows-per-page options 25, 50, 100. Default 25.
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Total count from backend
  const [total, setTotal] = useState(0);

  async function fetchHeroes(query = "", pageNum = 0, perPage = 25) {
    if (!query) {
      // Skip API call if query is empty
      setHeroes([]);
      setError(null);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(
        `/heroes?search=${encodeURIComponent(query)}&page=${pageNum + 1}&per_page=${perPage}`,
      );
      // Backend returns { results, total, page, per_page, total_pages }
      setHeroes(data.results || []);
      setTotal(data.total || 0);
      setError(null);
    } catch {
      setError("Failed to fetch heroes");
      setHeroes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHeroes(search, page, rowsPerPage);
  }, [search, page, rowsPerPage]);

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(0);
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
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <CircularProgress />
          <Typography>Loading heroes...</Typography>
        </Box>
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

      {heroes.length > 0 && (
        <Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Image</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {heroes.map((hero) => (
                <TableRow key={hero.id}>
                  <TableCell>{hero.id}</TableCell>
                  <TableCell>{hero.name}</TableCell>
                  <TableCell>
                    {hero.image && (
                      <img
                        src={hero.image}
                        alt={hero.name}
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </Box>
      )}
    </Container>
  );
}
