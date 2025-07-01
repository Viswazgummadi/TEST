// src/components/RepoCard.jsx
import { motion, AnimatePresence } from "framer-motion";
import { MdChat, MdDeleteForever, MdCloudUpload, MdSync, MdCleaningServices } from "react-icons/md";
import { FiGithub, FiExternalLink } from "react-icons/fi";
import { SiGoogledrive } from "react-icons/si";
import { CgSpinner } from "react-icons/cg"; // Spinner icon
import { Link } from "react-router-dom";

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
      delay: index * 0.05,
    },
  }),
  exit: { opacity: 0, scale: 0.95 },
};

const viewContainerVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut", staggerChildren: 0.07 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// --- UPDATED StatusIndicator Component ---
const StatusIndicator = ({ status }) => {
  const config = {
    pending: { text: "Pending", color: "bg-gray-500" },
    indexing: { text: "Indexing", color: "bg-blue-500", icon: CgSpinner },
    indexed: { text: "Indexed", color: "bg-green-500" },
    outdated: { text: "Outdated", color: "bg-yellow-500" },
    failed: { text: "Failed", color: "bg-red-500" },
  }[status] || { text: "Unknown", color: "bg-gray-600" };

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      {Icon ? (
        <Icon className="animate-spin" />
      ) : (
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
      )}
      <span>{config.text}</span>
    </div>
  );
};

// --- UPDATED ActionButton Component ---
const ActionButton = ({ icon: Icon, hoverColor, title, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded-full transition-colors ${hoverColor} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400`}
    title={title}
  >
    <Icon style={{ fontSize: "22px" }} />
  </button>
);

const RepoCard = ({ repo, isAdmin, index, onDeleteSource, onReindexSource, onSyncSource, onDeleteEmbeddings }) => {
  const isProcessing = repo.status === 'indexing';
  const isChatReady = repo.status === 'indexed' || repo.status === 'outdated';

  const SourceIcon = repo.source_type === 'github' ? FiGithub : SiGoogledrive;

  let externalLink = null;
  if (repo.source_type === 'github' && repo.connection_details?.repo_full_name) {
    externalLink = `https://github.com/${repo.connection_details.repo_full_name}`;
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={index}
      layout
    >
      <div className="group relative flex items-center justify-between p-4 min-h-[5rem] bg-black/20 rounded-lg border border-white/[.07] hover:border-white/10 transition-colors">
        {!isAdmin && isChatReady && (
          <Link
            to={`/chat?source=${repo.id}`} // Using query param for easy parsing
            className="absolute inset-0 z-10"
            aria-label={`Open chat for ${repo.name}`}
          />
        )}
        <div className="relative z-20 flex items-center gap-4 pointer-events-none">
          <SourceIcon className="text-gray-500" size={20} />
          <div className="flex flex-col">
            <span className="font-medium text-gray-200">{repo.name}</span>
            {externalLink && (
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto text-xs text-gray-400 hover:text-cyan-400 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()} // Prevent card link trigger if user clicks this
              >
                {repo.connection_details.repo_full_name} <FiExternalLink size={12} />
              </a>
            )}
          </div>
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
                    hoverColor="hover:text-cyan-400"
                    title="Re-index from scratch"
                    onClick={() => onReindexSource(repo.id)}
                    disabled={isProcessing}
                  />
                  <ActionButton
                    icon={MdSync}
                    hoverColor="hover:text-blue-400"
                    title="Sync changes"
                    onClick={() => onSyncSource(repo.id)}
                    disabled={isProcessing}
                  />
                  <ActionButton
                    icon={MdCleaningServices}
                    hoverColor="hover:text-yellow-400"
                    title="Delete knowledge index"
                    onClick={() => onDeleteEmbeddings(repo.id)}
                    disabled={isProcessing || repo.status === 'pending'}
                  />
                  <ActionButton
                    icon={MdDeleteForever}
                    hoverColor="hover:text-red-500"
                    title="Delete connection"
                    onClick={() => onDeleteSource(repo.id)}
                    disabled={isProcessing}
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
                {isChatReady ? (
                  <div className="flex items-center gap-2 text-gray-400 transition-all duration-200 transform group-hover:scale-110 group-hover:text-cyan-400">
                    <MdChat size={24} />
                  </div>
                ) : (
                  <StatusIndicator status={repo.status} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default RepoCard;