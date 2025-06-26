import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { FiGithub, FiX, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Import the new centralized fetchApi utility
import createFetchApi from "../utils/api";

// ✅ Receive apiBaseUrl as a prop
const ConnectRepoModal = ({ isOpen, onClose, onConnectSuccess, apiBaseUrl }) => {
    const { token } = useAdmin();
    const [repos, setRepos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectingRepo, setConnectingRepo] = useState(null);

    // ✅ Create fetchApi instance for this component's scope using the passed apiBaseUrl
    const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

    const fetchAvailableRepos = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            // ✅ Add trailing slash here
            const data = await fetchApi('/api/connect/github/available-repos/', { token });
            setRepos(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, fetchApi]);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableRepos();
        }
    }, [isOpen, fetchAvailableRepos]);

    const handleConnect = async (repo) => {
        setConnectingRepo(repo.full_name);
        try {
            const payload = {
                name: repo.name,
                source_type: 'github',
                connection_details: {
                    repo_full_name: repo.full_name,
                    html_url: repo.html_url,
                    is_private: repo.private,
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
            alert(`Failed to connect repository: ${err.message}`);
        } finally {
            setConnectingRepo(null);
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
                            <FiGithub className="text-indigo-400 mr-3" size={28} />
                            <h2 className="text-2xl font-semibold text-white">Connect GitHub Repository</h2>
                        </div>

                        {isLoading && (
                            <div className="flex items-center justify-center p-8 text-lg">
                                <FiLoader className="animate-spin mr-3" size={24} /> Fetching repositories...
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center">
                                <FiAlertCircle className="mr-3" size={20} />
                                <div>
                                    <p className="font-bold">Error fetching repositories:</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}
                        {!isLoading && !error && (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {repos.map(repo => (
                                    <div key={repo.full_name} className="bg-slate-900/70 p-4 rounded-lg flex items-center justify-between transition-all hover:bg-slate-800 border border-slate-700">
                                        <div>
                                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:underline">{repo.full_name}</a>
                                            <p className="text-sm text-gray-400 mt-1 truncate">{repo.description || "No description"}</p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            {repo.is_connected ? (
                                                <span className="flex items-center px-4 py-2 text-sm font-medium text-green-400 bg-green-900/50 rounded-md">
                                                    <FiCheckCircle className="mr-2" /> Connected
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(repo)}
                                                    disabled={connectingRepo === repo.full_name}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
                                                >
                                                    {connectingRepo === repo.full_name ? <FiLoader className="animate-spin mr-2" /> : <FiGithub className="mr-2" />}
                                                    {connectingRepo === repo.full_name ? 'Connecting...' : 'Connect'}
                                                </button>
                                            )}
                                        </div>
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

export default ConnectRepoModal;