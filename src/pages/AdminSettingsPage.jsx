// src/pages/AdminSettingsPage.jsx
import React, { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext"; // To get the token for API calls
import {
  FiPlus,
  FiTrash2,
  FiKey,
  FiEye,
  FiEyeOff,
  FiSave,
} from "react-icons/fi"; // Icons

// This would ideally be in an api.js or services.js file
const fetchApi = async (url, options = {}) => {
  const { token } = options; // Extract token if provided for protected routes
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:5001${url}`, {
    // Assuming backend is on port 5001
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An unknown error occurred" }));
    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`
    );
  }
  // For DELETE or other methods that might not return JSON
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null;
  }
  return response.json();
};

const AdminSettingsPage = () => {
  const { token } = useAdmin(); // For authenticating API calls
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newServiceName, setNewServiceName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [editingKey, setEditingKey] = useState(null); // To store service_name of key being edited

  const fetchKeys = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchApi("/api/admin/settings/apikeys", { token });
      setApiKeys(data || []);
    } catch (err) {
      setError(err.message);
      setApiKeys([]); // Clear keys on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [token]); // Re-fetch if token changes (e.g., after login)

  const handleAddOrUpdateKey = async (e) => {
    e.preventDefault();
    if (!token || !newServiceName.trim() || !newKeyValue.trim()) {
      setError("Service Name and Key Value are required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await fetchApi("/api/admin/settings/apikeys", {
        method: "POST",
        token,
        body: JSON.stringify({
          service_name: newServiceName.trim(),
          key_value: newKeyValue.trim(),
        }),
      });
      setNewServiceName("");
      setNewKeyValue("");
      setShowKeyValue(false);
      setEditingKey(null);
      fetchKeys(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (serviceName) => {
    if (
      !token ||
      !window.confirm(
        `Are you sure you want to delete the API key for "${serviceName}"?`
      )
    ) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Service names with '/' or other special chars need to be URL encoded for the path
      const encodedServiceName = encodeURIComponent(serviceName);
      await fetchApi(`/api/admin/settings/apikeys/${encodedServiceName}`, {
        method: "DELETE",
        token,
      });
      fetchKeys(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (key) => {
    setEditingKey(key.service_name);
    setNewServiceName(key.service_name);
    setNewKeyValue(""); // Clear key value for security, admin must re-enter to update
    setShowKeyValue(false); // Hide it by default
    setError(null);
    // Optionally, scroll to the form or highlight it
  };

  return (
    <div className="container mx-auto p-4 md:p-8 text-gray-200">
      <h1 className="text-3xl font-semibold mb-8 text-center">
        Admin API Key Management
      </h1>

      {/* Form to Add/Update API Key */}
      <form
        onSubmit={handleAddOrUpdateKey}
        className="mb-12 p-6 bg-slate-800/70 backdrop-blur-md rounded-xl shadow-2xl space-y-4 max-w-2xl mx-auto"
      >
        <h2 className="text-xl font-medium mb-4 text-indigo-400">
          {editingKey ? `Update Key: ${editingKey}` : "Add New API Key"}
        </h2>
        <div>
          <label
            htmlFor="serviceName"
            className="block text-sm font-medium text-gray-300"
          >
            Service Name
          </label>
          <input
            type="text"
            id="serviceName"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            placeholder="e.g., OPENAI_API_KEY or MyService/Prod"
            required
            disabled={!!editingKey} // Disable editing service name if updating
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-60"
          />
          {editingKey && (
            <p className="text-xs text-gray-400 mt-1">
              To change service name, delete and re-add.
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="keyValue"
            className="block text-sm font-medium text-gray-300"
          >
            API Key Value
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type={showKeyValue ? "text" : "password"}
              id="keyValue"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              placeholder={
                editingKey ? "Enter new key value to update" : "Enter API Key"
              }
              required
              className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => setShowKeyValue(!showKeyValue)}
                className="text-gray-400 hover:text-gray-200"
              >
                {showKeyValue ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-400 py-2">{error}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          {editingKey && (
            <button
              type="button"
              onClick={() => {
                setEditingKey(null);
                setNewServiceName("");
                setNewKeyValue("");
                setError(null);
              }}
              className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-gray-300 hover:bg-slate-700 focus:outline-none"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              "Saving..."
            ) : editingKey ? (
              <FiSave className="mr-2" />
            ) : (
              <FiPlus className="mr-2" />
            )}
            {editingKey ? "Update Key" : "Add Key"}
          </button>
        </div>
      </form>

      {/* List of API Keys */}
      <div>
        <h2 className="text-2xl font-medium mb-6 text-center">
          Configured API Keys
        </h2>
        {isLoading && apiKeys.length === 0 && (
          <p className="text-center">Loading keys...</p>
        )}
        {!isLoading && error && apiKeys.length === 0 && (
          <p className="text-center text-red-400">
            Error loading keys: {error}
          </p>
        )}
        {!isLoading && apiKeys.length === 0 && !error && (
          <p className="text-center text-gray-400">
            No API keys configured yet.
          </p>
        )}

        {apiKeys.length > 0 && (
          <ul className="space-y-3 max-w-3xl mx-auto">
            {apiKeys.map((key) => (
              <li
                key={key.service_name}
                className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center">
                    <FiKey className="mr-3 text-indigo-400" size={18} />
                    <span className="font-medium text-gray-100">
                      {key.service_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: {new Date(key.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="space-x-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(key)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors"
                    title="Edit (Re-enter key value)"
                  >
                    <FiSave size={18} /> {/* Using Save icon for Edit action */}
                  </button>
                  <button
                    onClick={() => handleDeleteKey(key.service_name)}
                    disabled={isLoading}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                    title="Delete Key"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
