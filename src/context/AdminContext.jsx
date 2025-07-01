// src/context/AdminContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { navItems } from "../navigation.js";

import createFetchApi from "../utils/api";

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children, apiBaseUrl }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  // Correctly initialize token from "adminToken"
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("adminToken", token); // Always save to "adminToken"
      setIsAdmin(true);
    } else {
      localStorage.removeItem("adminToken"); // Always remove from "adminToken"
      setIsAdmin(false);
    }
  }, [token]);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
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