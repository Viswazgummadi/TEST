// src/App.jsx

import { useState, useEffect, useRef } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AdminProvider } from "./context/AdminContext";
import { navItems } from "./navigation.js";

import HomePage from "./pages/HomePage";
import ReposPage from "./pages/ReposPage";
import HistoryPage from "./pages/HistoryPage";
import ImplementationPage from "./pages/ImplementationPage";
import DeploymentPage from "./pages/DeploymentPage";
import ChatPage from "./pages/ChatPage";
import Sidebar from "./components/Sidebar";
import UniversalHeader from "./components/UniversalHeader";

// --- THIS IS THE ONE AND ONLY DECLARATION ---
function useNavigationDirection() {
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    prevPathRef.current = pathname;
  }, [pathname]);
  const findIndex = (path) =>
    navItems.findIndex((item) => item.href === path || item.adminHref === path);
  const prevIndex = findIndex(prevPathRef.current);
  const currentIndex = findIndex(pathname);
  if (prevIndex !== -1 && currentIndex !== -1 && prevIndex !== currentIndex) {
    if (currentIndex > prevIndex) return 1; // Down
    if (currentIndex < prevIndex) return -1; // Up
  }
  return 0; // Default to fade
}
// ---------------------------------------------

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
        <Route
          path="/admin/history"
          element={<HistoryPage selectedRepo={repoFilter} />}
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [repoFilter, setRepoFilter] = useState("all");

  return (
    <div className="flex min-h-screen bg-stone-950 text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ paddingLeft: "72px" }}>
        <UniversalHeader
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          repoFilter={repoFilter}
          onRepoChange={setRepoFilter}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppRoutes sourceFilter={sourceFilter} repoFilter={repoFilter} />
        </main>
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center py-4 text-gray-500 text-sm"
        >
          <p>© {new Date().getFullYear()} REPLOIT. All rights reserved.</p>
        </motion.footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <MotionConfig>
        <AppContent />
      </MotionConfig>
    </AdminProvider>
  );
}

export default App;
