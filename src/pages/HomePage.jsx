import { motion } from "framer-motion";
import FeatureSection from "../components/FeatureSection";
import { homePageFeatures } from "../data/homePageFeatures";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const HomePage = () => {
  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
    >
      <header className="text-center mb-16">
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="text-5xl font-bold mb-4 tracking-tight text-white"
        >
          Welcome to Reploit
        </motion.h1>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.1 } },
          }}
          className="text-lg text-gray-400 max-w-3xl mx-auto"
        >
          A demonstration of a sophisticated, multi-page application built with
          Vite + React, featuring a context-aware chat interface with backend
          trace visualization.
        </motion.p>
      </header>

      <div className="space-y-20">
        {homePageFeatures.map((feature, index) => (
          <FeatureSection
            key={feature.title}
            title={feature.title}
            description={feature.description}
            image={feature.image}
            alt={feature.alt}
            reverse={index % 2 !== 0} // This creates the alternating effect
          />
        ))}
      </div>
    </motion.div>
  );
};

export default HomePage;
