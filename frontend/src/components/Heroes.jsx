// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with search, pagination, and sortable columns.
// Notes:
// - Fetches from /api/heroes (backend proxy).
// - Adds fallback: prefer proxy_image, fallback to image if missing.
// - Skips API calls if search is empty (prevents 400 errors).
// - Adds client-side sorting with TableSortLabel.
// - Removes inline image column; image shown in modal dialog instead.
// - Adds Full Name, Alias, Alignment columns.

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { apiFetch } from "../api";

export default function Heroes() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // Sorting
  const [orderBy, setOrderBy] = useState("id");
  const [order, setOrder] = useState("asc");

  // Modal
  const [selectedHero, setSelectedHero] = useState(null);

  async function fetchHeroes(query = "", pageNum = 0, perPage = 25) {
    if (!query) {
      setHeroes([]);
      setError(null);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(
        `/heroes?search=${encodeURIComponent(query)}&page=${pageNum + 1}&per_page=${perPage}`
      );
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

  // Sorting helpers
  const sortData = (array, orderBy, order) => {
    return [...array].sort((a, b) => {
      const valA = a[orderBy] ?? "";
      const valB = b[orderBy] ?? "";
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedHeroes = sortData(heroes, orderBy, order);

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
                {["id", "name", "full_name", "alias", "alignment"].map((col) => (
                  <TableCell key={col} sortDirection={orderBy === col ? order : false}>
                    <TableSortLabel
                      active={orderBy === col}
                      direction={orderBy === col ? order : "asc"}
                      onClick={() => handleSort(col)}
                    >
                      {col.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedHeroes.map((hero) => (
                <TableRow
                  key={hero.id}
                  hover
                  onClick={() => setSelectedHero(hero)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{hero.id}</TableCell>
                  <TableCell>{hero.name}</TableCell>
                  <TableCell>{hero.full_name || "-"}</TableCell>
                  <TableCell>{hero.alias || "-"}</TableCell>
                  <TableCell>{hero.alignment || "-"}</TableCell>
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

      {/* Hero detail dialog */}
      <Dialog
        open={!!selectedHero}
        onClose={() => setSelectedHero(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedHero?.name}</DialogTitle>
        <DialogContent>
          {selectedHero?.proxy_image || selectedHero?.image ? (
            <Box textAlign="center" mb={2}>
              <img
                src={selectedHero.proxy_image || selectedHero.image}
                alt={selectedHero.name}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
            </Box>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>
              No image available
            </Typography>
          )}
          <Typography>
            <strong>Full Name:</strong> {selectedHero?.full_name || "-"}
          </Typography>
          <Typography>
            <strong>Alias:</strong> {selectedHero?.alias || "-"}
          </Typography>
          <Typography>
            <strong>Alignment:</strong> {selectedHero?.alignment || "-"}
          </Typography>
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // TODO: wire up hero selection + analytics later
                console.log("Choose Hero:", selectedHero?.id);
                setSelectedHero(null);
              }}
            >
              Choose Hero
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
