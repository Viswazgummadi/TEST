// src/pages/DeploymentPage.jsx

import { motion } from "framer-motion";
import GuideSection from "../components/GuideSection";
import CodeBlock from "../components/CodeBlock";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

// --- NEW: Master animation variants for the entire page content ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Snappy stagger between each element
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
// --- END NEW VARIANTS ---

const DeploymentPage = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full"
    >
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-100">
          Deployment Guide
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Get your own instance of the Reploit engine up and running with these
          simple steps.
        </p>
      </div>

      {/* The entire content is wrapped in the master animation container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        <motion.div variants={itemVariants}>
          <GuideSection title="Initial Setup">
            <CodeBlock command="git clone https://github.com/Viswazgummadi/Reploit.git" />
          </GuideSection>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-2 gap-x-12 gap-y-12"
        >
          {/* This grid layout will now animate in as a single block, with its children animated by their own parent */}
          <GuideSection title="Terminal-1 (UI)">
            <CodeBlock command="cd Reploit/ui" />
            <CodeBlock command="npm install" />
            <p className="text-sm text-gray-400 pl-2">
              Install all required node packages.
            </p>
            <CodeBlock command="npm run dev" />
          </GuideSection>

          <GuideSection title="Terminal-2 (Backend)">
            <CodeBlock command="cd Reploit/" />
            <CodeBlock command="python3 -m venv venv" />
            <CodeBlock command="source venv/bin/activate" />
            <p className="text-sm text-gray-400 pl-2">
              Create and activate a virtual environment.
            </p>
            <CodeBlock command="pip install -r requirements.txt" />
            <CodeBlock command="uvicorn main:app --reload" />
          </GuideSection>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GuideSection title="Advanced: Custom Indexing Pipeline">
            <p className="text-md text-gray-300 mb-4">
              To modify the graph contents or run your own indexing pipeline,
              execute these commands from the main `Reploit/` directory.
            </p>
            <CodeBlock command="python3 build_code_graph.py" />
            <p className="text-sm text-gray-400 pl-2">
              Convert your codebase into embeddings.
            </p>
            <CodeBlock command="python3 indexer.py" />
            <p className="text-sm text-gray-400 pl-2">
              Push embeddings to your vector database.
            </p>
            <CodeBlock command="uvicorn main:app --reload" />
            <p className="text-sm text-gray-400 pl-2">
              Restart the backend to use the new knowledge base.
            </p>
          </GuideSection>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="text-center pt-8 border-t border-white/10 mt-16"
        >
          <p className="text-lg text-gray-300">
            Feeling overwhelmed? Use the admin UI on the front-end to manage
            your repositories dynamically.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default DeploymentPage;
