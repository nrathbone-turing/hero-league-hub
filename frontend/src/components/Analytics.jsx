// File: frontend/src/components/Analytics.jsx
// Purpose: Displays analytics dashboards for hero usage, win rates, and event trends.
// Notes:
// - Uses mock data initially (to be replaced with API analytics endpoints).
// - Includes tabs for each dashboard type.

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
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Hero League Analytics
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, newVal) => setTab(newVal)}
          centered
          variant="fullWidth"
        >
          <Tab label="Hero Usage" />
          <Tab label="Win Rates" />
          <Tab label="Participation" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            Hero Usage Distribution
          </Typography>
          <PieChart width={400} height={300}>
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Box>
      )}

      {tab === 1 && (
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            Hero Win Rates (%)
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={mockWinRates}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hero" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="winRate" fill="#82ca9d" />
          </BarChart>
        </Box>
      )}

      {tab === 2 && (
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            Event Participation
          </Typography>
          <BarChart
            width={500}
            height={300}
            data={mockParticipation}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event" />
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
