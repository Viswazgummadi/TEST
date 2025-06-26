import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { FiPlusCircle, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiRefreshCw } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import createFetchApi from '../utils/api';

const ModelForm = ({ existingModel, onSave, onCancel, availableApiKeys, modelSuggestions, isLoading }) => {
    const [formData, setFormData] = useState({
        model_id_string: '',
        display_name: '',
        provider: '',
        api_key_name_ref: '',
        is_active: true,
        notes: '',
    });
    const [selectedSuggestionId, setSelectedSuggestionId] = useState('');

    useEffect(() => {
        if (existingModel) {
            setFormData({
                model_id_string: existingModel.model_id_string || '',
                display_name: existingModel.display_name || '',
                provider: existingModel.provider || '',
                api_key_name_ref: existingModel.api_key_name_ref || '',
                is_active: existingModel.is_active !== undefined ? existingModel.is_active : true,
                notes: existingModel.notes || '',
            });
            setSelectedSuggestionId('');
        } else {
            setFormData({ model_id_string: '', display_name: '', provider: '', api_key_name_ref: '', is_active: true, notes: '' });
            setSelectedSuggestionId('');
        }
    }, [existingModel]);

    const handleSuggestionChange = (event) => {
        const suggestionId = event.target.value;
        setSelectedSuggestionId(suggestionId);
        const selected = modelSuggestions.find(s => s.id === suggestionId);

        if (selected) {
            setFormData(prev => ({
                ...prev,
                model_id_string: selected.id,
                display_name: selected.name,
                provider: selected.provider,
                notes: selected.notes || prev.notes || '',
                api_key_name_ref: availableApiKeys.find(key => key.service_name === selected.default_api_key_placeholder)?.service_name || prev.api_key_name_ref || '',
                is_active: true,
            }));
        } else {
            setFormData({ model_id_string: '', display_name: '', provider: '', api_key_name_ref: '', is_active: true, notes: '' });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, existingModel?.id);
    };

    const inputClass = "mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400";
    const labelClass = "block text-sm font-medium text-gray-300";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 mb-8"
        >
            <h3 className="text-xl font-semibold text-white mb-6">
                {existingModel ? 'Edit Model Configuration' : 'Add New Model Configuration'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!existingModel && modelSuggestions && modelSuggestions.length > 0 && (
                    <div>
                        <label htmlFor="modelSuggestion" className={labelClass}>Quick Add from Suggestion:</label>
                        <select id="modelSuggestion" value={selectedSuggestionId} onChange={handleSuggestionChange} className={inputClass}>
                            <option value="">-- Select a known model --</option>
                            {modelSuggestions.map(sugg => (
                                <option key={sugg.id + sugg.provider} value={sugg.id}>
                                    {sugg.name} ({sugg.provider})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div><label htmlFor="model_id_string" className={labelClass}>Model ID (Provider Specific)</label><input type="text" name="model_id_string" id="model_id_string" value={formData.model_id_string} onChange={handleChange} required className={inputClass} /></div>
                <div><label htmlFor="display_name" className={labelClass}>Display Name</label><input type="text" name="display_name" id="display_name" value={formData.display_name} onChange={handleChange} required className={inputClass} /></div>
                <div><label htmlFor="provider" className={labelClass}>Provider</label><input type="text" name="provider" id="provider" value={formData.provider} onChange={handleChange} required placeholder="e.g., Google, OpenAI" className={inputClass} /></div>
                <div><label htmlFor="api_key_name_ref" className={labelClass}>Use API Key Configuration</label><select name="api_key_name_ref" id="api_key_name_ref" value={formData.api_key_name_ref} onChange={handleChange} required className={inputClass}><option value="">-- Select API Key --</option>{availableApiKeys.map(key => (<option key={key.service_name} value={key.service_name}>{key.service_name}</option>))}</select></div>
                <div className="flex items-center"><button type="button" onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))} className="mr-2 p-1 rounded-full">{formData.is_active ? <FiToggleRight size={28} className="text-green-400" /> : <FiToggleLeft size={28} className="text-gray-500" />}</button><label htmlFor="is_active" className={labelClass} onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}>Active</label></div>
                <div><label htmlFor="notes" className={labelClass}>Notes (Optional)</label><textarea name="notes" id="notes" rows="3" value={formData.notes} onChange={handleChange} className={inputClass}></textarea></div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-600 hover:bg-slate-500 rounded-md">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">{isLoading ? 'Saving...' : (existingModel ? 'Update Model' : 'Add Model')}</button>
                </div>
            </form>
        </motion.div>
    );
};

const ModelManagement = ({ apiBaseUrl }) => {
    const { token: adminToken } = useAdmin();
    const [configuredModels, setConfiguredModels] = useState([]);
    const [modelSuggestions, setModelSuggestions] = useState([]);
    const [availableApiKeys, setAvailableApiKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingModel, setEditingModel] = useState(null);

    const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

    const fetchAllData = useCallback(async () => {
        if (!adminToken) return;
        setIsLoading(true);
        setError(null);
        try {
            const [modelsData, suggestionsData, apiKeysData] = await Promise.all([
                fetchApi('/api/admin/configured-models/', { token: adminToken }),
                fetchApi('/api/admin/model-suggestions/', { token: adminToken }),
                fetchApi('/api/admin/settings/apikeys/', { token: adminToken })
            ]);
            setConfiguredModels(modelsData || []);
            setModelSuggestions(suggestionsData || []);
            setAvailableApiKeys(apiKeysData || []);
        } catch (err) {
            setError(err.message);
            setConfiguredModels([]);
            setModelSuggestions([]);
            setAvailableApiKeys([]);
        } finally {
            setIsLoading(false);
        }
    }, [adminToken, fetchApi]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleAddNew = () => { setEditingModel(null); setShowForm(true); };
    const handleEdit = (model) => { setEditingModel(model); setShowForm(true); };
    const handleCancelForm = () => { setShowForm(false); setEditingModel(null); setError(null); };

    const handleSaveModel = async (formData, modelIdToUpdate) => {
        if (!adminToken) {
            setError("Admin token not available. Please log in again.");
            return;
        }
        setIsLoading(true);
        setError(null);

        const isEditing = !!modelIdToUpdate;
        const url = isEditing ? `/api/admin/configured-models/${modelIdToUpdate}` : '/api/admin/configured-models/';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await fetchApi(url, { method, body: JSON.stringify(formData), token: adminToken });
            setShowForm(false);
            setEditingModel(null);
            await fetchAllData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteModel = async (modelId) => {
        if (!adminToken || !window.confirm("Delete this model configuration?")) return;
        setIsLoading(true);
        setError(null);
        try {
            await fetchApi(`/api/admin/configured-models/${modelId}`, { method: 'DELETE', token: adminToken });
            await fetchAllData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (model) => {
        if (!adminToken) return;
        const payload = { ...model, is_active: !model.is_active };
        delete payload.id;
        delete payload.created_at;
        delete payload.updated_at;

        setIsLoading(true);
        setError(null);
        try {
            await fetchApi(`/api/admin/configured-models/${model.id}`, { method: 'PUT', body: JSON.stringify(payload), token: adminToken });
            await fetchAllData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!adminToken && !isLoading) return <p className="text-red-400 text-center py-4">Admin token not found. Please log in.</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium text-indigo-400">Model Configurations</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={fetchAllData} disabled={isLoading}
                        className="p-2 text-gray-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full transition-colors disabled:opacity-50" title="Refresh">
                        <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow text-sm font-medium">
                        <FiPlusCircle className="mr-2" /> Add New Model
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <ModelForm
                        key={editingModel ? `edit-${editingModel.id}` : 'add-new'}
                        existingModel={editingModel}
                        onSave={handleSaveModel}
                        onCancel={handleCancelForm}
                        availableApiKeys={availableApiKeys}
                        modelSuggestions={modelSuggestions}
                        isLoading={isLoading}
                    />
                )}
            </AnimatePresence>

            {error && !showForm && <p className="my-4 text-center text-red-400 bg-red-900/30 p-3 rounded-md">{error}</p>}

            {!showForm && isLoading && configuredModels.length === 0 && <p className="text-gray-400 text-center py-8">Loading models...</p>}
            {!showForm && !isLoading && configuredModels.length === 0 && !error && (
                <p className="text-gray-400 text-center py-8">No models configured. Click "Add New Model".</p>
            )}

            {!showForm && configuredModels.length > 0 && (
                <div className="overflow-x-auto bg-slate-900/70 rounded-lg shadow border border-slate-700">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Display Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Model ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">API Key Ref</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                            {configuredModels.map((model) => (
                                <tr key={model.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{model.display_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono text-xs">{model.model_id_string}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{model.provider}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{model.api_key_name_ref}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button onClick={() => handleToggleActive(model)} className={`mr-2 p-1 rounded-full ${isLoading && 'opacity-50 cursor-not-allowed'}`} disabled={isLoading}>
                                            {model.is_active ? <FiToggleRight size={24} className="text-green-400" /> : <FiToggleLeft size={24} className="text-gray-500" />}
                                        </button>
                                        <span className={model.is_active ? "text-green-400" : "text-gray-500"}>{model.is_active ? 'Active' : 'Inactive'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(model)} className="text-indigo-400 hover:text-indigo-300" title="Edit"><FiEdit size={18} /></button>
                                        <button onClick={() => handleDeleteModel(model.id)} className="text-red-400 hover:text-red-300" title="Delete"><FiTrash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ModelManagement;