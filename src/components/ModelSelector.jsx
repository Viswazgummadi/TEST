// src/components/ModelSelector.jsx
import React, { useState, useEffect, useRef,UseMemo } from "react";
import { FiChevronDown, FiCpu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../context/AdminContext";
import createFetchApi from '../utils/api'; // ✅ Import the centralized utility

const ModelSelector = ({
  selectedModelId,
  onModelChange,
  initialDefaultModelId = "gemini-1.5-flash",
  apiBaseUrl
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const { isAdmin } = useAdmin();
  const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

  useEffect(() => {
    const getModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // ✅ Use the new fetchApi instance
        const fetchedModels = await fetchApi("/api/chat/available-models/"); // Added trailing slash for consistency
        setModels(fetchedModels || []);
        if (fetchedModels && fetchedModels.length > 0) {
          const currentSelectionIsValid = fetchedModels.some(m => m.id === selectedModelId);
          if (!selectedModelId || !currentSelectionIsValid) {
            const defaultModel = fetchedModels.find(m => m.id === initialDefaultModelId) || fetchedModels[0];
            if (defaultModel) onModelChange(defaultModel.id);
            else onModelChange(null);
          }
        } else if (fetchedModels && fetchedModels.length === 0) {
          onModelChange(null);
        }
      } catch (err) {
        setError(err.message);
        setModels([]);
        onModelChange(null);
      } finally {
        setIsLoading(false);
      }
    };
    getModels();
  }, [apiBaseUrl, initialDefaultModelId, onModelChange, selectedModelId, fetchApi]); // ✅ Add fetchApi to dependencies
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedModel = models.find((model) => model.id === selectedModelId);

  let CurrentIcon = FiCpu;
  const displayModelName = selectedModel
    ? selectedModel.name
    : "Select Model...";
  const buttonWidth = "w-56 md:w-64"; // Responsive width

  // Button styling: more transparent, consistent height
  const buttonClasses = `flex items-center w-full justify-between gap-2 px-3 py-2 rounded-lg 
                         bg-black/10 hover:bg-black/20 border border-white/10 
                         transition-colors ${
                           selectedModel ? "" : "text-gray-400"
                         }`;

  // Dropdown styling: matches other glassmorphism, opens downwards
  const dropdownMenuClasses = `absolute top-full mt-1.5 w-full p-1 rounded-xl 
                               bg-black/20 backdrop-blur-xl border border-white/10 
                               shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar`;

  const hoverClass = isAdmin
    ? "hover:bg-red-500/20 text-gray-300 hover:text-red-300"
    : "hover:bg-cyan-400/20 text-gray-300 hover:text-cyan-300";

  if (isLoading)
    return (
      <div
        className={`text-sm text-gray-400 ${buttonWidth} text-center px-3 py-2 rounded-lg bg-black/10`}
      >
        Loading models...
      </div>
    );
  if (error)
    return (
      <div
        className={`text-sm text-red-400 ${buttonWidth} text-center px-3 py-2 rounded-lg bg-black/10`}
        title={error}
      >
        Error!
      </div>
    );
  if (!models || models.length === 0)
    return (
      <div
        className={`text-sm text-gray-400 ${buttonWidth} text-center px-3 py-2 rounded-lg bg-black/10`}
      >
        No models.
      </div>
    );

  return (
    <div className={`relative ${buttonWidth}`} ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClasses}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CurrentIcon
            className={`flex-shrink-0 ${
              selectedModel ? "text-gray-300" : "text-gray-500"
            }`}
            size={18}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={displayModelName}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className={`font-medium text-sm truncate ${
                selectedModel ? "text-gray-200" : "text-gray-400"
              }`}
            >
              {displayModelName}
            </motion.span>
          </AnimatePresence>
        </div>
        <FiChevronDown
          className={`text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }} // y: -10 for slight upward move before settling down
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={dropdownMenuClasses}
          >
            {models.map((option, i) => {
              let OptionIcon = FiCpu;
              const isSelected = selectedModelId === option.id;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: i * 0.03 },
                  }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => {
                    onModelChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                    // py-2 for item height
                    isSelected
                      ? isAdmin
                        ? "bg-red-500/25 text-red-300 font-medium"
                        : "bg-cyan-400/25 text-cyan-200 font-medium"
                      : hoverClass
                  }`}
                >
                  <OptionIcon className="flex-shrink-0" size={18} />
                  <span className="truncate flex-1">{option.name}</span>
                  <span className="text-xs text-gray-500">
                    {option.provider}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ModelSelector;
