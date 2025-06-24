// src/pages/HistoryPage.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "../context/AdminContext";
import HistoryList from "../components/HistoryList";
import { mockHistory } from "../data/mockHistory";

const pageVariants = {
  initial: (direction) => ({
    opacity: 0,
    y: direction !== 0 ? direction * 50 : 20,
  }),
  animate: { opacity: 1, y: 0 },
  exit: (direction) => ({
    opacity: 0,
    y: direction !== 0 ? direction * -50 : -20,
  }),
  transition: { type: "tween", ease: "circOut", duration: 0.5 },
};

const HistoryPage = ({ selectedRepo }) => {
  const { isAdmin } = useAdmin();
  const [fullHistory, setFullHistory] = useState(mockHistory);
  const [filteredHistory, setFilteredHistory] = useState([]);

  useEffect(() => {
    if (selectedRepo === "all") {
      setFilteredHistory(fullHistory);
    } else {
      setFilteredHistory(
        fullHistory.filter((item) => item.repoId === selectedRepo)
      );
    }
  }, [selectedRepo, fullHistory]);

  const pageTitle = isAdmin ? "Manage History" : "Query History";
  const titleColorClass = isAdmin ? "text-red-400" : "text-gray-200";

  const handleDelete = (idToDelete) => {
    if (isAdmin)
      setFullHistory((prev) => prev.filter((item) => item.id !== idToDelete));
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageVariants.transition}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-8">
        <h1
          className={`text-3xl font-bold ${titleColorClass} transition-colors duration-300`}
        >
          {pageTitle}
        </h1>
      </div>
      <HistoryList history={filteredHistory} onDelete={handleDelete} />
    </motion.div>
  );
};

export default HistoryPage;
