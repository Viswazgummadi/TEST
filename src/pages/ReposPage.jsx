// src/pages/ReposPage.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import RepoList from "../components/RepoList";
import { mockRepos } from "../data/mockRepos";

const pageVariants = {
  initial: (direction) => ({ opacity: 0, y: direction * 50 }),
  animate: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: direction * -50 }),
  transition: { type: "tween", ease: "circOut", duration: 0.5 },
};

const ReposPage = ({ sourceFilter }) => {
  const [filteredRepos, setFilteredRepos] = useState(mockRepos);

  useEffect(() => {
    if (sourceFilter === "all") {
      setFilteredRepos(mockRepos);
    } else {
      // This is placeholder logic. You would replace this with real filtering
      // based on a 'source' property in your repo objects.
      // For example: setFilteredRepos(mockRepos.filter(r => r.source === sourceFilter))
      if (sourceFilter === "github")
        setFilteredRepos(mockRepos.filter((_, i) => i % 2 === 0));
      else if (sourceFilter === "drive")
        setFilteredRepos(mockRepos.filter((_, i) => i % 2 !== 0));
    }
  }, [sourceFilter]);

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
        <h1 className="text-3xl font-bold text-gray-200">
          Public Repositories
        </h1>
        {/* Selector is now in the UniversalHeader */}
      </div>
      <RepoList repos={filteredRepos} />
    </motion.div>
  );
};

export default ReposPage;
