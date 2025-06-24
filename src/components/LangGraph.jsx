// src/components/LangGraph.jsx

import { motion } from "framer-motion";

const LangGraph = () => {
  return (
    <div className="w-full h-full p-8 bg-black/20 rounded-lg border border-white/10">
      <svg viewBox="0 0 800 150" className="w-full h-auto">
        {/* Edges */}
        <g fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5">
          <path d="M50 75 C 150 25, 250 25, 350 75" />
          <path d="M50 75 C 150 125, 250 125, 350 75" />
          <path d="M200 75 H 500" />
          <path d="M350 75 C 450 25, 550 25, 650 75" />
          <path d="M350 75 C 450 125, 550 125, 650 75" />
          <path d="M650 75 H 750" />
        </g>

        {/* Placeholder for active path */}
        <motion.path
          d="M50 75 C 150 25, 250 25, 350 75"
          fill="none"
          stroke="#ef4444" // Admin Red
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Nodes */}
        <g fill="#06b6d4" stroke="#0e7490" strokeWidth="2">
          <circle cx="50" cy="75" r="10" />
          <circle cx="200" cy="75" r="10" />
          <circle cx="350" cy="75" r="10" />
          <circle cx="500" cy="75" r="10" />
          <circle cx="650" cy="75" r="10" />
          <circle cx="750" cy="75" r="10" />
        </g>
      </svg>
    </div>
  );
};

export default LangGraph;
