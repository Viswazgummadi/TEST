import { motion } from "framer-motion";

// These variants are now functions that receive the `direction` prop
const pageTransitionVariants = {
  initial: (direction) => {
    if (direction === 1) return { opacity: 0, y: "5vh" }; // From Bottom
    if (direction === -1) return { opacity: 0, y: "-5vh" }; // From Top
    return { opacity: 0 }; // Default Fade
  },
  animate: { opacity: 1, y: 0 },
  exit: (direction) => {
    if (direction === 1) return { opacity: 0, y: "-5vh" }; // To Top
    if (direction === -1) return { opacity: 0, y: "5vh" }; // To Bottom
    return { opacity: 0 }; // Default Fade
  },
};

const PageLayout = ({ children }) => {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      // The `custom` prop will be passed automatically by AnimatePresence
      transition={{ type: "tween", ease: "circOut", duration: 0.5 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageLayout;
