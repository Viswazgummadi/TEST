// src/components/FeatureSection.jsx

import { motion } from "framer-motion";

const FeatureSection = ({ title, description, imageUrl, reverse = false }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      // --- ANIMATION TIMING CORRECTED ---
      transition: { duration: 0.45, ease: "circOut" },
    },
  };

  const textDirectionClass = reverse ? "md:text-right" : "md:text-left";
  const flexDirectionClass = reverse ? "md:flex-row-reverse" : "md:flex-row";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className={`flex flex-col ${flexDirectionClass} items-center gap-8 md:gap-16`}
    >
      <div
        className={`w-full md:w-1/2 flex flex-col justify-center ${textDirectionClass}`}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-4">
          {title}
        </h2>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="w-full md:w-1/2">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-auto rounded-xl shadow-2xl shadow-black/30 object-cover"
        />
      </div>
    </motion.div>
  );
};

export default FeatureSection;
