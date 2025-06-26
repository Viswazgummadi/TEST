import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi";
import { MdComputer } from "react-icons/md";

// Your fetchApi helper - UNCHANGED
const fetchApi = async (url, options = {}) => {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const response = await fetch(`http://localhost:5001${url}`, {
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
  if (response.status === 204 || response.headers.get("content-length") === "0")
    return null;
  return response.json();
};

const ChatInputBar = ({ onSubmit, isDisabled = false, isRepoSelected = false }) => {
  const [inputText, setInputText] = useState("");
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState(null);

  const selectorRef = useRef(null);
  const initialDefaultModelId = "gemini-1.5-flash";

  useEffect(() => {
    const getModels = async () => {
      setIsLoadingModels(true);
      setModelsError(null);
      try {
        const fetchedModels = await fetchApi("/api/chat/available-models");
        setAvailableModels(fetchedModels || []);
        if (fetchedModels && fetchedModels.length > 0) {
          const defaultModel =
            fetchedModels.find((m) => m.id === initialDefaultModelId) ||
            fetchedModels[0];
          setSelectedModel(defaultModel);
        } else {
          setSelectedModel(null);
        }
      } catch (err) {
        setModelsError(err.message);
        setAvailableModels([]);
        setSelectedModel(null);
      } finally {
        setIsLoadingModels(false);
      }
    };
    getModels();
  }, [initialDefaultModelId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsModelSelectorOpen(false);
      }
    };
    if (isModelSelectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModelSelectorOpen]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !actualIsDisabled && selectedModel) {
      onSubmit(inputText, selectedModel.id);
      setInputText("");
    } else if (!selectedModel && !actualIsDisabled) {
      console.warn("No model selected. Cannot submit message.");
    }
  };

  let placeholderText = "What is on your mind?";
  if (isDisabled) {
    placeholderText = "Processing...";
  } else if (!isRepoSelected) {
    placeholderText = "Please select a repository to begin chatting";
  } else if (isLoadingModels) {
    placeholderText = "Loading models...";
  } else if (modelsError) {
    placeholderText = `Error loading models! Try refreshing.`;
  } else if (!selectedModel && availableModels.length > 0) {
    placeholderText = "Select a model to begin...";
  } else if (
    !selectedModel &&
    availableModels.length === 0 &&
    !isLoadingModels &&
    !modelsError
  ) {
    placeholderText = "No models available. Check admin settings.";
  }

  const actualIsDisabled =
    isDisabled ||
    !isRepoSelected ||
    !selectedModel ||
    isLoadingModels ||
    !!modelsError;

  return (
    <motion.div
      className="relative w-full"
      ref={selectorRef}
    >
      <AnimatePresence>
        {isModelSelectorOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 10,
              scale: 0.95,
              transition: { duration: 0.2 },
            }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-full left-0 mb-3 w-56 sm:w-64 p-1 rounded-lg bg-stone-900 border border-white/10 shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar"
          >
            {isLoadingModels && (
              <div className="px-3 py-2 text-sm text-gray-400">
                Loading models...
              </div>
            )}
            {modelsError && (
              <div
                className="px-3 py-2 text-sm text-red-400"
                title={modelsError}
              >
                Model loading error!
              </div>
            )}
            {!isLoadingModels &&
              !modelsError &&
              availableModels.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No models configured.
                </div>
              )}
            {!isLoadingModels &&
              !modelsError &&
              availableModels.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    setSelectedModel(option);
                    setIsModelSelectorOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 w-full px-3 py-2 rounded text-sm hover:bg-cyan-400/10 text-gray-300 hover:text-cyan-300 cursor-pointer transition-colors
                                ${selectedModel &&
                      selectedModel.id === option.id
                      ? "bg-cyan-400/10 text-cyan-200"
                      : ""
                    }`}
                >
                  <span className="truncate">
                    {option.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({option.provider})
                    </span>
                  </span>
                  {selectedModel && selectedModel.id === option.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  )}
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleFormSubmit}
        className={`relative w-full h-14 rounded-full bg-stone-900/70 border border-white/10 shadow-lg backdrop-blur-md transition-opacity ${actualIsDisabled && !isDisabled ? "opacity-70 cursor-not-allowed" : ""
          } ${isDisabled ? "opacity-60 cursor-wait" : ""}`}
      >
        <button
          type="button"
          onClick={() => {
            if (!isDisabled) {
              setIsModelSelectorOpen((prev) => !prev);
            }
          }}
          disabled={
            isDisabled ||
            isLoadingModels
          }
          title={
            modelsError
              ? "Model loading error"
              : selectedModel
                ? `Using ${selectedModel.name}`
                : "Select model"
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MdComputer
            className={`text-gray-400 ${modelsError
              ? "text-red-500"
              : selectedModel
                ? "text-cyan-400"
                : "text-gray-400"
              }`}
          />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholderText}
          className="w-full h-full bg-transparent text-gray-200 pl-14 pr-16 focus:outline-none placeholder-gray-500"
          disabled={actualIsDisabled}
        />

        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-cyan-500/80 text-white hover:bg-cyan-500/100 transition-colors disabled:opacity-50 disabled:bg-cyan-500/40 disabled:cursor-not-allowed"
          disabled={actualIsDisabled || !inputText.trim()}
          title="Send message"
        >
          <FiSend size={18} />
        </button>
      </form>
    </motion.div>
  );
};

export default ChatInputBar;