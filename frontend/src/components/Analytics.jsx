// File: frontend/src/components/Analytics.jsx
// Purpose: Displays analytics dashboards for hero usage, win rates, and event trends.
// Notes:
// - Includes aria-labels and data-testids for stable testing.
// - Currently uses mock data (API integration planned later).

import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
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
import { useState } from "react";

const mockHeroUsage = [
  { name: "Superman", value: 20 },
  { name: "Batman", value: 15 },
  { name: "Wonder Woman", value: 10 },
  { name: "Spiderman", value: 8 },
];

const mockWinRates = [
  { hero: "Superman", winRate: 75 },
  { hero: "Batman", winRate: 68 },
  { hero: "Wonder Woman", winRate: 60 },
  { hero: "Spiderman", winRate: 54 },
];

const mockParticipation = [
  { event: "Hero Cup", participants: 16 },
  { event: "Villain Showdown", participants: 12 },
  { event: "Battle Royale", participants: 20 },
];

export default function Analytics() {
  const [tab, setTab] = useState(0);
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

  return (
    <Container sx={{ mt: 4 }} data-testid="analytics-page">
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        data-testid="analytics-title"
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
          data-testid="analytics-tabs"
        >
          <Tab label="Hero Usage" data-testid="tab-usage" />
          <Tab label="Win Rates" data-testid="tab-winrates" />
          <Tab label="Participation" data-testid="tab-participation" />
        </Tabs>
      </Paper>

      {/* --- HERO USAGE --- */}
      {tab === 0 && (
        <Box textAlign="center" aria-label="Hero Usage Chart" data-testid="chart-usage">
          <Typography variant="h6" gutterBottom>
            Hero Usage Distribution
          </Typography>
          <PieChart width={400} height={300} aria-label="Hero Usage Pie Chart">
            <Pie
              data={mockHeroUsage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {mockHeroUsage.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  data-testid={`usage-slice-${entry.name}`}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Box>
      )}

      {/* --- WIN RATES --- */}
      {tab === 1 && (
        <Box textAlign="center" aria-label="Hero Win Rates Chart" data-testid="chart-winrates">
          <Typography variant="h6" gutterBottom>
            Hero Win Rates (%)
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={mockWinRates}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            aria-label="Hero Win Rates Bar Chart"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hero" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="winRate" fill="#82ca9d" data-testid="bar-winrates" />
          </BarChart>
        </Box>
      )}

      {/* --- PARTICIPATION --- */}
      {tab === 2 && (
        <Box textAlign="center" aria-label="Event Participation Chart" data-testid="chart-participation">
          <Typography variant="h6" gutterBottom>
            Event Participation
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={mockParticipation}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            aria-label="Event Participation Bar Chart"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="participants"
              fill="#ffc658"
              data-testid="bar-participation"
            />
          </BarChart>
        </Box>
      )}
    </Container>
  );
}
