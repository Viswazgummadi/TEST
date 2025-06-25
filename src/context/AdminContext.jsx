import { createContext, useContext, useState, useEffect } from "react";

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null
  );
  const [isLoading, setIsLoading] = useState(false); // For login process
  const [error, setError] = useState(null); // For login errors

  // Effect to update isAdmin based on token presence and persist/clear token
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
        // Ensure this URL is correct
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

      setToken(data.token); // This will trigger the useEffect
      setIsLoading(false);
      return true; // Indicate success
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      setIsLoading(false);
      setToken(null); // Ensure token is cleared on error
      return false; // Indicate failure
    }
  };

  const logout = () => {
    setToken(null); // This will trigger the useEffect to remove from localStorage and set isAdmin to false
    // Potentially call a backend /api/admin/logout endpoint if we implement server-side token blacklisting later
  };

  // The existing theme toggle functionality (can be renamed or rethought later)
  // For now, let's keep it as a visual toggle that reflects isAdmin state
  const toggleAdmin = () => {
    // If we want this button to primarily be a login/logout trigger:
    if (isAdmin) {
      // If already admin, clicking it could mean logout
      // logout(); // Or, keep it as a theme toggle only if already logged in
      // For now, let's just keep the theme toggle behavior as it was,
      // but true admin status is now tied to the token.
      // This toggle might become purely cosmetic or removed if login is handled elsewhere.
      // Let's simplify: setIsAdmin directly toggles the visual theme for now.
      // The *actual* admin permissions are gated by the `token`.
      // We will connect this button to login/logout logic in Sidebar.jsx
    } else {
      // If not admin, trying to "toggle" it could prompt login.
      // This logic will be handled by the component using this toggle.
    }
    // For demonstration, let's assume the visual "isAdmin" for theme might still be toggled
    // independently for a moment, or it just reflects the logged-in state.
    // The important part is that `token` dictates true admin rights.
  };

  // Value provided to consuming components
  const value = {
    isAdmin, // This now reflects true login status
    token, // The actual token
    login,
    logout,
    isLoading, // To show loading indicators on forms
    error, // To show login errors
    // toggleAdmin, // We might remove or change how toggleAdmin is used
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
