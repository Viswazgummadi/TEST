// src/components/UniversalHeader.jsx
// (No changes needed here. It already correctly uses repoFilter and onRepoChange props from parent.)

import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import Logo from "./Logo";
import UniversalSelector from "./UniversalSelector";
import { MdSchedule, MdManageHistory, MdFolderSpecial } from "react-icons/md";
import { FiGithub, FiFolder, FiBox, FiDatabase, FiMessageSquare } from "react-icons/fi";
import { SiGoogledrive } from "react-icons/si";

const repoSourceOptions = [
  { id: "all", name: "All Sources", icon: FiDatabase },
  { id: "github", name: "GitHub", icon: FiGithub },
  { id: "google_drive", name: "Google Drive", icon: SiGoogledrive },
];

const HomeControls = () => {
  const { isAdmin } = useAdmin();
  const hoverClass = isAdmin ? "hover:text-red-400" : "hover:text-cyan-400";
  return (
    <nav className="flex items-center gap-6 text-sm font-medium text-gray-300">
      <a href="https://github.com/Viswazgummadi/Reploit.git" target="_blank" rel="noopener noreferrer" className={`transition-colors ${hoverClass}`}>code</a>
      <Link to="/implementation" className={`transition-colors ${hoverClass}`}>explore</Link>
      <Link to="/deployment" className={`transition-colors ${hoverClass}`}>deploy</Link>
      <Link to="/repos" className={`transition-colors ${hoverClass}`}>test</Link>
    </nav>
  );
};

const AppControls = ({ selectorProps }) => {
  const { pathname } = useLocation();
  const { isAdmin } = useAdmin();
  const onHistoryPage = pathname.startsWith("/history") || pathname.startsWith("/admin/history");

  let ContextualIcon, contextualLink;
  if (onHistoryPage) {
    contextualLink = isAdmin ? "/admin/repos" : "/repos";
    ContextualIcon = isAdmin ? MdFolderSpecial : FiFolder;
  } else {
    contextualLink = isAdmin ? "/admin/history" : "/history";
    ContextualIcon = isAdmin ? MdManageHistory : MdSchedule;
  }

  return (
    <div className="flex items-center gap-4">
      <AnimatePresence>
        {selectorProps && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <UniversalSelector {...selectorProps} />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div>
        <Link to={contextualLink} className="text-gray-400 hover:text-white transition-colors">
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
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
  const { sourceFilter, onSourceChange, repoFilter, onRepoChange, repos } = props;

  const appStylePages = ["/repos", "/history", "/admin/history", "/chat", "/admin/repos", "/admin/settings"];
  const isAppStyleHeader = appStylePages.some((page) => pathname.startsWith(page));

  const liveRepoOptions = (repos || []).map((repo) => ({
    id: repo.id,
    name: repo.name,
    icon: repo.source_type === 'github' ? FiGithub : SiGoogledrive,
  }));

  let selectorOptionsForPage;

  if (pathname.startsWith("/chat")) {
    const selectRepoPlaceholder = { id: "", name: "Select a Repo", icon: FiMessageSquare, disabled: true };
    selectorOptionsForPage = [selectRepoPlaceholder, ...liveRepoOptions];
  } else {
    const allReposOption = { id: "all", name: "All Repositories", icon: FiBox };
    selectorOptionsForPage = [allReposOption, ...liveRepoOptions];
  }

  let selectorProps = null;

  if (pathname === "/repos" || pathname.startsWith("/admin/repos")) {
    selectorProps = {
      options: repoSourceOptions,
      selectedValue: sourceFilter,
      onChange: onSourceChange,
    };
  } else if (
    pathname.startsWith("/chat") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/admin/history")
  ) {
    selectorProps = {
      options: selectorOptionsForPage,
      selectedValue: repoFilter, // Uses the persisted repoFilter
      onChange: onRepoChange, // Uses the setRepoFilter to persist
    };
  }

  return (
    <header className="sticky top-0 z-40 p-3">
      <div className="flex items-center justify-between h-14 px-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl">
        <motion.div layoutId="app-logo-container">
          <Logo />
        </motion.div>
        <motion.div>
          <AnimatePresence mode="wait">
            {isAppStyleHeader ? (
              <motion.div key="app" initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 25 }} transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}>
                <AppControls selectorProps={selectorProps} />
              </motion.div>
            ) : (
              <motion.div key="home" initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}>
                <HomeControls />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
};

export default UniversalHeader;