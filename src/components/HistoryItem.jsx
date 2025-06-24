// src/components/HistoryItem.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../context/AdminContext";
import { FiChevronDown, FiTrash2 } from "react-icons/fi";

const formatTimestamp = (ts) => {
  const date = new Date(ts);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
};

const HistoryItem = ({ id, question, answer, timestamp, onDelete }) => {
  const { isAdmin } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);

  const activeColorClass = isAdmin ? "border-red-500/40" : "border-cyan-400/30";
  const hoverColorClass = isAdmin
    ? "hover:bg-red-500/10"
    : "hover:bg-cyan-400/10";
  const iconColorClass = isAdmin ? "text-red-400" : "text-cyan-300";
  const deleteHoverClass = "hover:bg-red-500/20 hover:text-red-300";

  return (
    <motion.div
      layout
      className={`bg-stone-900/50 border rounded-lg transition-colors overflow-hidden ${
        isOpen ? activeColorClass : "border-white/10"
      }`}
    >
      <div
        className={`flex items-center justify-between p-4 cursor-pointer ${hoverColorClass} transition-colors duration-200`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 pr-4">
          <p className="font-semibold text-gray-200">{question}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTimestamp(timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className={`p-2 rounded-full transition-colors ${deleteHoverClass}`}
              title="Delete Item"
            >
              <FiTrash2 size={18} />
            </motion.button>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiChevronDown size={22} className={iconColorClass} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              opacity: { duration: 0.2, delay: 0.1 },
              height: { duration: 0.3 },
            }}
            className="border-t border-white/10"
          >
            <p className="p-6 text-gray-300 whitespace-pre-line leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HistoryItem;
