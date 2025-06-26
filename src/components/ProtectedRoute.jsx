// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom"; // ✅ 1. IMPORT useLocation
import { useAdmin } from "../context/AdminContext";

const ProtectedRoute = () => {
  const { isAdmin, token } = useAdmin();
  const location = useLocation(); // ✅ 2. GET THE CURRENT LOCATION

  // ✅ 3. CHECK FOR THE GOOGLE AUTH SUCCESS PARAMETER
  const queryParams = new URLSearchParams(location.search);
  const isGoogleAuthSuccess = queryParams.get('gauth') === 'success';

  // If we are coming back from a successful Google OAuth flow,
  // allow rendering the page even if the token/isAdmin state isn't immediately ready.
  // The ReposPage will handle opening the modal.
  if (isGoogleAuthSuccess) {
    return <Outlet />;
  }

  // Original protection logic: If not Google auth success, and not admin, redirect.
  if (!isAdmin || !token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;