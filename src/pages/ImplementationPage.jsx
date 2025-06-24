// src/pages/ImplementationPage.jsx

import { motion } from "framer-motion";
import { implementationSteps } from "../data/implementationSteps";
import FeatureSection from "../components/FeatureSection";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

const ImplementationPage = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      // --- LAYOUT CLASS CORRECTED ---
      // Removed conflicting classes to ensure consistent padding from App.jsx.
      className="w-full"
    >
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-100">
          Our Implementation
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
          A step-by-step breakdown of how Reploit transforms your source code
          into a queryable, semantic knowledge base.
        </p>
      </div>

      <div className="space-y-16 md:space-y-24">
        {implementationSteps.map((step) => (
          <FeatureSection
            key={step.id}
            title={step.title}
            description={step.description}
            imageUrl={step.imageUrl}
            // The reverse prop is correctly driven by the data file for this page.
            reverse={step.reverse}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ImplementationPage;
