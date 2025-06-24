import { useState, useEffect, useRef } from "react";
import { FiGithub, FiChevronDown } from "react-icons/fi";
import { SiGoogledrive } from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";

const cloudOptions = [
  { id: "github", name: "GitHub", icon: FiGithub },
  { id: "drive", name: "Google Drive", icon: SiGoogledrive },
];

const CloudSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(cloudOptions[0]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const Icon = selected.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[.03] hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Icon />
        <span className="font-medium text-sm">{selected.name}</span>
        <FiChevronDown
          className={`opacity-50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-40 p-1 rounded-lg bg-stone-900 border border-white/10 shadow-lg z-50"
          >
            {cloudOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <div
                  key={option.id}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm hover:bg-white/10 cursor-pointer"
                >
                  <OptionIcon className="text-gray-400" />
                  <span>{option.name}</span>
                </div> // This closing tag is now correct.
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CloudSelector;
