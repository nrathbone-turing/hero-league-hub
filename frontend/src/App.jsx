// File: frontend/src/App.jsx
// Purpose: Root component for React app.
// Notes:
// - Wraps app in AuthProvider for global state.
// - Protects Event routes with ProtectedRoute.
// - Redirects based on user.is_admin flag.

import { Routes, Route, Navigate } from "react-router-dom";
import EventDashboard from "./components/EventDashboard";
import EventDetail from "./components/EventDetail";
import NotFoundPage from "./components/NotFoundPage";
import ServerErrorPage from "./components/ServerErrorPage";
import AuthProvider, { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ProtectedRoute from "./components/ProtectedRoute";
import UserDashboard from "./components/UserDashboard";

function RootRoutes() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.is_admin ? (
              <Navigate to="/events" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <EventDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div>
        <Navbar />
        <RootRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;
