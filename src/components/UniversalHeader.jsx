import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import Logo from "./Logo";
import CloudSelector from "./CloudSelector";
import { MdSchedule, MdManageHistory } from "react-icons/md";

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

const AppControls = () => {
  const { pathname } = useLocation();
  const { isAdmin, setIsAdmin } = useAdmin();
  const isReposPage = pathname.startsWith("/repos");
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
    <div className="flex items-center gap-6">
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
      <Link
        to={isAdmin ? "/admin/history" : "/history"}
        className="text-gray-400 hover:text-white transition-colors"
      >
        {isAdmin ? (
          <MdManageHistory style={{ fontSize: "28px" }} />
        ) : (
          <MdSchedule style={{ fontSize: "28px" }} />
        )}
      </Link>
    </div>
  );
};

const UniversalHeader = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";
  const isReposPage = pathname.startsWith("/repos");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-8 bg-stone-950/80 backdrop-blur-lg border-b border-white/5">
      <div className="flex items-center gap-4">
        <motion.div layoutId="app-logo-container">
          <Logo />
        </motion.div>
        <AnimatePresence>
          {isReposPage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CloudSelector />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div layoutId="header-controls-container">
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
              <AppControls />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
};

export default UniversalHeader;
