// File: frontend/src/components/ProtectedRoute.jsx
// Purpose: Higher-order component to guard routes.
// Notes:
// - Redirects to /login if user is not authenticated.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
