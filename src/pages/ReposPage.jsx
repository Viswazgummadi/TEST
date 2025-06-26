// src/pages/ReposPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAdmin } from '../context/AdminContext';
import RepoList from "../components/RepoList";
import ConnectRepoModal from "../components/ConnectRepoModal";
import GoogleFilesModal from "../components/GoogleFilesModal";
import { FiGithub, FiPlus } from "react-icons/fi";
import { FaGoogleDrive } from "react-icons/fa";

// ✅ Import the new centralized fetchApi utility
import createFetchApi from "../utils/api";

const pageVariants = {
  initial: (direction) => ({ opacity: 0, y: direction * 50 }),
  animate: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: -50 }),
  transition: { type: "tween", ease: "circOut", duration: 0.5 },
};

// ✅ Receive apiBaseUrl as a prop
const ReposPage = ({ isAdminView, sourceFilter, dataSources, isLoading, onDeleteSource, onDataSourceAdded, apiBaseUrl }) => {
  const { token } = useAdmin();
  const [filteredSources, setFilteredSources] = useState([]);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // ✅ Create fetchApi instance for this component's scope using the passed apiBaseUrl
  const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    // This logic should also point to the deployed Vercel frontend URL once live
    if (queryParams.get('gauth') === 'success') {
      setIsGoogleModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!dataSources) return;
    if (sourceFilter === "all") {
      setFilteredSources(dataSources);
    } else {
      setFilteredSources(dataSources.filter(r => r.source_type === sourceFilter));
    }
  }, [sourceFilter, dataSources]);

  const handleConnectSuccess = () => {
    setIsGithubModalOpen(false);
    setIsGoogleModalOpen(false);
    if (onDataSourceAdded) {
      onDataSourceAdded();
    }
  };

  const handleGoogleConnectClick = async () => {
    try {
      // ✅ Add trailing slash here
      const data = await fetchApi('/api/connect/google/auth-url/', {
        token: token
      });
      window.location.href = data.authorization_url;
    } catch (error) {
      alert(`Error starting Google connection: ${error.message}`);
    }
  };

  const handleReindexSource = useCallback(async (sourceId) => {
    if (!token || !window.confirm("Are you sure you want to re-index this source? This will re-process all its content.")) return;
    try {
      // ✅ Add trailing slash here
      await fetchApi(`/api/data-sources/${sourceId}/reindex/`, { method: 'POST', token });
      alert("Re-indexing initiated!");
      if (onDataSourceAdded) onDataSourceAdded();
    } catch (error) {
      alert(`Failed to re-index: ${error.message}`);
    }
  }, [token, onDataSourceAdded, fetchApi]);

  const handleSyncSource = useCallback(async (sourceId) => {
    if (!token || !window.confirm("Are you sure you want to sync changes for this source?")) return;
    try {
      // ✅ Add trailing slash here
      await fetchApi(`/api/data-sources/${sourceId}/sync/`, { method: 'POST', token });
      alert("Sync initiated!");
      if (onDataSourceAdded) onDataSourceAdded();
    } catch (error) {
      alert(`Failed to sync: ${error.message}`);
    }
  }, [token, onDataSourceAdded, fetchApi]);

  const handleDeleteEmbeddings = useCallback(async (sourceId) => {
    if (!token || !window.confirm("Are you sure you want to delete embeddings for this source? This will remove all AI knowledge but keep the connection record.")) return;
    try {
      // ✅ Add trailing slash here
      await fetchApi(`/api/data-sources/${sourceId}/delete-embeddings/`, { method: 'DELETE', token });
      alert("Embeddings deleted!");
      if (onDataSourceAdded) onDataSourceAdded();
    } catch (error) {
      alert(`Failed to delete embeddings: ${error.message}`);
    }
  }, [token, onDataSourceAdded, fetchApi]);

  if (isLoading) {
    return <p className="text-center text-gray-400 mt-8">Loading Data Sources...</p>;
  }

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageVariants.transition}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-200">
            {isAdminView ? "Manage Data Sources" : "Available Data Sources"}
          </h1>
          {isAdminView && (
            <div className="flex space-x-4">
              <button
                onClick={() => setIsGithubModalOpen(true)}
                className="flex items-center px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors"
              >
                <FiGithub className="mr-2" /> Connect GitHub
              </button>
              <button
                onClick={handleGoogleConnectClick}
                className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                <FaGoogleDrive className="mr-2" /> Connect Google Drive
              </button>
            </div>
          )}
        </div>
        <RepoList
          sources={filteredSources}
          isAdmin={isAdminView}
          onDeleteSource={onDeleteSource}
          onReindexSource={handleReindexSource}
          onSyncSource={handleSyncSource}
          onDeleteEmbeddings={handleDeleteEmbeddings}
        />
      </motion.div>

      <ConnectRepoModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        onConnectSuccess={handleConnectSuccess}
        apiBaseUrl={apiBaseUrl}
      />
      <GoogleFilesModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onConnectSuccess={handleConnectSuccess}
        apiBaseUrl={apiBaseUrl}
      />
    </>
  );
};

export default ReposPage;