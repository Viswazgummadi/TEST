// src/pages/ReposPage.jsx

import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { motion } from "framer-motion";
import { useAdmin } from '../context/AdminContext';
import RepoList from "../components/RepoList";
import ConnectRepoModal from "../components/ConnectRepoModal";
import GoogleFilesModal from "../components/GoogleFilesModal";
import { FiGithub, FiPlus } from "react-icons/fi"; // FiPlus for the general "Connect" button
import { FaGoogleDrive } from "react-icons/fa";

const pageVariants = {
  initial: (direction) => ({ opacity: 0, y: direction * 50 }),
  animate: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: -50 }),
  transition: { type: "tween", ease: "circOut", duration: 0.5 },
};

// Assuming fetchApi is available (from ConnectRepoModal/GoogleFilesModal scope or central utils)
// If not, you may need to define it here or import it from a utility file
const fetchApi = async (url, options = {}) => {
  const { token } = options;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`http://localhost:5001${url}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return null;
  return response.json();
};

const ReposPage = ({ isAdminView, sourceFilter, dataSources, isLoading, onDeleteSource, onDataSourceAdded }) => {
  const { token } = useAdmin();
  const [filteredSources, setFilteredSources] = useState([]);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
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
      const response = await fetch('http://localhost:5001/api/connect/google/auth-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to get auth URL');
      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {
      alert(`Error starting Google connection: ${error.message}`);
    }
  };

  // ✅ NEW ADMIN ACTION HANDLERS
  const handleReindexSource = useCallback(async (sourceId) => {
    if (!token || !window.confirm("Are you sure you want to re-index this source? This will re-process all its content.")) return;
    try {
      // You'll need to create this backend endpoint later
      await fetchApi(`/api/data-sources/${sourceId}/reindex`, { method: 'POST', token });
      alert("Re-indexing initiated!");
      if (onDataSourceAdded) onDataSourceAdded(); // Refresh list to update status
    } catch (error) {
      alert(`Failed to re-index: ${error.message}`);
    }
  }, [token, onDataSourceAdded]);

  const handleSyncSource = useCallback(async (sourceId) => {
    if (!token || !window.confirm("Are you sure you want to sync changes for this source?")) return;
    try {
      // You'll need to create this backend endpoint later
      await fetchApi(`/api/data-sources/${sourceId}/sync`, { method: 'POST', token });
      alert("Sync initiated!");
      if (onDataSourceAdded) onDataSourceAdded(); // Refresh list to update status
    } catch (error) {
      alert(`Failed to sync: ${error.message}`);
    }
  }, [token, onDataSourceAdded]);

  const handleDeleteEmbeddings = useCallback(async (sourceId) => {
    if (!token || !window.confirm("Are you sure you want to delete embeddings for this source? This will remove all AI knowledge but keep the connection record.")) return;
    try {
      // You'll need to create this backend endpoint later
      await fetchApi(`/api/data-sources/${sourceId}/delete-embeddings`, { method: 'DELETE', token });
      alert("Embeddings deleted!");
      if (onDataSourceAdded) onDataSourceAdded(); // Refresh list to update status
    } catch (error) {
      alert(`Failed to delete embeddings: ${error.message}`);
    }
  }, [token, onDataSourceAdded]);


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
          onDeleteSource={onDeleteSource} // Delete entire record
          onReindexSource={handleReindexSource} // New
          onSyncSource={handleSyncSource}       // New
          onDeleteEmbeddings={handleDeleteEmbeddings} // New
        />
      </motion.div>

      <ConnectRepoModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        onConnectSuccess={handleConnectSuccess}
      />
      <GoogleFilesModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onConnectSuccess={handleConnectSuccess}
      />
    </>
  );
};

export default ReposPage;