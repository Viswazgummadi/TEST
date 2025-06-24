import { motion } from "framer-motion";
import { useAdmin } from "../context/AdminContext";
import { FiShare2 } from "react-icons/fi";
import { MdPerson } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";

const MessageBubble = ({ message }) => {
  const { isAdmin } = useAdmin();
  const isUser = message.author === "user";
  const themeColor = isAdmin ? "red" : "cyan";

  const bubbleClasses = isUser
    ? `bg-${themeColor}-500/10 text-${themeColor}-300 self-end`
    : "bg-stone-800/60 self-start";

  const iconClasses = isUser
    ? `bg-${themeColor}-500/20 text-${themeColor}-300`
    : `bg-stone-700 text-gray-300`;

  const Icon = isUser ? MdPerson : RiRobot2Fill;

  return (
    <div
      className={`flex items-start gap-3 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconClasses}`}
        >
          <Icon size={20} />
        </div>
      )}

      {/* --- THIS IS THE DEFINITIVE FIX --- */}
      {/* Adding 'min-w-0' allows the flex item to shrink and forces the text inside to wrap correctly. */}
      <div
        className={`max-w-2xl flex flex-col min-w-0 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className={`px-4 py-3 rounded-2xl ${bubbleClasses}`}>
          {/* Using 'break-words' ensures long text without spaces also wraps. */}
          <p className="text-gray-200 whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
        {!isUser && message.traceUrl && (
          <motion.a
            href={message.traceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 px-3 py-1 text-xs text-gray-400 rounded-full hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShare2 />
            <span>View Trace</span>
          </motion.a>
        )}
      </div>

      {isUser && (
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconClasses}`}
        >
          <Icon size={20} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
