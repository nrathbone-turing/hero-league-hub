// File: frontend/src/components/Analytics.jsx
// Purpose: Displays analytics dashboards using backend data.
// Notes:
// - Fetches from /api/analytics endpoints (heroes, results, usage).
// - Adds loading/error handling and empty-state fallbacks.
// - Preserves test IDs for stable tests and accessibility.

import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { apiFetch } from "../api";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

export default function Analytics() {
  const [tab, setTab] = useState(0);
  const [heroData, setHeroData] = useState([]);
  const [winRateData, setWinRateData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchAnalytics(endpoint, setter) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/analytics/${endpoint}`);
      if (!data) throw new Error("Empty response");
      if (endpoint === "heroes") setter(data.heroes || []);
      else if (endpoint === "results") setter(data.events || []);
      else if (endpoint === "usage") setter(data.participation || []);
    } catch (err) {
      console.error(`❌ Failed to load ${endpoint} analytics:`, err);
      setError(`Failed to load ${endpoint} analytics`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 0 && heroData.length === 0) fetchAnalytics("heroes", setHeroData);
    if (tab === 1 && winRateData.length === 0) fetchAnalytics("results", setWinRateData);
    if (tab === 2 && usageData.length === 0) fetchAnalytics("usage", setUsageData);
  }, [tab]);

  const renderEmpty = (msg) => (
    <Typography data-testid="empty-state" color="text.secondary">
      {msg}
    </Typography>
  );

  return (
    <Container sx={{ mt: 4 }} data-testid="analytics-page">
      <Typography variant="h4" align="center" gutterBottom>
        Hero League Analytics
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, newVal) => setTab(newVal)}
          centered
          variant="fullWidth"
          aria-label="Analytics category tabs"
        >
          <Tab label="Hero Usage" data-testid="tab-usage" />
          <Tab label="Win Rates" data-testid="tab-winrates" />
          <Tab label="Participation" data-testid="tab-participation" />
        </Tabs>
      </Paper>

      {loading && (
        <Box textAlign="center" data-testid="loading-spinner">
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" align="center" data-testid="error-msg">
          {error}
        </Typography>
      )}

      {!loading && !error && tab === 0 && (
        <Box textAlign="center" data-testid="chart-usage" aria-label="Hero Usage Chart">
          <Typography variant="h6" gutterBottom>
            Hero Usage Distribution
          </Typography>
          {heroData.length === 0 ? (
            renderEmpty("No hero data available")
          ) : (
            <PieChart width={400} height={300}>
              <Pie
                data={heroData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="usage_count"
                nameKey="hero_name"
              >
                {heroData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </Box>
      )}

      {!loading && !error && tab === 1 && (
        <Box textAlign="center" data-testid="chart-winrates" aria-label="Hero Win Rate Chart">
          <Typography variant="h6" gutterBottom>
            Hero Win Rates (%)
          </Typography>
          {winRateData.length === 0 ? (
            renderEmpty("No match result data available")
          ) : (
            <BarChart
              width={500}
              height={300}
              data={winRateData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hero_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="win_rate" fill="#82ca9d" />
            </BarChart>
          )}
        </Box>
      )}

      {!loading && !error && tab === 2 && (
        <Box textAlign="center" data-testid="chart-participation" aria-label="Event Participation Chart">
          <Typography variant="h6" gutterBottom>
            Event Participation
          </Typography>
          {usageData.length === 0 ? (
            renderEmpty("No participation data available")
          ) : (
            <BarChart
              width={500}
              height={300}
              data={usageData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="participants" fill="#ffc658" />
            </BarChart>
          )}
        </Box>
      )}
    </Container>
  );
}
