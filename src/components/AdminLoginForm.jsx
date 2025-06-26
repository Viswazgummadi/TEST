// src/components/AdminLoginForm.jsx
import { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ Import useNavigate and useLocation
import { navItems } from "../navigation.js"; // ✅ Import navItems

const AdminLoginForm = ({ onSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAdmin();
  const navigate = useNavigate(); // ✅ Initialize navigate
  const location = useLocation(); // ✅ Initialize location

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success && onSuccess) {
      onSuccess(); // Callback for successful login, e.g., to close a modal

      // ✅ NEW: Post-login redirection logic
      const currentPath = location.pathname;
      const navItem = navItems.find(item => item.href === currentPath);

      // If the user was on a public page that has an admin equivalent, redirect them.
      // Example: If on /repos (public), and it has an adminHref like /admin/repos, go there.
      if (navItem && navItem.adminHref) {
        navigate(navItem.adminHref, { replace: true });
      } else if (!currentPath.startsWith("/admin")) {
        // If they were on a non-admin page without a direct adminHref
        // (like /home, /chat, etc.), redirect to a default admin page if desired,
        // or just let them stay. For now, let's redirect to /admin/repos if applicable.
        const reposNavItem = navItems.find(item => item.text === "Repos"); // Find the repos item
        if (reposNavItem && reposNavItem.adminHref) {
          navigate(reposNavItem.adminHref, { replace: true });
        } else {
          // Fallback: If no specific adminHref, maybe redirect to settings or just stay
          navigate('/admin/settings', { replace: true }); // Default to admin settings
        }
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-slate-800 rounded-lg shadow-xl"
    >
      <h2 className="text-xl font-semibold text-center text-gray-200 mb-6">
        Admin Login
      </h2>
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-300"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="admin_username"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="************"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>
    </form>
  );
};

export default AdminLoginForm;