// src/App.jsx
import { useState, useEffect, useRef } from "react";
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

const API_BASE_URL = 'https://reploit-backend.onrender.com';

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

// ✅ Pass `setRepoFilter` and `dataSources` to ChatPage
function AppRoutes({ sourceFilter, repoFilter, dataSources, isLoadingSources, handleDeleteSource, onDataSourceAdded, setRepoFilter }) {
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
              setRepoFilter={setRepoFilter} // ✅ Pass setter
              dataSources={dataSources} // ✅ Pass data sources
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

  const fetchSources = async () => {
    setIsLoadingSources(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/data-sources`);
      if (!response.ok) throw new Error('Failed to fetch data sources');
      const sources = await response.json();
      setDataSources(sources);
      // Removed initial setting of repoFilter here, ChatPage will handle it from URL
      // if (sources.length > 0 && !repoFilter) {
      //   setRepoFilter(sources[0].id);
      // }
    } catch (error) {
      console.error("Error fetching data sources:", error);
      setDataSources([]);
    } finally {
      setIsLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleDeleteSource = async (sourceIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this source? This action cannot be undone.")) {
      return;
    }
    if (!token) {
      alert("Authentication error. Please log in again.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/data-sources/${sourceIdToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete source.');
      }
      setDataSources(prevSources => prevSources.filter(source => source.id !== sourceIdToDelete));
    } catch (error) {
      console.error("Error deleting source:", error);
      alert(`Deletion Failed: ${error.message}`);
    }
  };

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
              setRepoFilter={setRepoFilter} // ✅ Pass setRepoFilter down
            />
          </main>
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
      </MotionConfig>
    </AdminProvider>
  );
}

export default App;