import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { navItems } from "../navigation.js";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { MdKeyboardDoubleArrowLeft, MdPerson } from "react-icons/md";

const sidebarVariants = {
  collapsed: {
    width: "56px",
    transition: { type: "spring", damping: 20, stiffness: 120 },
  },
  expanded: {
    width: "180px",
    transition: { type: "spring", damping: 20, stiffness: 120 },
  },
};

const Sidebar = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const [isExpanded, setIsExpanded] = useState(false);
  const { pathname } = useLocation();

  return (
    // --- THIS IS THE UPDATED LINE ---
    // bg-black/30 -> bg-black/20 (more transparent)
    // backdrop-blur-lg -> backdrop-blur-xl (stronger blur)
    <motion.div
      className="fixed top-[16px] left-[16px] bottom-[16px] bg-black/20 backdrop-blur-xl border border-white/10 z-50 flex flex-col py-3 px-2 rounded-xl"
      variants={sidebarVariants}
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
    >
      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center w-full h-10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex-shrink-0 w-[40px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="collapse"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <MdKeyboardDoubleArrowLeft
                    size={20}
                    className="text-gray-400"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="expand"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  <FiMenu size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>

      <nav className="flex-1 flex flex-col space-y-1">
        {navItems.map((item) => {
          const targetHref =
            isAdmin && item.adminHref ? item.adminHref : item.href;
          const IconToRender =
            isAdmin && item.adminIcon ? item.adminIcon : item.defaultIcon;
          const isActive =
            pathname === item.href ||
            (item.adminHref && pathname === item.adminHref);
          let linkClass = "";
          if (isAdmin) {
            if (isActive) {
              linkClass = "bg-red-500/20 text-red-400";
            } else {
              linkClass =
                "text-gray-400 hover:bg-red-500/20 hover:text-red-400";
            }
          } else {
            if (isActive) {
              linkClass = "bg-cyan-400/20 text-cyan-300";
            } else {
              linkClass =
                "text-gray-400 hover:bg-cyan-400/20 hover:text-cyan-300";
            }
          }

          return (
            <Link
              key={item.text}
              to={targetHref}
              title={item.text}
              className={`flex items-center w-full h-10 rounded-lg transition-colors duration-200 ${linkClass}`}
            >
              <div className="flex-shrink-0 w-[40px] h-full flex items-center justify-center">
                <IconToRender
                  style={{ width: 20, height: 20, flexShrink: 0 }}
                />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    className="ml-1 whitespace-nowrap text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.2, delay: 0.05 },
                    }}
                    exit={{
                      opacity: 0,
                      x: -10,
                      transition: { duration: 0.15 },
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

      <button
        onClick={() => setIsAdmin((prev) => !prev)}
        title="Admin Mode"
        className={`flex items-center w-full h-10 rounded-lg transition-colors duration-200 mb-1 ${
          isAdmin
            ? "bg-red-500/20 text-red-400"
            : "text-gray-400 hover:bg-white/10"
        }`}
      >
        <div className="flex-shrink-0 w-[40px] h-full flex items-center justify-center">
          <MdPerson size={22} />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              className="ml-1 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Admin Mode
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Link
        to="/"
        title="Exit to Homepage"
        className={`flex items-center w-full h-10 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200`}
      >
        <div className="flex-shrink-0 w-[40px] h-full flex items-center justify-center">
          <FiLogOut style={{ width: 20, height: 20, flexShrink: 0 }} />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              className="ml-1 text-sm"
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
