// src/App.jsx
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

const API_BASE_URL = 'http://localhost:5000'; // Or your Render URL

import createFetchApi from "./utils/api";

const LAST_SELECTED_REPO_KEY = "lastSelectedRepoId";

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
              apiBaseUrl={apiBaseUrl}
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
          <Route path="settings" element={<AdminSettingsPage apiBaseUrl={apiBaseUrl} />} />
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
  const [repoFilter, setRepoFilter] = useState(() => {
    const savedRepoId = localStorage.getItem(LAST_SELECTED_REPO_KEY);
    return savedRepoId || "";
  });
  const [dataSources, setDataSources] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  const fetchApi = useMemo(() => createFetchApi(API_BASE_URL), []);

  const fetchSources = useCallback(async () => {
    setIsLoadingSources(true);
    try {
      const sources = await fetchApi('/api/data-sources/', { token: token });
      setDataSources(sources);

      if (repoFilter && !sources.some(source => source.id === repoFilter)) {
        setRepoFilter("");
        localStorage.removeItem(LAST_SELECTED_REPO_KEY);
      }

    } catch (error) {
      console.error("Error fetching data sources:", error);
      setDataSources([]);
      setRepoFilter("");
      localStorage.removeItem(LAST_SELECTED_REPO_KEY);
    } finally {
      setIsLoadingSources(false);
    }
  }, [fetchApi, token, repoFilter]);

  useEffect(() => {
    if (token) {
      fetchSources();
    } else {
      setDataSources([]);
      setIsLoadingSources(false);
      setRepoFilter("");
      localStorage.removeItem(LAST_SELECTED_REPO_KEY);
    }
  }, [fetchSources, token]);

  useEffect(() => {
    if (repoFilter) {
      localStorage.setItem(LAST_SELECTED_REPO_KEY, repoFilter);
    } else {
      localStorage.removeItem(LAST_SELECTED_REPO_KEY);
    }
  }, [repoFilter]);


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
      // Instead of manually filtering, just trigger a refetch to get the latest state
      fetchSources();
      if (repoFilter === sourceIdToDelete) {
        setRepoFilter("");
      }
    } catch (error) {
      console.error("Error deleting source:", error);
      alert(`Deletion Failed: ${error.message}`);
    }
  }, [token, fetchApi, repoFilter, fetchSources]); // Add fetchSources to dependency array

  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  // --- NEW: Create a filtered list of repos for the chat selector ---
  const chatReadyRepos = useMemo(() => {
    return dataSources.filter(source => source.status === 'indexed' || source.status === 'outdated');
  }, [dataSources]);

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
            // MODIFIED: Pass the correct list of repos based on the page
            repos={location.pathname.startsWith('/admin') ? dataSources : chatReadyRepos}
          />
          <main className={isChatPage ? "flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-0" : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
            <AppRoutes
              sourceFilter={sourceFilter}
              repoFilter={repoFilter}
              // Pass down the correct list based on the context
              dataSources={location.pathname.startsWith('/admin') ? dataSources : chatReadyRepos}
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