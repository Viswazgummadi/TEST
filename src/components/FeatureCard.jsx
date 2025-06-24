import { motion } from "framer-motion";

const FeatureCard = ({ imageSrc }) => {
  return (
    <motion.div
      className="relative p-2 bg-white/5 rounded-2xl shadow-2xl overflow-hidden"
      whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
    >
      <div className="absolute inset-0 border-2 border-white/10 rounded-2xl"></div>
      <img
        src={imageSrc}
        alt="Feature highlight"
        className="rounded-lg object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
    </motion.div>
  );
};

export default FeatureCard;
