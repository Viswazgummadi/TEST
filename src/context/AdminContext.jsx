import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { navItems } from "../navigation.js";

// ✅ Import the new centralized fetchApi utility
import createFetchApi from "../utils/api";

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

// ✅ AdminProvider now accepts apiBaseUrl as a prop
export const AdminProvider = ({ children, apiBaseUrl }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Create the fetchApi function using the provided apiBaseUrl
  const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

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
      // ✅ Add trailing slash here
      const data = await fetchApi("/api/admin/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

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
    const currentPath = location.pathname;
    if (currentPath.startsWith("/admin/")) {
      const navItem = navItems.find(item => item.adminHref === currentPath);
      if (navItem && navItem.href) {
        navigate(navItem.href, { replace: true });
      } else {
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