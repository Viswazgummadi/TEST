import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi";
import { MdComputer } from "react-icons/md";

const modelOptions = [
  { id: "model1", name: "Claude Sonnet" },
  { id: "model2", name: "GPT-4o" },
  { id: "model3", name: "Gemini Pro" }, // ← restored from old version
];

// Accepts new 'isDisabled' prop
const ChatInputBar = ({ onSubmit, layoutId, isDisabled = false }) => {
  const [inputText, setInputText] = useState("");
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const selectorRef = useRef(null);

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
    if (inputText.trim() && !isDisabled) {
      onSubmit(inputText);
      setInputText("");
    }
  };

  return (
    <motion.div
      layoutId={layoutId}
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
            className="absolute bottom-full left-0 mb-3 w-48 p-1 rounded-lg bg-stone-900 border border-white/10 shadow-lg z-10"
          >
            {modelOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => {
                  setSelectedModel(option);
                  setIsModelSelectorOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm hover:bg-cyan-400/10 text-gray-300 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                <span>{option.name}</span>
                {selectedModel.id === option.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleFormSubmit}
        className={`relative w-full h-14 rounded-full bg-stone-900/70 border border-white/10 shadow-lg backdrop-blur-md transition-opacity ${
          isDisabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => !isDisabled && setIsModelSelectorOpen((prev) => !prev)}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
        >
          <MdComputer className="text-gray-400" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isDisabled ? "Processing..." : "What is on your mind?"}
          className="w-full h-full bg-transparent text-gray-200 pl-14 pr-16 focus:outline-none"
          disabled={isDisabled}
        />

        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 transition-colors"
          disabled={isDisabled}
        >
          <FiSend />
        </button>
      </form>
    </motion.div>
  );
};

export default ChatInputBar;
