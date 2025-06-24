// src/pages/ChatPage.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InitialPrompt from "../components/InitialPrompt";
import ChatInputBar from "../components/ChatInputBar";
import ConversationView from "../components/ConversationView";

const ChatPage = () => {
  const [pageState, setPageState] = useState("initial");
  const [messages, setMessages] = useState([]);

  const handleSubmit = (queryText) => {
    const newUserMessage = { id: Date.now(), text: queryText, author: "user" };
    setMessages((prev) => [...prev, newUserMessage]);
    setPageState("processing");

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: `This is a simulated response to your query: "${queryText}". The actual response would come from the backend.`,
        author: "llm",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setPageState("active_conversation");
    }, 1500); // Faster simulation for testing
  };

  return (
    // This top-level div makes the page a flex container that fills all available space.
    <div className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {pageState === "initial" ? (
          // --- INITIAL STATE LAYOUT (Centered and Narrow) ---
          <motion.div
            key="initial-view"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            <InitialPrompt />
            <div className="w-full max-w-2xl">
              <ChatInputBar layoutId="chat-input-bar" onSubmit={handleSubmit} />
            </div>
          </motion.div>
        ) : (
          // --- ACTIVE STATE LAYOUT (Unified and Wide) ---
          <motion.div
            key="conversation-view"
            className="w-full flex-1 flex flex-col min-h-0" // The new master container
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* The ConversationView now takes up all available space and scrolls */}
            <ConversationView messages={messages} />

            {/* The ChatInputBar is now guaranteed to have the same full width as the content area */}
            <div className="w-full pt-3 pb-1">
              {" "}
              {/* Reduced bottom padding */}
              <ChatInputBar layoutId="chat-input-bar" onSubmit={handleSubmit} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
