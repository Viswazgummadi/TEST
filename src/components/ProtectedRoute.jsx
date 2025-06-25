// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const ProtectedRoute = () => {
  const { isAdmin, token } = useAdmin(); // Check token for robustness

  // If still loading token status, maybe show a loader
  // if (isLoadingToken) return <LoadingSpinner />;

  if (!isAdmin || !token) {
    // Redirect to login page or home page if not admin
    // For now, let's redirect to home. A dedicated /login page might be better.
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // Render the child route (AdminSettingsPage)
};

export default ProtectedRoute;
