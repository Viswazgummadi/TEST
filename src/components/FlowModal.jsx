import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import TraceEmbed from "./TraceEmbed";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 25, stiffness: 200 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

const FlowModal = ({ onClose, traceUrl }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-4xl h-[80vh] bg-stone-950 rounded-xl border border-white/10 shadow-2xl flex flex-col"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-200">
            Execution Trace
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </header>
        <div className="flex-1 p-2 min-h-0">
          <TraceEmbed url={traceUrl} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlowModal;
