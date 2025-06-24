// src/components/FlowModal.jsx

import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import LangGraph from "./LangGraph";

const FlowModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* Modal Content */}
      <motion.div
        className="relative w-full max-w-4xl p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white/10 p-2 rounded-full text-white hover:bg-white/20 z-10"
        >
          <FiX />
        </button>
        <LangGraph />
      </motion.div>
    </div>
  );
};

export default FlowModal;
