import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import HistoryList from "../components/HistoryList";
import { mockHistory } from "../data/mockHistory";

const pageVariants = {
  initial: (direction) => ({ opacity: 0, y: direction * 50 }),
  animate: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: direction * -50 }),
  transition: { type: "tween", ease: "circOut", duration: 0.5 },
};

const AdminHistoryPage = () => {
  const [historyItems, setHistoryItems] = useState(mockHistory);

  const handleDelete = (idToDelete) => {
    console.log(`Admin deleted history item: ${idToDelete}`);
    setHistoryItems((prevItems) =>
      prevItems.filter((item) => item.id !== idToDelete)
    );
  };

  return (
    <motion.div
      custom={0}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageVariants.transition}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-red-400">Manage History</h1>
      </div>
      <HistoryList history={historyItems} onDelete={handleDelete} />
    </motion.div>
  );
};

export default AdminHistoryPage;
