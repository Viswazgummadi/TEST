// src/components/HistoryList.jsx

import { motion, AnimatePresence } from "framer-motion";
import HistoryItem from "./HistoryItem";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  exit: { x: -50, opacity: 0, transition: { duration: 0.3 } },
};

const HistoryList = ({ history, onDelete }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 italic">
          No history items match the current filter.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <AnimatePresence>
        {history.map((item) => (
          <motion.div key={item.id} variants={itemVariants} exit="exit">
            <HistoryItem
              id={item.id}
              question={item.question}
              answer={item.answer}
              timestamp={item.timestamp}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default HistoryList;
