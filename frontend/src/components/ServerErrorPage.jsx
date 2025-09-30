// File: frontend/src/components/ServerErrorPage.jsx
// Purpose: Displayed when a server error occurs (500).

import { Container, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function ServerErrorPage() {
  return (
    <Container sx={{ textAlign: "center", mt: 8 }}>
      <Typography component="h1" variant="h2" gutterBottom>
        500
      </Typography>
      <Typography variant="h6" gutterBottom>
        Something went wrong on our end.
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
