// src/components/UniversalSelector.jsx

import { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../context/AdminContext"; // IMPORT useAdmin

const UniversalSelector = ({ options, selectedValue, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isAdmin } = useAdmin(); // USE the hook

  const selectedOption =
    options.find((option) => option.id === selectedValue) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const Icon = selectedOption.icon;

  // DYNAMIC HOVER CLASS
  const hoverClass = isAdmin
    ? "hover:bg-red-500/10 text-gray-300 hover:text-red-400"
    : "hover:bg-cyan-400/10 text-gray-300 hover:text-cyan-300";

  return (
    <div className="relative w-52" ref={dropdownRef}>
      <motion.button
        layoutId="universal-selector-button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center w-full justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[.05] border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Icon className="text-gray-300 flex-shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedOption.name}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className="font-medium text-sm text-gray-200 truncate"
            >
              {selectedOption.name}
            </motion.span>
          </AnimatePresence>
        </div>
        <FiChevronDown
          className={`text-gray-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-full left-0 mt-2 w-full p-1 rounded-lg bg-stone-900 border border-white/10 shadow-lg z-50"
          >
            {options.map((option, i) => {
              const OptionIcon = option.icon;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: i * 0.03 },
                  }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded text-sm cursor-pointer transition-colors ${hoverClass}`}
                >
                  <OptionIcon className="flex-shrink-0" />
                  <span>{option.name}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UniversalSelector;
