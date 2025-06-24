import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

// --- SIMPLIFIED: No longer needs the containerRef prop ---
const ConversationView = ({ messages }) => {
  return (
    // The ref and extra classes have been removed from here.
    <div className="flex flex-col space-y-6">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <MessageBubble message={msg} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConversationView;
