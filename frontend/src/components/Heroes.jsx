// File: frontend/src/components/Heroes.jsx
// Purpose: Hero pool browser with selection + entrant persistence.
// Notes:
// - On hero choose, updates entrant if exists, else redirects to event registration.
// - Uses Entrants API for persistence.

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { apiFetch } from "../api";
import { useNavigate } from "react-router-dom";

export default function Heroes() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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

  // Handle hero selection
  async function handleChooseHero(hero) {
    try {
      const entrantRaw = localStorage.getItem("entrant");
      if (!entrantRaw) {
        // No registration yet → redirect
        alert("Please register for an event first before choosing a hero.");
        navigate("/register-event");
        return;
      }

      const entrant = JSON.parse(entrantRaw);
      const entrantId = entrant.id;

      // Call API to update entrant with new hero
      const updated = await apiFetch(`/entrants/${entrantId}`, {
        method: "PUT",
        body: JSON.stringify({ hero_id: hero.id }),
      });

      // Persist updated entrant + hero
      localStorage.setItem("entrant", JSON.stringify(updated));
      localStorage.setItem("chosenHero", JSON.stringify(hero));

      alert(`✅ Hero updated to ${hero.name}`);
      setSelectedHero(null);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Failed to update hero:", err);
      alert(err.message || "Failed to update hero");
    }
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
      <Dialog open={!!selectedHero} onClose={() => setSelectedHero(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedHero?.name}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: "70vh" }}>
          <Box textAlign="center" mb={2}>
            {selectedHero?.proxy_image && (
              <img
                src={selectedHero.proxy_image}
                alt={selectedHero.name}
                style={{
                  maxWidth: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
            )}
          </Box>

          <Typography align="center" sx={{ fontWeight: "bold", mb: 1 }}>
            {selectedHero?.alignment?.toUpperCase() || "UNKNOWN"}
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Biography</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre>{JSON.stringify(selectedHero?.biography, null, 2)}</pre>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Appearance</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre>{JSON.stringify(selectedHero?.appearance, null, 2)}</pre>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Work & Connections</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre>{JSON.stringify(selectedHero?.work, null, 2)}</pre>
              <pre>{JSON.stringify(selectedHero?.connections, null, 2)}</pre>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleChooseHero(selectedHero)}
            >
              Choose Hero
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
