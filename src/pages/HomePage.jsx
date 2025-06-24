// src/pages/HomePage.jsx

import { motion } from "framer-motion";
import FeatureSection from "../components/FeatureSection";
import Logo from "../components/Logo";

// This data should be defined here or imported.
const features = [
  {
    id: 1,
    title: "Seamless Repository Integration",
    description:
      "Connect your GitHub repositories in seconds. Reploit intelligently scans and indexes your codebase, building a semantic understanding of your project architecture.",
    imageUrl: "/feature1.png",
  },
  {
    id: 2,
    title: "Natural Language Queries",
    description:
      'Ask questions in plain English. No need to remember complex syntax or file names. "How does our authentication middleware handle token refreshing?"',
    imageUrl: "/feature2.png",
  },
  {
    id: 3,
    title: "Context-Aware Responses",
    description:
      "Leveraging Retrieval-Augmented Generation (RAG), Reploit provides answers based on the specific context of YOUR code, ensuring relevance and accuracy.",
    imageUrl: "/feature3.png",
  },
  {
    id: 4,
    title: "Code-Level Insight",
    description:
      "Go beyond simple text search. Reploit understands functions, classes, and variable relationships, allowing for deeper insights and faster debugging.",
    imageUrl: "/feature4.png",
  },
];

const HomePage = () => {
  return (
    // --- LAYOUT CLASS CORRECTED ---
    // Removed conflicting max-width and padding classes to rely on the main App.jsx layout.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <div className="text-center py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-block" style={{ transform: "scale(1.5)" }}>
            <Logo />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-100 mt-6">
            Understand Your Codebase. Instantly.
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-3xl mx-auto">
            Reploit is a semantic, context-aware code search engine that uses AI
            to provide deep insights into your repositories. Ask questions in
            natural language and get answers based on your actual code.
          </p>
        </motion.div>
      </div>

      <div className="space-y-20 md:space-y-28 py-16">
        {features.map((feature, index) => (
          <FeatureSection
            key={feature.id}
            title={feature.title}
            description={feature.description}
            imageUrl={feature.imageUrl}
            // --- CRITICAL FIX ---
            // Explicitly set reverse to false to ensure the homepage layout is uniform.
            reverse={false}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default HomePage;
