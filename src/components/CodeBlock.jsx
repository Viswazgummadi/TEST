// src/components/CodeBlock.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCopy, FiCheck } from "react-icons/fi";

const CodeBlock = ({ command }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(command);
      setHasCopied(true);
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }
  };

  return (
    // This is now a simple motion.div, ready to be animated by its parent.
    // All self-contained animation logic has been removed.
    <motion.div className="relative flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-gray-300">
      <code className="break-all">{command}</code>
      <button
        onClick={handleCopy}
        className="p-2 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
        title="Copy to clipboard"
      >
        <AnimatePresence mode="wait">
          {hasCopied ? (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <FiCheck className="text-green-400" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <FiCopy className="text-gray-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
};

export default CodeBlock;
