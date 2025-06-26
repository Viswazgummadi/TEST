// src/App.jsx
// ✅ CORRECTED IMPORT: Ensure useCallback is included here
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { navItems } from "./navigation.js";

import HomePage from "./pages/HomePage";
import ReposPage from "./pages/ReposPage";
import HistoryPage from "./pages/HistoryPage";
import ImplementationPage from "./pages/ImplementationPage";
import DeploymentPage from "./pages/DeploymentPage";
import ChatPage from "./pages/ChatPage";
import Sidebar from "./components/Sidebar";
import UniversalHeader from "./components/UniversalHeader";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminSettingsPage from "./pages/AdminSettingsPage";

// ✅ CRUCIAL: REPLACE THIS WITH YOUR ACTUAL RENDER BACKEND URL
const API_BASE_URL = 'https://reploit-backend.onrender.com'; // <<< YOUR RENDER BACKEND URL HERE!

// ✅ Import the new centralized fetchApi utility
import createFetchApi from "./utils/api";

function useNavigationDirection() {
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
    );
  const prevIndex = findIndex(prevPathRef.current);
  const currentIndex = findIndex(pathname);
  if (prevIndex !== -1 && currentIndex !== -1 && prevIndex !== currentIndex) {
    if (currentIndex > prevIndex) return 1;
    if (currentIndex < prevIndex) return -1;
  }
  return 0;
}

function AppRoutes({ sourceFilter, repoFilter, dataSources, isLoadingSources, handleDeleteSource, onDataSourceAdded, setRepoFilter, apiBaseUrl }) {
  const location = useLocation();
  const direction = useNavigationDirection();
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/implementation" element={<ImplementationPage />} />
        <Route path="/deployment" element={<DeploymentPage />} />
        <Route
          path="/chat"
          element={
            <ChatPage
              selectedRepo={repoFilter}
              setRepoFilter={setRepoFilter}
              dataSources={dataSources}
            />
          }
        />

        <Route
          path="/history"
          element={<HistoryPage selectedRepo={repoFilter} isAdminView={false} />}
        />

        <Route
          path="/repos"
          element={
            <ReposPage
              isAdminView={false}
              sourceFilter={sourceFilter}
              dataSources={dataSources}
              isLoading={isLoadingSources}
              onDeleteSource={() => { }}
              onDataSourceAdded={() => { }}
              apiBaseUrl={apiBaseUrl}
            />
          }
        />

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route
            path="repos"
            element={
              <ReposPage
                isAdminView={true}
                sourceFilter={sourceFilter}
                dataSources={dataSources}
                isLoading={isLoadingSources}
                onDeleteSource={handleDeleteSource}
                onDataSourceAdded={onDataSourceAdded}
                apiBaseUrl={apiBaseUrl}
              />
            }
          />
          <Route
            path="history"
            element={
              <HistoryPage selectedRepo={repoFilter} isAdminView={true} />
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { token } = useAdmin();

  const [sourceFilter, setSourceFilter] = useState("all");
  const [dataSources, setDataSources] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [repoFilter, setRepoFilter] = useState("");

  const fetchApi = useMemo(() => createFetchApi(API_BASE_URL), []);

  const fetchSources = useCallback(async () => { // This is line 125, which uses useCallback
    setIsLoadingSources(true);
    try {
      const sources = await fetchApi('/api/data-sources');
      setDataSources(sources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      setDataSources([]);
    } finally {
      setIsLoadingSources(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleDeleteSource = useCallback(async (sourceIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this source? This action cannot be undone.")) {
      return;
    }
    if (!token) {
      alert("Authentication error. Please log in again.");
      return;
    }
    try {
      await fetchApi(`/api/data-sources/${sourceIdToDelete}`, {
        method: 'DELETE',
        token: token
      });
      setDataSources(prevSources => prevSources.filter(source => source.id !== sourceIdToDelete));
    } catch (error) {
      console.error("Error deleting source:", error);
      alert(`Deletion Failed: ${error.message}`);
    }
  }, [token, fetchApi]);

  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-800 via-blue-900 to-slate-950 text-gray-200">
      <Sidebar />
      <div style={{ paddingLeft: "72px" }} className="flex-1">
        <div className={isChatPage ? "flex flex-col h-screen" : "h-screen overflow-y-auto"}>
          <UniversalHeader
            sourceFilter={sourceFilter}
            onSourceChange={setSourceFilter}
            repoFilter={repoFilter}
            onRepoChange={setRepoFilter}
            repos={dataSources}
          />
          <main className={isChatPage ? "flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-0" : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
            <AppRoutes
              sourceFilter={sourceFilter}
              repoFilter={repoFilter}
              dataSources={dataSources}
              isLoadingSources={isLoadingSources}
              handleDeleteSource={handleDeleteSource}
              onDataSourceAdded={fetchSources}
              setRepoFilter={setRepoFilter}
              apiBaseUrl={API_BASE_URL}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AdminProvider apiBaseUrl={API_BASE_URL}>
      <MotionConfig>
        <AppContent />
      </MotionConfig>
    </AdminProvider>
  );
}

export default App;