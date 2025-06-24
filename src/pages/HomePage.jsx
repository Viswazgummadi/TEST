import { motion } from "framer-motion";
import FeatureSection from "../components/FeatureSection";
import { useAdmin } from "../context/AdminContext";

const featureData = [
  {
    title: "Intuitive Chat Interface",
    description:
      "Engage with a seamless and intelligent chat UI. Powered by a robust backend, it provides instant, context-aware responses.",
    image: "/feature1.png",
    layout: "image-left",
  },
  {
    title: "Advanced History Management",
    description:
      "Never lose track of your progress. Our history management system provides a clear, chronological view of your past interactions.",
    image: "/feature2.png",
    layout: "image-right",
  },
  {
    title: "Dynamic Flow Visualization",
    description:
      "Understand your application architecture at a glance. The flow view provides a beautiful, interactive diagram of your components.",
    image: "/feature3.png",
    layout: "image-left",
  },
  {
    title: "One-Click Deployment",
    description:
      "From development to production in a single click. Our streamlined deployment process integrates directly with your workflow.",
    image: "/feature4.png",
    layout: "image-right",
  },
];

const pageVariants = {
  initial: (direction) =>
    direction !== 0 ? { opacity: 0, y: direction * 50 } : { opacity: 0 },
  animate: { opacity: 1, y: 0 },
  exit: (direction) =>
    direction !== 0 ? { opacity: 0, y: direction * -50 } : { opacity: 0 },
};

const HomePage = () => {
  const { isAdmin } = useAdmin();
  const heroGradientClass = isAdmin
    ? "from-red-400 via-red-500 to-red-400"
    : "from-gray-200 via-cyan-300 to-gray-200";

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "tween", ease: "circOut", duration: 0.5 }}
    >
      <section className="text-center mb-24 md:mb-32">
        <motion.h1
          key={isAdmin ? "admin-title" : "user-title"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className={`text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r pb-2 ${heroGradientClass}`}
        >
          Welcome to REPLOIT
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 max-w-2xl mx-auto text-lg text-gray-400"
        >
          The ultimate platform for building, testing, and deploying
          next-generation applications with ease and precision.
        </motion.p>
      </section>
      <div className="space-y-24 md:space-y-32">
        {featureData.map((feature, index) => (
          <FeatureSection key={index} {...feature} />
        ))}
      </div>
    </motion.div>
  );
};

export default HomePage;
