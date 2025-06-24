import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InitialPrompt from "../components/InitialPrompt";
import ChatInputBar from "../components/ChatInputBar";
import ConversationView from "../components/ConversationView";

const ChatPage = () => {
  const [pageState, setPageState] = useState("initial");
  const [messages, setMessages] = useState([]);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSubmit = (queryText) => {
    const newUserMessage = { id: Date.now(), text: queryText, author: "user" };
    setMessages((prev) => [...prev, newUserMessage]);
    setPageState("processing");

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: `This is a simulated response to your query: "${queryText}". The actual response would come from the backend, and now we will smoothly scroll to see it.`,
        author: "llm",
        traceUrl:
          "https://smith.langchain.com/public/1e29b64b-134f-4ee7-adcc-03fbab27085a/r",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setPageState("active_conversation");
    }, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {pageState === "initial" ? (
          <motion.div
            key="initial-view"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="w-full h-full flex flex-col items-center justify-center pb-24"
          >
            <InitialPrompt />
            <div className="w-full max-w-2xl">
              <ChatInputBar
                layoutId="chat-input-bar"
                onSubmit={handleSubmit}
                isDisabled={false}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conversation-view"
            className="w-full flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-4 -mr-4"
            >
              <ConversationView messages={messages} />
            </div>

            {/* --- THE CHANGE IS ON THIS LINE --- */}
            {/* I changed pb-1 to pb-0 to move the input bar lower. */}
            <div className="w-full pt-3 pb-0">
              <ChatInputBar
                layoutId="chat-input-bar"
                onSubmit={handleSubmit}
                isDisabled={pageState === "processing"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
