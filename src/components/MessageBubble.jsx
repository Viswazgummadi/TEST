// src/components/MessageBubble.jsx

const MessageBubble = ({ author, children }) => {
  const alignmentClass = author === "user" ? "ml-auto" : "mr-auto";
  const colorClass =
    author === "user"
      ? "bg-cyan-500/10 border-cyan-500/20"
      : "bg-white/5 border-white/10";

  return (
    // --- THIS IS THE KEY CHANGE ---
    // The max-width is now applied here, constraining the bubble itself.
    <div className={`w-full max-w-2xl ${alignmentClass}`}>
      <div className={`p-4 rounded-xl border ${colorClass}`}>{children}</div>
    </div>
  );
};

export default MessageBubble;
