// src/components/UniversalHeader.jsx

import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import Logo from "./Logo";
import UniversalSelector from "./UniversalSelector";
import { MdSchedule, MdManageHistory, MdFolderSpecial } from "react-icons/md"; // Import new icon
import { FiGithub, FiFolder, FiBox, FiDatabase } from "react-icons/fi";
import { SiGoogledrive } from "react-icons/si";
import { mockRepos } from "../data/mockRepos";

const repoSourceOptions = [
  { id: "all", name: "All Sources", icon: FiDatabase },
  { id: "github", name: "GitHub", icon: FiGithub },
  { id: "drive", name: "Google Drive", icon: SiGoogledrive },
];

const repoFilterOptions = [
  { id: "all", name: "All Repositories", icon: FiBox },
  ...mockRepos.map((repo) => ({ ...repo, icon: FiFolder })),
];

const HomeControls = () => {
  const { isAdmin } = useAdmin();
  const hoverClass = isAdmin ? "hover:text-red-400" : "hover:text-cyan-400";
  return (
    <nav className="flex items-center gap-6 text-sm font-medium text-gray-300">
      <a
        href="https://github.com/Viswazgummadi/Reploit.git"
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-colors ${hoverClass}`}
      >
        code
      </a>
      <Link to="/implementation" className={`transition-colors ${hoverClass}`}>
        explore
      </Link>
      <Link to="/deployment" className={`transition-colors ${hoverClass}`}>
        deploy
      </Link>
      <Link to="/repos" className={`transition-colors ${hoverClass}`}>
        test
      </Link>
    </nav>
  );
};

const AppControls = ({ selectorProps }) => {
  const { pathname } = useLocation();
  const { isAdmin, setIsAdmin } = useAdmin();
  const isReposPage = pathname.startsWith("/repos");

  // --- NEW: CONTEXTUAL ICON LOGIC ---
  const onHistoryPage =
    pathname.startsWith("/history") || pathname.startsWith("/admin/history");

  let ContextualIcon, contextualLink;
  if (onHistoryPage) {
    // If on history page, link to repos page
    contextualLink = "/repos";
    ContextualIcon = isAdmin ? MdFolderSpecial : FiFolder;
  } else {
    // On any other app page, link to history
    contextualLink = isAdmin ? "/admin/history" : "/history";
    ContextualIcon = isAdmin ? MdManageHistory : MdSchedule;
  }
  // --- END NEW LOGIC ---

  const adminButtonVariants = {
    inactive: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "rgb(209, 213, 219)",
    },
    active: {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      color: "rgb(248, 113, 113)",
    },
  };

  return (
    <div className="flex items-center gap-4">
      <AnimatePresence>
        {selectorProps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <UniversalSelector {...selectorProps} />
          </motion.div>
        )}
      </AnimatePresence>
      {isReposPage && (
        <motion.button
          onClick={() => setIsAdmin((prev) => !prev)}
          variants={adminButtonVariants}
          animate={isAdmin ? "active" : "inactive"}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg"
        >
          Admin Mode
        </motion.button>
      )}
      {/* --- REPLACED ICON --- */}
      <motion.div>
        <Link
          to={contextualLink}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname} // Keyed to trigger animation when path changes
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <ContextualIcon size={28} />
            </motion.div>
          </AnimatePresence>
        </Link>
      </motion.div>
    </div>
  );
};

const UniversalHeader = (props) => {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  let selectorProps = null;
  if (pathname.startsWith("/repos")) {
    selectorProps = {
      options: repoSourceOptions,
      selectedValue: props.sourceFilter,
      onChange: props.onSourceChange,
    };
  } else if (["/history", "/admin/history"].includes(pathname)) {
    selectorProps = {
      options: repoFilterOptions,
      selectedValue: props.repoFilter,
      onChange: props.onRepoChange,
    };
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-8 bg-stone-950/80 backdrop-blur-lg border-b border-white/5">
      <div className="flex items-center gap-4">
        <motion.div layoutId="app-logo-container">
          <Logo />
        </motion.div>
      </div>
      <motion.div>
        <AnimatePresence mode="wait">
          {isHomePage ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            >
              <HomeControls />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 25 }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            >
              <AppControls selectorProps={selectorProps} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
};

export default UniversalHeader;
