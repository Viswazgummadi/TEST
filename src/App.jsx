import { useState, useEffect, useRef } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AdminProvider } from "./context/AdminContext";
import { navItems } from "./navigation.js";
import { mockRepos } from "./data/mockRepos.js";

import HomePage from "./pages/HomePage";
import ReposPage from "./pages/ReposPage";
import HistoryPage from "./pages/HistoryPage";
import ImplementationPage from "./pages/ImplementationPage";
import DeploymentPage from "./pages/DeploymentPage";
import ChatPage from "./pages/ChatPage";
import Sidebar from "./components/Sidebar";
import UniversalHeader from "./components/UniversalHeader";

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
  const [repoFilter, setRepoFilter] = useState(mockRepos[0]?.id || "");

  return (
    <div className="flex min-h-screen bg-gradient-to-tr from-purple-800 via-blue-900 to-slate-950 text-gray-200">
      <Sidebar />
      <div
        className="flex flex-1 flex-col h-screen"
        style={{ paddingLeft: "72px" }}
      >
        <UniversalHeader
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          repoFilter={repoFilter}
          onRepoChange={setRepoFilter}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex">
            <AppRoutes sourceFilter={sourceFilter} repoFilter={repoFilter} />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <MotionConfig>
        <AppContent />
      </MotionConfig>{" "}
      {/* <-- This was the line with the typo, now corrected. */}
    </AdminProvider>
  );
}

export default App;
