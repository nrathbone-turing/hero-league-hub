// File: frontend/src/components/Analytics.jsx
// Purpose: Displays analytics dashboards for hero usage, win rates, and event trends.
// Notes:
// - Fetches from /api/analytics endpoints with fallback mock data.
// - Includes aria-labels and data-testid for testing.

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

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

export default function Analytics() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    heroes: [],
    results: [],
    participation: [],
  });

  // fallback for offline/local tests
  const fallbackData = {
    heroes: [
      { hero_name: "Superman", usage_count: 20, win_rate: 0.75 },
      { hero_name: "Batman", usage_count: 15, win_rate: 0.68 },
      { hero_name: "Wonder Woman", usage_count: 10, win_rate: 0.6 },
      { hero_name: "Spiderman", usage_count: 8, win_rate: 0.54 },
    ],
    participation: [
      { event_name: "Hero Cup", participants: 16 },
      { event_name: "Villain Showdown", participants: 12 },
      { event_name: "Battle Royale", participants: 20 },
    ],
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [heroesRes, resultsRes, usageRes] = await Promise.all([
          fetch("/api/analytics/heroes"),
          fetch("/api/analytics/results"),
          fetch("/api/analytics/usage"),
        ]);

        const [heroes, results, usage] = await Promise.all([
          heroesRes.ok ? heroesRes.json() : { heroes: fallbackData.heroes },
          resultsRes.ok ? resultsRes.json() : { events: [] },
          usageRes.ok ? usageRes.json() : { participation: fallbackData.participation },
        ]);

        setData({
          heroes: heroes.heroes || fallbackData.heroes,
          results: results.events || [],
          participation: usage.participation || fallbackData.participation,
        });
      } catch (err) {
        console.error("❌ Analytics fetch failed:", err);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container>
        <Typography variant="h6" align="center">
          Loading analytics...
        </Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        data-testid="analytics-header"
      >
        Hero League Analytics
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, newVal) => setTab(newVal)}
          centered
          variant="fullWidth"
          aria-label="Analytics Tabs"
        >
          <Tab label="Hero Usage" data-testid="tab-usage" />
          <Tab label="Win Rates" data-testid="tab-winrates" />
          <Tab label="Participation" data-testid="tab-participation" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box
          aria-label="Hero Usage Chart"
          data-testid="chart-usage"
          textAlign="center"
        >
          <Typography variant="h6" gutterBottom>
            Hero Usage Distribution
          </Typography>
          <PieChart width={400} height={300}>
            <Pie
              data={data.heroes}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="usage_count"
            >
              {data.heroes.map((entry, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  data-testid={`usage-slice-${entry.hero_name}`}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Box>
      )}

      {tab === 1 && (
        <Box
          aria-label="Hero Win Rates Chart"
          data-testid="chart-winrates"
          textAlign="center"
        >
          <Typography variant="h6" gutterBottom>
            Hero Win Rates (%)
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={data.heroes}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hero_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="win_rate" fill="#82ca9d" />
          </BarChart>
        </Box>
      )}

      {tab === 2 && (
        <Box
          aria-label="Event Participation Chart"
          data-testid="chart-participation"
          textAlign="center"
        >
          <Typography variant="h6" gutterBottom>
            Event Participation
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={data.participation}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="participants" fill="#ffc658" />
          </BarChart>
        </Box>
      )}
    </Container>
  );
}
