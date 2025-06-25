// src/App.jsx
import { useState, useEffect, useRef } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AdminProvider } from "./context/AdminContext";
import { navItems } from "./navigation.js"; // navItems will be used by Sidebar
import { mockRepos } from "./data/mockRepos.js";

import HomePage from "./pages/HomePage";
import ReposPage from "./pages/ReposPage";
import HistoryPage from "./pages/HistoryPage";
import ImplementationPage from "./pages/ImplementationPage";
import DeploymentPage from "./pages/DeploymentPage";
import ChatPage from "./pages/ChatPage";
import Sidebar from "./components/Sidebar";
import UniversalHeader from "./components/UniversalHeader";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import AdminSettingsPage from "./pages/AdminSettingsPage"; // Import the new page (we'll create this next)

function useNavigationDirection() {
  // ... (no changes to this hook)
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    prevPathRef.current = pathname;
  }, [pathname]);
  const findIndex = (path) =>
    navItems.findIndex(
      (item) =>
        item.href === path ||
        (item.adminHref === path && path.startsWith("/admin"))
    ); // Adjusted for adminHref
  const prevIndex = findIndex(prevPathRef.current);
  const currentIndex = findIndex(pathname);
  if (prevIndex !== -1 && currentIndex !== -1 && prevIndex !== currentIndex) {
    if (currentIndex > prevIndex) return 1;
    if (currentIndex < prevIndex) return -1;
  }
  return 0;
}

function AppRoutes({ sourceFilter, repoFilter }) {
  const location = useLocation();
  const direction = useNavigationDirection();
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/implementation" element={<ImplementationPage />} />
        <Route path="/deployment" element={<DeploymentPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route
          path="/repos"
          element={<ReposPage sourceFilter={sourceFilter} />}
        />
        <Route
          path="/history"
          element={<HistoryPage selectedRepo={repoFilter} />}
        />
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          {" "}
          {/* Parent protected route */}
          {/* Add /admin/history if it's admin specific and different from /history */}
          {/* For now, assuming /history has its own selectedRepo logic */}
          {/* <Route path="history" element={<HistoryPage selectedRepo={repoFilter} isAdminView={true} />} /> */}
          <Route path="settings" element={<AdminSettingsPage />} />{" "}
          {/* New protected route */}
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  // ... (no changes to AppContent structure, but AppRoutes is updated)
  const [sourceFilter, setSourceFilter] = useState("all");
  const [repoFilter, setRepoFilter] = useState(mockRepos[0]?.id || "");
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-800 via-blue-900 to-slate-950 text-gray-200">
      <Sidebar />
      <div style={{ paddingLeft: "72px" }} className="flex-1">
        {" "}
        {/* Adjust padding if sidebar width changes */}
        {isChatPage ? (
          <div className="flex flex-col h-screen">
            <UniversalHeader
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              repoFilter={repoFilter}
              onRepoChange={setRepoFilter}
            />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
              <AppRoutes sourceFilter={sourceFilter} repoFilter={repoFilter} />
            </main>
          </div>
        ) : (
          <div className="h-screen overflow-y-auto">
            {" "}
            {/* Ensure this scroll works with sidebar width */}
            <UniversalHeader
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              repoFilter={repoFilter}
              onRepoChange={setRepoFilter}
            />
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AppRoutes sourceFilter={sourceFilter} repoFilter={repoFilter} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <MotionConfig>
        {" "}
        {/* Framer Motion global config if any */}
        <AppContent />
      </MotionConfig>
    </AdminProvider>
  );
}

export default App;
