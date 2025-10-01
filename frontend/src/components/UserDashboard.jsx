// File: frontend/src/components/UserDashboard.jsx
// Purpose: Landing page for non-admin participants.
// Notes:
// - Displays welcome + selected heroes summary.
// - Provides entry point to Hero Selection (Heroes.jsx).
// - Future: add brackets/analytics view.

import { useAuth } from "../context/AuthContext";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.username || "Participant"}
      </Typography>

      <Box sx={{ my: 3 }}>
        {/* TODO: show selected heroes if any */}
        <Typography variant="body1">
          You haven’t selected your heroes yet.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => navigate("/heroes")}
        >
          Choose Heroes
        </Button>
      </Box>

      {/* TODO: add future sections like bracket view, analytics, etc. */}
    </Container>
  );
}
