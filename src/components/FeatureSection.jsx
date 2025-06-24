import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

const FeatureSection = ({ title, description, image, layout }) => {
  const isImageLeft = layout === "image-left";

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={sectionVariants}
    >
      <div className={`order-2 ${isImageLeft ? "md:order-1" : "md:order-2"}`}>
        <FeatureCard imageSrc={image} />
      </div>
      <div
        className={`order-1 ${
          isImageLeft ? "md:order-2" : "md:order-1"
        } text-center md:text-left`}
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-100 mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.section>
  );
};

export default FeatureSection;
