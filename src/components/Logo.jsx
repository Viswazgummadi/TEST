import { motion } from "framer-motion";
import { SiReactivex } from "react-icons/si";
import { Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const iconColorVariants = {
  user: { color: "rgb(56, 189, 248)" }, // text-cyan-400
  admin: { color: "rgb(248, 113, 113)" }, // text-red-400
};

const Logo = () => {
  const { isAdmin } = useAdmin();

  return (
    <Link to="/" className="flex items-center gap-3">
      <motion.div
        variants={iconColorVariants}
        animate={isAdmin ? "admin" : "user"}
        transition={{ duration: 0.3 }}
      >
        <SiReactivex className="text-3xl" />
      </motion.div>
      <span className="text-xl font-bold tracking-wider text-gray-100">
        REPLOIT
      </span>
    </Link>
  );
};

export default Logo;
