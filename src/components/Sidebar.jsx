// src/components/Sidebar.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom"; // Link might still be used by navItems
import { useAdmin } from "../context/AdminContext"; // Ensure path is correct
import { navItems } from "../navigation.js";
import { FiLogOut as FiExitIcon, FiMenu } from "react-icons/fi"; // FiLogOut is now FiExitIcon
import { MdKeyboardDoubleArrowLeft, MdPerson } from "react-icons/md";
import AdminLoginForm from "./AdminLoginForm.jsx";

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
  const { isAdmin, logout } = useAdmin();
  const [isExpanded, setIsExpanded] = useState(false);
  const { pathname } = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAdminButtonClick = () => {
    if (isAdmin) {
      logout();
    } else {
      setShowLoginModal(true);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const currentNavItems = navItems;

  return (
    <>
      <motion.div
        className="fixed top-[16px] left-[16px] bottom-[16px] bg-black/20 backdrop-blur-xl border border-white/10 z-40 flex flex-col py-3 px-2 rounded-xl"
        variants={sidebarVariants}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
      >
        {/* Expand/Collapse Button */}
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
                    <FiMenu size={20} className="text-gray-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col space-y-1">
          {currentNavItems.map((item) => {
              if (item.isAdminOnly && !isAdmin) {
                return null;
              }
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

        {/* Admin Login/Logout Button */}
        {/* This is now the primary button at the bottom of the nav stack */}
        <div className="mt-auto">
          {" "}
          {/* Ensures it's pushed to the bottom */}
          <button
            onClick={handleAdminButtonClick}
            title={isAdmin ? "Logout Admin" : "Admin Login"}
            className={`flex items-center w-full h-10 rounded-lg transition-colors duration-200 mb-1 ${
              // mb-1 was there, can be adjusted
              isAdmin
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <div className="flex-shrink-0 w-[40px] h-full flex items-center justify-center">
              {isAdmin ? <FiExitIcon size={20} /> : <MdPerson size={22} />}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  className="ml-1 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isAdmin ? "Logout" : "Admin Login"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* REMOVED "Exit to Homepage" Link Button */}
        {/* 
        <Link
          to="/"
          title="Exit to Homepage"
          className={`flex items-center w-full h-10 rounded-lg text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200`}
        >
          <div className="flex-shrink-0 w-[40px] h-full flex items-center justify-center">
            <FiExitIcon style={{ width: 20, height: 20, flexShrink: 0 }} /> 
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
        */}
      </motion.div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="relative">
            <AdminLoginForm onSuccess={closeLoginModal} />
            <button
              onClick={closeLoginModal}
              className="absolute -top-2 -right-2 text-gray-300 bg-slate-800 rounded-full p-1 hover:text-white hover:bg-slate-700 transition-colors"
              title="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
