// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with search, pagination, and sortable columns.
// Notes:
// - Namespaced localStorage by user id.
// - Stable test selectors via data-testid on table, dialog, and fields.

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
import { useAuth } from "../context/AuthContext";

export default function Heroes() {
  const { user } = useAuth();
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

  const navigate = useNavigate();

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

  // Compute dialog image src:
  const dialogImgSrc = (h) => {
    if (!h) return null;
    if (h.proxy_image) return h.proxy_image;
    if (h.image) return h.image;
    return null;
  };

  async function handleChooseHero(hero) {
    try {
      const entrantKey = `entrant_${user?.id}`;
      const heroKey = `chosenHero_${user?.id}`;
      const storedEntrant = entrantKey ? localStorage.getItem(entrantKey) : null;
      let parsedEntrant = storedEntrant ? JSON.parse(storedEntrant) : null;

      if (parsedEntrant) {
        const eventName = parsedEntrant.event?.name || "your current event";
        if (
          !window.confirm(
            `You are registered for ${eventName}. Replace your hero with ${hero.name}?`
          )
        ) {
          return;
        }
        parsedEntrant.hero = hero;
        localStorage.setItem(entrantKey, JSON.stringify(parsedEntrant));
      } else {
        localStorage.setItem(heroKey, JSON.stringify(hero));
      }

      setSelectedHero(null);
      navigate("/dashboard");
    } catch (err) {
      alert("❌ Failed to choose hero: " + err.message);
    }
  }

  // Format helpers
  const formatAliases = (aliases) => {
    if (!aliases) return "-";
    return Array.isArray(aliases) ? aliases.join(", ") : aliases;
  };

  const formatLabel = (key) =>
    key
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

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
        <Box textAlign="center" mt={2}>
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
          <Table size="small" data-testid="heroes-table">
            <TableHead>
              <TableRow>
                {["id", "name", "full_name", "alias", "alignment"].map((col) => (
                  <TableCell key={col} sortDirection={orderBy === col ? order : false}>
                    <TableSortLabel
                      active={orderBy === col}
                      direction={orderBy === col ? order : "asc"}
                      onClick={() => handleSort(col)}
                    >
                      {formatLabel(col)}
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
                  data-testid={`hero-row-${hero.id}`}
                >
                  <TableCell>{hero.id}</TableCell>
                  <TableCell>{hero.name}</TableCell>
                  <TableCell>{hero.full_name || "-"}</TableCell>
                  <TableCell>{formatAliases(hero.alias)}</TableCell>
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
        data-testid="hero-dialog"
      >
        <DialogTitle data-testid="hero-dialog-title">{selectedHero?.name}</DialogTitle>
        <DialogContent dividers>
          {dialogImgSrc(selectedHero) ? (
            <Box textAlign="center" mb={2}>
              <img
                src={dialogImgSrc(selectedHero)}
                alt={selectedHero?.name}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
            </Box>
          ) : (
            <Typography
              align="center"
              color="text.secondary"
              sx={{ mb: 2 }}
              data-testid="no-image-text"
            >
              No image available
            </Typography>
          )}

          <Typography
            align="center"
            sx={{ fontWeight: "bold", mb: 1 }}
            data-testid="hero-alignment"
          >
            {selectedHero?.alignment?.toUpperCase() || "UNKNOWN"}
          </Typography>

          {/* Powerstats */}
          {selectedHero?.powerstats && (
            <Box sx={{ mb: 2 }} data-testid="hero-powerstats">
              <Typography variant="subtitle1" gutterBottom>
                Powerstats
              </Typography>
              {Object.entries(selectedHero.powerstats).map(([stat, val]) => (
                <Typography key={stat} data-testid={`powerstat-${stat}`}>
                  <strong>{formatLabel(stat)}:</strong> {val}
                </Typography>
              ))}
            </Box>
          )}

          {/* Biography */}
          {selectedHero?.biography && (
            <Accordion data-testid="hero-biography">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Biography</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(selectedHero.biography).map(([key, val]) => (
                  <Typography key={key}>
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {key.toLowerCase().includes("alias")
                      ? formatAliases(val)
                      : val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Appearance */}
          {selectedHero?.appearance && (
            <Accordion data-testid="hero-appearance">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Appearance</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(selectedHero.appearance).map(([key, val]) => (
                  <Typography key={key}>
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {Array.isArray(val) ? val.join(", ") : val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Work */}
          {selectedHero?.work && (
            <Accordion data-testid="hero-work">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Work</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(selectedHero.work).map(([key, val]) => (
                  <Typography key={key}>
                    <strong>{formatLabel(key)}:</strong> {val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Connections */}
          {selectedHero?.connections && (
            <Accordion data-testid="hero-connections">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Connections</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(selectedHero.connections).map(([key, val]) => (
                  <Typography key={key}>
                    <strong>{formatLabel(key)}:</strong> {val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleChooseHero(selectedHero)}
              data-testid="choose-hero-btn"
            >
              Choose Hero
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
