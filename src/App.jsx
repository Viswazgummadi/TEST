import { useState, useEffect, useRef } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AdminProvider } from "./context/AdminContext";
import { navItems } from "./navigation.js";

import HomePage from "./pages/HomePage";
import ReposPage from "./pages/ReposPage";
import HistoryPage from "./pages/HistoryPage";
import AdminHistoryPage from "./pages/AdminHistoryPage";
import Sidebar from "./components/Sidebar";
import UniversalHeader from "./components/UniversalHeader";

// Custom hook to calculate navigation direction
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
  if (prevIndex > 0 && currentIndex > 0) {
    if (currentIndex > prevIndex) return 1; // Down
    if (currentIndex < prevIndex) return -1; // Up
  }
  return 0;
}

// Inner component to correctly use routing hooks
function AppRoutes() {
  const location = useLocation();
  const direction = useNavigationDirection();
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/repos" element={<ReposPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/admin/history" element={<AdminHistoryPage />} />
      </Routes>
    </AnimatePresence>
  );
}

// Main content component that can safely use location hooks
function AppContent() {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  return (
    <div className="flex min-h-screen bg-stone-950 text-gray-200">
      <AnimatePresence>
        {!isHomePage && <Sidebar key="sidebar" />}
      </AnimatePresence>
      <motion.div
        className="flex-1 flex flex-col"
        animate={{ paddingLeft: isHomePage ? "0rem" : "7rem" }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
      >
        <UniversalHeader />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <AppRoutes />
        </main>
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center py-4 text-gray-500 text-sm"
        >
          <p>© {new Date().getFullYear()} REPLOIT. All rights reserved.</p>
        </motion.footer>
      </motion.div>
    </div>
  );
}

// The top-level App component now only provides context.
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
