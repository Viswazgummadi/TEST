import { motion } from "framer-motion";
import FeatureSection from "../components/FeatureSection";
import { implementationSteps } from "../data/implementationSteps"; // Import the new data

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const ImplementationPage = () => {
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
          Implementation Details
        </motion.h1>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.1 } },
          }}
          className="text-lg text-gray-400 max-w-3xl mx-auto"
        >
          A step-by-step overview of how the key architectural features of
          Reploit were built.
        </motion.p>
      </header>

      <div className="space-y-20">
        {implementationSteps.map((step, index) => (
          <FeatureSection
            key={step.title}
            title={step.title}
            description={step.description}
            image={step.image} // Now correctly passes the image prop
            alt={step.alt}
            reverse={index % 2 !== 0} // This creates the alternating effect
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ImplementationPage;
