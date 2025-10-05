// File: frontend/src/App.jsx
// Purpose: Root component for React app.
// Notes:
// - App assumes it is already wrapped with AuthProvider (in main.jsx).
// - Protects Event and EventRegistration routes with ProtectedRoute.
// - Redirects based on user.is_admin flag.

import { Routes, Route, Navigate } from "react-router-dom";
import Events from "./components/Events";
import EventDetail from "./components/EventDetail";
import NotFoundPage from "./components/NotFoundPage";
import ServerErrorPage from "./components/ServerErrorPage";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ProtectedRoute from "./components/ProtectedRoute";
import UserDashboard from "./components/UserDashboard";
import Heroes from "./components/Heroes";
import EventRegistration from "./components/EventRegistration";
import Analytics from "./components/Analytics";

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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/heroes"
        element={
          <ProtectedRoute>
            <Heroes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register-event"
        element={
          <ProtectedRoute>
            <EventRegistration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Events />
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
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
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
    <div>
      <Navbar />
      <RootRoutes />
    </div>
  );
}

export default App;
