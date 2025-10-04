// File: frontend/src/components/MatchDashboard.jsx
// Purpose: MUI-styled form for creating matches.
// Notes:
// - Casts entrant IDs + winner ID to numbers before sending.
// - Validates that winner_id (if provided) is one of the entrants.
// - Prevents duplicate submissions and shows inline error feedback.
// - Adds debug logging for payload and validation errors.

import { useState } from "react";
import { apiFetch } from "../api";
import { Card, CardContent, Typography, TextField, Button, Box } from "@mui/material";

export default function MatchDashboard({ eventId, onMatchAdded }) {
  const [formData, setFormData] = useState({
    round: "",
    entrant1_id: "",
    entrant2_id: "",
    scores: "",
    winner_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      event_id: Number(eventId),
      round: Number(formData.round),
      entrant1_id: Number(formData.entrant1_id),
      entrant2_id: Number(formData.entrant2_id),
      scores: formData.scores,
      winner_id: formData.winner_id ? Number(formData.winner_id) : null,
    };

    console.log("🔎 MatchDashboard submitting:", payload);

    // Validation: winner must be one of the entrants
    if (
      payload.winner_id &&
      payload.winner_id !== payload.entrant1_id &&
      payload.winner_id !== payload.entrant2_id
    ) {
      console.warn("⚠️ Invalid winner_id:", payload.winner_id);
      setError("Winner ID must match one of the entrants");
      setSubmitting(false);
      return;
    }

    try {
      await apiFetch("/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setFormData({
        round: "",
        entrant1_id: "",
        entrant2_id: "",
        scores: "",
        winner_id: "",
      });
      setError(null);
      if (typeof onMatchAdded === "function") onMatchAdded();
    } catch {
      setError("Failed to add match");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add Match
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Round"
            value={formData.round}
            onChange={(e) => setFormData({ ...formData, round: e.target.value })}
            required
          />
          <TextField
            label="Entrant 1 ID"
            value={formData.entrant1_id}
            onChange={(e) => setFormData({ ...formData, entrant1_id: e.target.value })}
            required
          />
          <TextField
            label="Entrant 2 ID"
            value={formData.entrant2_id}
            onChange={(e) => setFormData({ ...formData, entrant2_id: e.target.value })}
            required
          />
          <TextField
            label="Scores"
            value={formData.scores}
            onChange={(e) => setFormData({ ...formData, scores: e.target.value })}
            required
          />
          <TextField
            label="Winner ID"
            value={formData.winner_id}
            onChange={(e) => setFormData({ ...formData, winner_id: e.target.value })}
          />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Match"}
          </Button>
        </Box>
        {error && (
          <Typography color="error" role="alert" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
