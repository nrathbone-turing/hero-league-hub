// File: frontend/src/components/Heroes.jsx
// Purpose: Dynamic hero pool browser with debounced search, alignment filter, and symmetrical placeholder layout.
// Notes:
// - Adds dropdown filter for alignment (All, Hero, Villain).
// - Debounces API calls to reduce load on typing.
// - Layout matches Events.jsx placeholder grid style.

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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  const [alignmentFilter, setAlignmentFilter] = useState("all");

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

  // --- Debounced Fetch ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchHeroes(search, page, rowsPerPage, alignmentFilter);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, page, rowsPerPage, alignmentFilter]);

  async function fetchHeroes(query, pageNum, perPage, alignFilter) {
    setLoading(true);
    try {
      const url = new URL(`/heroes`, window.location.origin);
      if (query.trim()) url.searchParams.set("search", query);
      url.searchParams.set("page", pageNum + 1);
      url.searchParams.set("per_page", perPage);
      if (alignFilter !== "all") url.searchParams.set("alignment", alignFilter);

      const data = await apiFetch(url.pathname + "?" + url.searchParams.toString());
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

  const dialogImgSrc = (h) => h?.proxy_image || h?.image || null;

  async function handleChooseHero(hero) {
    try {
      const entrantKey = `entrant_${user?.id}`;
      const heroKey = `chosenHero_${user?.id}`;
      const storedEntrant = entrantKey ? localStorage.getItem(entrantKey) : null;
      let parsedEntrant = storedEntrant ? JSON.parse(storedEntrant) : null;

      if (parsedEntrant) {
        const eventName = parsedEntrant.event?.name || "your current event";
        if (!window.confirm(`You are registered for ${eventName}. Replace your hero with ${hero.name}?`)) {
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

  const formatAliases = (aliases) => (Array.isArray(aliases) ? aliases.join(", ") : aliases || "-");

  const formatLabel = (key) =>
    key.replace(/_/g, " ").replace(/-/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Container sx={{ mt: 4 }} data-testid="heroes-container">
      <Typography
        variant="h4"
        align="center"
        sx={{ mt: 2, mb: 3, fontWeight: "bold" }}
        data-testid="heroes-heading"
      >
        Heroes
      </Typography>

      {/* Placeholder layout and filters */}
      <Grid container justifyContent="space-between" sx={{ mb: 2 }} data-testid="heroes-filter-grid">
        <Grid item xs={12} sm={4} md={3}>
          <Box
            sx={{
              bgcolor: "#e0e0e0",
              borderRadius: 2,
              height: 180,
              width: 180,
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "bold",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            }}
            aria-label="hero placeholder"
            data-testid="hero-placeholder"
          >
            Hero
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          sm={4}
          md={6}
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}
          data-testid="search-filter-container"
        >
          <TextField
            label="Search Heroes"
            aria-label="search heroes"
            data-testid="search-heroes-input"
            value={search}
            onChange={handleSearchChange}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 150 }} data-testid="alignment-form">
            <InputLabel id="alignment-filter-label">Alignment</InputLabel>
            <Select
              labelId="alignment-filter-label"
              label="Alignment"
              value={alignmentFilter}
              onChange={(e) => setAlignmentFilter(e.target.value)}
              data-testid="alignment-filter"
              aria-label="alignment filter"
            >
              <MenuItem value="all" data-testid="filter-all">All</MenuItem>
              <MenuItem value="hero" data-testid="filter-hero">Hero</MenuItem>
              <MenuItem value="villain" data-testid="filter-villain">Villain</MenuItem>
              <MenuItem value="antihero" data-testid="filter-antihero">Antihero</MenuItem>
              <MenuItem value="unknown" data-testid="filter-unknown">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4} md={3}>
          <Box
            sx={{
              bgcolor: "#e0e0e0",
              borderRadius: 2,
              height: 180,
              width: 180,
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "bold",
              boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
            }}
            aria-label="villain placeholder"
            data-testid="villain-placeholder"
          >
            Villain
          </Box>
        </Grid>
      </Grid>

      {loading && (
        <Box textAlign="center" mt={2} data-testid="loading-state">
          <CircularProgress data-testid="loading-spinner" />
          <Typography data-testid="loading-text">Loading heroes...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" role="alert" align="center" sx={{ mt: 2 }} data-testid="error-alert">
          {error}
        </Typography>
      )}

      {!loading && !error && heroes.length === 0 && (search || alignmentFilter !== "all") && (
        <Typography align="center" sx={{ mt: 2 }} data-testid="no-heroes-text">
          No heroes found
        </Typography>
      )}

      {heroes.length > 0 && (
        <Box data-testid="heroes-results-section">
          <Table size="small" data-testid="heroes-table" aria-label="heroes table">
            <TableHead data-testid="heroes-table-head">
              <TableRow>
                {["id", "name", "full_name", "alias", "alignment"].map((col) => (
                  <TableCell key={col} data-testid={`header-${col}`} sortDirection={orderBy === col ? order : false}>
                    <TableSortLabel
                      active={orderBy === col}
                      direction={orderBy === col ? order : "asc"}
                      onClick={() => handleSort(col)}
                      data-testid={`sort-${col}`}
                    >
                      {formatLabel(col)}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody data-testid="heroes-table-body">
              {sortedHeroes.map((hero) => (
                <TableRow
                  key={hero.id}
                  hover
                  onClick={() => setSelectedHero(hero)}
                  sx={{ cursor: "pointer" }}
                  data-testid={`hero-row-${hero.id}`}
                  aria-label={`hero-row-${hero.id}`}
                >
                  <TableCell data-testid={`hero-id-${hero.id}`}>{hero.id}</TableCell>
                  <TableCell data-testid={`hero-name-${hero.id}`}>{hero.name}</TableCell>
                  <TableCell data-testid={`hero-fullname-${hero.id}`}>{hero.full_name || "-"}</TableCell>
                  <TableCell data-testid={`hero-alias-${hero.id}`}>{formatAliases(hero.alias)}</TableCell>
                  <TableCell data-testid={`hero-alignment-${hero.id}`}>{hero.alignment || "-"}</TableCell>
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
            labelDisplayedRows={({ from, to, count }) => (
              <span data-testid="pagination-info" aria-label="pagination info">
                {`${from}-${to} of ${count}`}
              </span>
            )}
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
        aria-label="hero details dialog"
      >
        <DialogTitle data-testid="hero-dialog-title">{selectedHero?.name}</DialogTitle>
        <DialogContent dividers data-testid="hero-dialog-content">
          {dialogImgSrc(selectedHero) ? (
            <Box textAlign="center" mb={2} data-testid="hero-image-box">
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
              data-testid="no-hero-image"
            >
              No image available
            </Typography>
          )}

          <Typography
            align="center"
            sx={{ fontWeight: "bold", mb: 1 }}
            data-testid="hero-alignment-text"
          >
            {selectedHero?.alignment?.toUpperCase() || "UNKNOWN"}
          </Typography>

          {selectedHero?.powerstats && (
            <Box sx={{ mb: 2 }} data-testid="hero-powerstats">
              <Typography variant="subtitle1" gutterBottom>
                Powerstats
              </Typography>
              {Object.entries(selectedHero.powerstats).map(([stat, val]) => (
                <Typography key={stat} data-testid={`stat-${stat}`}>
                  <strong>{formatLabel(stat)}:</strong> {val}
                </Typography>
              ))}
            </Box>
          )}

          {selectedHero?.biography && (
            <Accordion data-testid="bio-accordion">
              <AccordionSummary expandIcon={<ExpandMoreIcon />} data-testid="bio-summary">
                <Typography variant="subtitle1">Biography</Typography>
              </AccordionSummary>
              <AccordionDetails data-testid="bio-details">
                {Object.entries(selectedHero.biography).map(([key, val]) => (
                  <Typography key={key} data-testid={`bio-${key}`}>
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {key.toLowerCase().includes("alias")
                      ? formatAliases(val)
                      : val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {selectedHero?.appearance && (
            <Accordion data-testid="appearance-accordion">
              <AccordionSummary expandIcon={<ExpandMoreIcon />} data-testid="appearance-summary">
                <Typography variant="subtitle1">Appearance</Typography>
              </AccordionSummary>
              <AccordionDetails data-testid="appearance-details">
                {Object.entries(selectedHero.appearance).map(([key, val]) => (
                  <Typography key={key} data-testid={`appearance-${key}`}>
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {Array.isArray(val) ? val.join(", ") : val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {selectedHero?.work && (
            <Accordion data-testid="work-accordion">
              <AccordionSummary expandIcon={<ExpandMoreIcon />} data-testid="work-summary">
                <Typography variant="subtitle1">Work</Typography>
              </AccordionSummary>
              <AccordionDetails data-testid="work-details">
                {Object.entries(selectedHero.work).map(([key, val]) => (
                  <Typography key={key} data-testid={`work-${key}`}>
                    <strong>{formatLabel(key)}:</strong> {val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {selectedHero?.connections && (
            <Accordion data-testid="connections-accordion">
              <AccordionSummary expandIcon={<ExpandMoreIcon />} data-testid="connections-summary">
                <Typography variant="subtitle1">Connections</Typography>
              </AccordionSummary>
              <AccordionDetails data-testid="connections-details">
                {Object.entries(selectedHero.connections).map(([key, val]) => (
                  <Typography key={key} data-testid={`connections-${key}`}>
                    <strong>{formatLabel(key)}:</strong> {val || "-"}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          <Box sx={{ mt: 3, textAlign: "center" }} data-testid="choose-hero-section">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleChooseHero(selectedHero)}
              data-testid="choose-hero-btn"
              aria-label="choose hero"
            >
              Choose Hero
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
