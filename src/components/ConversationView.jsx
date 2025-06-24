// src/components/ConversationView.jsx

import MessageBubble from "./MessageBubble";
import { AnimatePresence, motion } from "framer-motion";

const ConversationView = ({ messages }) => {
  return (
    // This container is now a simple, full-width scrolling area.
    <div className="flex-1 w-full space-y-6 overflow-y-auto pr-2">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
          >
            <MessageBubble author={message.author}>
              <p>{message.text}</p>
            </MessageBubble>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConversationView;
