// File: frontend/src/components/NotFoundPage.jsx
// Purpose: Displayed when user navigates to an unknown route (404).

import { Container, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <Container sx={{ textAlign: "center", mt: 8 }} data-testid="notfound-page">
      <Typography variant="h2" gutterBottom>
        404
      </Typography>
      <Typography variant="h6" gutterBottom>
        Page Not Found
      </Typography>
      <Button
        component={RouterLink}
        to="/"
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
      >
        Back to Events
      </Button>
    </Container>
  );
}
