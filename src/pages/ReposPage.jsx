import { motion } from "framer-motion"; // Import is now correctly at the top.
import RepoList from "../components/RepoList";
import { mockRepos } from "../data/mockRepos";

const pageVariants = {
  initial: (direction) => ({ opacity: 0, y: direction * 50 }),
  animate: { opacity: 1, y: 0 },
  exit: (direction) => ({ opacity: 0, y: direction * -50 }),
};

const ReposPage = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      // The `custom` prop is passed automatically from AnimatePresence in App.jsx
      transition={{ type: "tween", ease: "circOut", duration: 0.5 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-200">
          Public Repositories
        </h1>
      </div>
      <RepoList repos={mockRepos} />
    </motion.div>
  );
};

export default ReposPage;
