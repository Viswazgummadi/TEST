// src/pages/AdminSettingsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context/AdminContext";
import { FiKey, FiCpu, FiPlus, FiTrash2, FiEye, FiEyeOff, FiSave } from "react-icons/fi";
// --- ADDED IMPORT FOR FRAMER MOTION ---
import { motion, AnimatePresence } from "framer-motion";

// --- Import ModelManagement component ---
import ModelManagement from "../components/ModelManagement"; // Correct path is src/components/ModelManagement.jsx

// fetchApi utility
const fetchApi = async (url, options = {}) => {
  const { token } = options;
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`http://localhost:5001${url}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") return null;
  return response.json();
};


const AdminSettingsPage = () => {
  const { token } = useAdmin();
  const [activeTab, setActiveTab] = useState("apiKeys");

  const [apiKeys, setApiKeys] = useState([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [editingKeyName, setEditingKeyName] = useState(null);

  const fetchKeys = useCallback(async () => {
    if (!token) return;
    setIsLoadingApiKeys(true);
    setApiKeyError(null);
    try {
      const data = await fetchApi("/api/admin/settings/apikeys", { token });
      setApiKeys(data || []);
    } catch (err) {
      setApiKeyError(err.message);
      setApiKeys([]);
    } finally {
      setIsLoadingApiKeys(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "apiKeys" && token) {
      fetchKeys();
    }
  }, [token, activeTab, fetchKeys]);

  const handleAddOrUpdateKey = async (e) => {
    e.preventDefault();
    if (!token || !newServiceName.trim() || !newKeyValue.trim()) {
      setApiKeyError("Service Name and Key Value are required.");
      return;
    }
    setIsLoadingApiKeys(true);
    setApiKeyError(null);
    try {
      await fetchApi("/api/admin/settings/apikeys", {
        method: "POST", token,
        body: JSON.stringify({ service_name: newServiceName.trim(), key_value: newKeyValue.trim() }),
      });
      setNewServiceName(""); setNewKeyValue(""); setShowKeyValue(false); setEditingKeyName(null);
      fetchKeys();
    } catch (err) {
      setApiKeyError(err.message);
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  const handleDeleteKey = async (serviceName) => {
    if (!token || !window.confirm(`Are you sure you want to delete API key "${serviceName}"?`)) return;
    setIsLoadingApiKeys(true);
    setApiKeyError(null);
    try {
      const encodedServiceName = encodeURIComponent(serviceName);
      await fetchApi(`/api/admin/settings/apikeys/${encodedServiceName}`, { method: "DELETE", token });
      fetchKeys();
    } catch (err) {
      setApiKeyError(err.message);
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  const startEditKey = (key) => {
    setEditingKeyName(key.service_name);
    setNewServiceName(key.service_name);
    setNewKeyValue("");
    setShowKeyValue(false);
    setApiKeyError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TabButton = ({ tabName, currentTab, setTab, children, icon: Icon }) => (
    <button
      onClick={() => setTab(tabName)}
      className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors duration-150 focus:outline-none
                  ${currentTab === tabName
          ? 'bg-slate-700/80 text-indigo-300 border-b-2 border-indigo-400'
          : 'text-gray-400 hover:text-gray-100 hover:bg-slate-800/50 border-b-2 border-transparent hover:border-slate-600'}`}
    >
      {Icon && <Icon className="mr-2 h-5 w-5" />}
      {children}
    </button>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 text-gray-200 min-h-screen">
      <h1 className="text-3xl font-semibold mb-8 text-center text-white">
        Admin Settings
      </h1>

      <div className="mb-8 flex border-b border-slate-700 justify-center space-x-1 md:space-x-2">
        <TabButton tabName="apiKeys" currentTab={activeTab} setTab={setActiveTab} icon={FiKey}>
          API Keys
        </TabButton>
        <TabButton tabName="models" currentTab={activeTab} setTab={setActiveTab} icon={FiCpu}>
          Model Configurations
        </TabButton>
      </div>

      {/* Ensure AnimatePresence is imported from framer-motion */}
      <AnimatePresence mode="wait">
        {activeTab === "apiKeys" && (
          <motion.div
            key="apiKeysTab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-medium mb-6 text-center text-indigo-400">API Key Management</h2>
            <form onSubmit={handleAddOrUpdateKey} className="mb-10 p-6 bg-slate-800/70 backdrop-blur-md rounded-xl shadow-2xl space-y-4 max-w-2xl mx-auto">
              <h3 className="text-xl font-medium mb-1 text-white">{editingKeyName ? `Update Key: ${editingKeyName}` : "Add New API Key"}</h3>
              <div><label htmlFor="serviceName" className="block text-sm font-medium text-gray-300">Service Name</label><input type="text" id="serviceName" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="e.g., GEMINI_API_KEY" required disabled={!!editingKeyName} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-60" /> {editingKeyName && <p className="text-xs text-gray-400 mt-1">To change name, delete and re-add.</p>}</div>
              <div><label htmlFor="keyValue" className="block text-sm font-medium text-gray-300">API Key Value</label><div className="mt-1 relative rounded-md shadow-sm"><input type={showKeyValue ? "text" : "password"} id="keyValue" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} placeholder={editingKeyName ? "Enter new key value to update" : "Enter API Key"} required className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10" /><div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button type="button" onClick={() => setShowKeyValue(!showKeyValue)} className="text-gray-400 hover:text-gray-200">{showKeyValue ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button></div></div></div>
              {apiKeyError && <p className="text-sm text-red-400 py-1">{apiKeyError}</p>}
              <div className="flex justify-end space-x-3 pt-2">{editingKeyName && (<button type="button" onClick={() => { setEditingKeyName(null); setNewServiceName(""); setNewKeyValue(""); setApiKeyError(null); }} className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-gray-300 hover:bg-slate-700 focus:outline-none">Cancel Edit</button>)}<button type="submit" disabled={isLoadingApiKeys} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-50 flex items-center">{isLoadingApiKeys ? ("Saving...") : editingKeyName ? (<FiSave className="mr-2" />) : (<FiPlus className="mr-2" />)}{editingKeyName ? "Update Key" : "Add Key"}</button></div>
            </form>
            <div>
              {isLoadingApiKeys && apiKeys.length === 0 && <p className="text-center">Loading keys...</p>}
              {!isLoadingApiKeys && apiKeyError && apiKeys.length === 0 && <p className="text-center text-red-400">Error: {apiKeyError}</p>}
              {!isLoadingApiKeys && apiKeys.length === 0 && !apiKeyError && (<p className="text-center text-gray-400">No API keys configured yet.</p>)}
              {apiKeys.length > 0 && (<ul className="space-y-3 max-w-3xl mx-auto">{apiKeys.map((key) => (<li key={key.service_name} className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-between"><div className="flex-grow min-w-0"><div className="flex items-center"><FiKey className="mr-3 text-indigo-400 flex-shrink-0" size={18} /><span className="font-medium text-gray-100 truncate" title={key.service_name}>{key.service_name}</span></div><p className="text-xs text-gray-400 mt-1">Last updated: {new Date(key.updated_at).toLocaleString()}</p></div><div className="space-x-2 flex-shrink-0 ml-4"><button onClick={() => startEditKey(key)} className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors" title="Edit (Re-enter key value)"><FiSave size={18} /></button><button onClick={() => handleDeleteKey(key.service_name)} disabled={isLoadingApiKeys} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50" title="Delete Key"><FiTrash2 size={18} /></button></div></li>))}</ul>)}
            </div>
          </motion.div>
        )}

        {activeTab === "models" && (
          <motion.div
            key="modelsTab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ModelManagement />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettingsPage;