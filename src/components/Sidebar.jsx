import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { navItems } from "../navigation.js"; // CORRECTED: Proper path from components folder
import { FiLogOut, FiMenu, FiArrowLeft } from "react-icons/fi";

const sidebarVariants = {
  initial: {
    x: "-100%",
    opacity: 0,
    transition: { type: "tween", duration: 0.3, ease: "easeInOut" },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { type: "tween", duration: 0.3, ease: "easeInOut" },
  },
  collapsed: {
    x: 0,
    opacity: 1,
    width: "64px",
    transition: { type: "spring", damping: 20, stiffness: 120 },
  },
  expanded: {
    x: 0,
    opacity: 1,
    width: "200px",
    transition: { type: "spring", damping: 20, stiffness: 120 },
  },
};

const iconVariants = { expanded: { x: 0 }, collapsed: { x: 4 } };

const Sidebar = () => {
  const { isAdmin } = useAdmin();
  const [isExpanded, setIsExpanded] = useState(false);
  const { pathname } = useLocation();

  return (
    <motion.div
      className="fixed top-[16px] left-[16px] bottom-[16px] bg-black/30 backdrop-blur-lg border border-white/10 z-50 flex flex-col items-center py-6 rounded-xl"
      variants={sidebarVariants}
      initial="initial"
      exit="exit"
      animate={isExpanded ? "expanded" : "collapsed"}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 rounded-full hover:bg-white/10 transition-colors mb-8"
      >
        {isExpanded ? (
          <FiArrowLeft style={{ width: 24, height: 24 }} />
        ) : (
          <FiMenu style={{ width: 24, height: 24 }} />
        )}
      </button>

      <nav className="flex-1 flex flex-col items-center space-y-4 w-full">
        {navItems.map((item) => {
          const isItemAdminContext =
            isAdmin && (item.adminIcon || item.adminHref);
          const targetHref =
            isItemAdminContext && item.adminHref ? item.adminHref : item.href;
          const IconToRender =
            isItemAdminContext && item.adminIcon
              ? item.adminIcon
              : item.defaultIcon;
          const isActive = pathname === targetHref;

          let linkClass = "";
          if (isActive && isItemAdminContext)
            linkClass = "bg-red-500/20 text-red-400";
          else if (isActive) linkClass = "bg-cyan-400/20 text-cyan-300";
          else if (isItemAdminContext)
            linkClass =
              "text-red-400/80 hover:bg-red-500/20 hover:text-red-400";
          else {
            const hoverClass = isAdmin
              ? "hover:bg-red-500/20 hover:text-red-400"
              : "hover:bg-cyan-400/20 hover:text-cyan-300";
            linkClass = `text-gray-400 ${hoverClass}`;
          }

          return (
            <Link
              key={item.text}
              to={targetHref}
              className={`flex items-center w-full h-12 px-4 rounded-lg transition-colors duration-200 ${linkClass}`}
            >
              <motion.div
                variants={iconVariants}
                animate={isExpanded ? "expanded" : "collapsed"}
                transition={{ type: "spring", damping: 15, stiffness: 150 }}
              >
                <IconToRender
                  style={{ width: 24, height: 24, flexShrink: 0 }}
                />
              </motion.div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    className="ml-4 whitespace-nowrap text-[14px]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.2,
                      delay: 0.1,
                      ease: "easeInOut",
                    }}
                  >
                    {item.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/"
        className={`flex items-center w-full h-12 px-4 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200`}
      >
        <motion.div
          variants={iconVariants}
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={{ type: "spring", damping: 15, stiffness: 150 }}
        >
          <FiLogOut style={{ width: 24, height: 24, flexShrink: 0 }} />
        </motion.div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              className="ml-4 text-[14px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Exit
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
};

export default Sidebar;
