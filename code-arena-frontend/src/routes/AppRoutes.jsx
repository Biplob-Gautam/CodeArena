import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import Matchmaking from "../pages/matchmaking/Matchmaking";
import BattleRoom from "../pages/battle/BattleRoom";
import Profile from "../pages/profile/profile";
import BattleResult from "../pages/result/BattleResult";

import ProtectedRoute from "./ProtectedRoute";

function PublicRoute({ children }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  return token ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/matchmaking"
        element={
          <ProtectedRoute>
            <Matchmaking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/battle/:battleId"
        element={
          <ProtectedRoute>
            <BattleRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/result"
        element={
          <ProtectedRoute>
            <BattleResult />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;