import { motion, AnimatePresence } from "framer-motion";
import { MdChat, MdDeleteOutline, MdCloudUpload, MdSync } from "react-icons/md";
import { FiGitBranch } from "react-icons/fi";
import { Link } from "react-router-dom";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
      delay: index * 0.05,
    },
  }),
  exit: { opacity: 0, x: -20 },
};

const viewContainerVariants = {
  initial: { opacity: 0, scale: 0.95, x: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut", staggerChildren: 0.07 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const itemVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
};

const StatusIndicator = ({ status }) => {
  const config = {
    indexed: { text: "Indexed", color: "bg-green-500" },
    outdated: { text: "Outdated", color: "bg-yellow-500" },
    not_indexed: { text: "Not Indexed", color: "bg-gray-500" },
  }[status] || { text: "Unknown", color: "bg-gray-600" };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
      <span>{config.text}</span>
    </div>
  );
};

const ActionButton = ({ icon: Icon, hoverColor, title }) => (
  <button
    className={`p-1.5 rounded-full transition-colors ${hoverColor}`}
    title={title}
  >
    <Icon style={{ fontSize: "22px" }} />
  </button>
);

const RepoCard = ({ repo, isAdmin, index }) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={index}
    >
      <div className="group relative flex items-center justify-between p-4 h-20 bg-black/20 rounded-lg border border-white/[.07] hover:border-white/10 transition-colors">
        {!isAdmin && (
          <Link
            to={`/chat/${repo.id}`}
            className="absolute inset-0 z-10"
            aria-label={`Open chat for ${repo.name}`}
          />
        )}
        <div className="relative z-20 flex items-center gap-4 pointer-events-none">
          <FiGitBranch className="text-gray-500" size={20} />
          <span className="font-medium text-gray-200">{repo.name}</span>
        </div>
        <div className="relative z-20 flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            {isAdmin ? (
              <motion.div
                key="admin"
                variants={viewContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center gap-6"
              >
                <motion.div variants={itemVariants}>
                  <StatusIndicator status={repo.status} />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2 text-gray-400"
                >
                  <ActionButton
                    icon={MdCloudUpload}
                    hoverColor="hover:text-red-400"
                    title="Index from scratch"
                  />
                  <ActionButton
                    icon={MdSync}
                    hoverColor="hover:text-red-400"
                    title="Sync changes"
                  />
                  <ActionButton
                    icon={MdDeleteOutline}
                    hoverColor="hover:text-red-500"
                    title="Delete index"
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="user"
                variants={viewContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="pointer-events-none"
              >
                <div className="flex items-center gap-2 text-gray-400 transition-all duration-200 transform group-hover:scale-110 group-hover:text-cyan-400">
                  <MdChat size={24} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default RepoCard;
