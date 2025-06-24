import { motion } from "framer-motion";

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const FeatureSection = ({
  title,
  description,
  image,
  alt,
  reverse = false,
}) => {
  const directionClass = reverse ? "md:flex-row-reverse" : "md:flex-row";

  return (
    <motion.section
      className={`flex flex-col ${directionClass} items-center gap-12`}
      variants={sectionVariants}
    >
      <div className="w-full md:w-1/2">
        <h2 className="text-3xl font-bold mb-4 text-white">{title}</h2>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="w-full md:w-1/2">
        <motion.img
          src={image}
          alt={alt}
          className="rounded-lg shadow-2xl object-cover"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      </div>
    </motion.section>
  );
};

export default FeatureSection;
