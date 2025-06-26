import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ Import useLocation and useNavigate
import { navItems } from "../navigation.js"; // ✅ Import navItems

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // ✅ Initialize navigate
  const location = useLocation(); // ✅ Initialize location

  useEffect(() => {
    if (token) {
      localStorage.setItem("adminToken", token);
      setIsAdmin(true);
    } else {
      localStorage.removeItem("adminToken");
      setIsAdmin(false);
    }
  }, [token]);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      setToken(data.token);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      setIsLoading(false);
      setToken(null);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    // ✅ NEW: Post-logout redirection logic
    const currentPath = location.pathname;
    // Check if the current path is an admin-specific path
    if (currentPath.startsWith("/admin/")) {
      const navItem = navItems.find(item => item.adminHref === currentPath);
      if (navItem && navItem.href) {
        // If there's a public equivalent, go there
        navigate(navItem.href, { replace: true });
      } else {
        // Otherwise, redirect to a safe public page like the homepage
        navigate('/', { replace: true });
      }
    }
  };

  const value = {
    isAdmin,
    token,
    login,
    logout,
    isLoading,
    error,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};