// src/components/CloudSelector.jsx

import { useState, useEffect, useRef } from "react";
import { FiFolder, FiBox, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { mockRepos } from "../data/mockRepos";

const allReposOption = { id: "all", name: "All Repositories", icon: FiBox };
// This map function correctly adds an icon property for display purposes
const repoOptions = [
  allReposOption,
  ...mockRepos.map((repo) => ({ ...repo, icon: FiFolder })),
];

const CloudSelector = ({ selectedRepo, onRepoChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption =
    repoOptions.find((option) => option.id === selectedRepo) || allReposOption;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const Icon = selectedOption.icon;

  return (
    <div className="relative w-52" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center w-full justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[.05] border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Icon className="text-gray-300 flex-shrink-0" />
          <span className="font-medium text-sm text-gray-200 truncate">
            {selectedOption.name}
          </span>
        </div>
        <FiChevronDown
          className={`text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-full left-0 mt-2 w-full p-1 rounded-lg bg-stone-900 border border-white/10 shadow-lg z-50"
          >
            {repoOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <div
                  key={option.id}
                  onClick={() => {
                    onRepoChange(option.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded text-sm hover:bg-cyan-400/10 text-gray-300 hover:text-cyan-300 cursor-pointer transition-colors"
                >
                  <OptionIcon className="flex-shrink-0" />
                  <span>{option.name}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CloudSelector;
