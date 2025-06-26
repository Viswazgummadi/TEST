import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { FiFolder, FiX, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Import the new centralized fetchApi utility
import createFetchApi from "../utils/api";

// ✅ Receive apiBaseUrl as a prop
const GoogleFilesModal = ({ isOpen, onClose, onConnectSuccess, apiBaseUrl }) => {
    const { token } = useAdmin();
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectingFolderId, setConnectingFolderId] = useState(null);

    // ✅ Create fetchApi instance for this component's scope using the passed apiBaseUrl
    const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

    const fetchAvailableFolders = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            // ✅ Add trailing slash here
            const data = await fetchApi('/api/connect/google/available-files/', { token });
            setFolders(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, fetchApi]);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableFolders();
        }
    }, [isOpen, fetchAvailableFolders]);

    const handleConnect = async (folder) => {
        setConnectingFolderId(folder.id);
        try {
            const payload = {
                name: folder.name,
                source_type: 'google_drive',
                connection_details: {
                    file_id: folder.id,
                    name: folder.name,
                    webViewLink: folder.webViewLink,
                }
            };
            // ✅ Add trailing slash here
            await fetchApi('/api/data-sources/connect/', {
                method: 'POST',
                token,
                body: JSON.stringify(payload)
            });
            onConnectSuccess();
        } catch (err) {
            alert(`Failed to connect folder: ${err.message}`);
        } finally {
            setConnectingFolderId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl text-gray-200 p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                            <FiX size={20} />
                        </button>
                        <div className="flex items-center mb-6">
                            <FiFolder className="text-blue-400 mr-3" size={28} />
                            <h2 className="text-2xl font-semibold text-white">Connect Google Drive Folder</h2>
                        </div>
                        {isLoading && (
                            <div className="flex items-center justify-center p-8 text-lg">
                                <FiLoader className="animate-spin mr-3" size={24} /> Fetching folders...
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                                <p className="font-bold">Error: {error}</p>
                            </div>
                        )}
                        {!isLoading && !error && (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {folders.map(folder => (
                                    <div key={folder.id} className="bg-slate-900/70 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <a href={folder.webViewLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:underline">{folder.name}</a>
                                        </div>
                                        <button
                                            onClick={() => handleConnect(folder)}
                                            disabled={connectingFolderId === folder.id}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-60 flex items-center"
                                        >
                                            {connectingFolderId === folder.id ? <FiLoader className="animate-spin mr-2" /> : <FiFolder className="mr-2" />}
                                            {connectingFolderId === folder.id ? 'Connecting...' : 'Connect'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GoogleFilesModal;