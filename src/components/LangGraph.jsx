import React from "react";
import { FiMessageSquare, FiZap, FiAlertTriangle } from "react-icons/fi"; // Example icons

const PromptSuggestion = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="bg-slate-700/50 hover:bg-slate-600/70 transition-colors text-gray-300 hover:text-gray-100 px-4 py-2.5 rounded-lg text-sm w-full text-left"
  >
    {text}
  </button>
);

const InitialPrompt = () => {
  // Example suggestions - you'd likely pass these as props or fetch them
  const suggestions = [
    "Explain quantum computing in simple terms",
    "What are some best practices for writing React components?",
    "Suggest a 3-course meal for a dinner party",
    "Write a short story about a time-traveling cat",
  ];

  // In a real scenario, ChatPage's handleSubmit would be passed down or you'd use a context
  const handleSuggestionClick = (suggestionText) => {
    console.log("Suggestion clicked:", suggestionText);
    // This would typically trigger the submission in ChatPage
    // For now, it just logs. You'll need to lift state up or use context/callbacks
    // if you want these buttons to directly submit through ChatPage's handleSubmit.
    // As ChatInputBar is separate, it can't directly use these.
    // One approach: InitialPrompt has an onSuggestionSelect prop that ChatPage provides.
    // This prop would then call ChatPage's logic to populate the input and submit.
  };

  return (
    <div className="text-center max-w-xl w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.4,
          type: "spring",
          stiffness: 100,
        }}
        className="mb-8"
      >
        {/* You can replace this with your actual logo component if you have one */}
        <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg mb-4">
          <FiMessageSquare size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-100 mb-2">
          Hello, Co-founder!
        </h1>
        <p className="text-lg text-gray-400">How can I assist you today?</p>
      </motion.div>

      {/* Example Suggestion Prompts - these are for display only without direct submission hookup here */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-md mx-auto">
        {suggestions.map((s, i) => (
          <PromptSuggestion key={i} text={s} onClick={() => handleSuggestionClick(s)} />
        ))}
      </div> */}

      {/* Informational Cards (Optional) */}
      <div className="mt-10 grid md:grid-cols-3 gap-4 text-left text-sm">
        <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
          <FiZap className="text-yellow-400 mb-2" size={20} />
          <h3 className="font-semibold text-gray-200 mb-1">Capabilities</h3>
          <p className="text-gray-400">
            Can generate code, answer questions, summarize text, and more based
            on configured models.
          </p>
        </div>
        <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
          <FiMessageSquare className="text-blue-400 mb-2" size={20} />
          <h3 className="font-semibold text-gray-200 mb-1">How to Use</h3>
          <p className="text-gray-400">
            Select a model using the 💻 icon, type your query in the bar below,
            and press Enter or click send.
          </p>
        </div>
        <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
          <FiAlertTriangle className="text-red-400 mb-2" size={20} />
          <h3 className="font-semibold text-gray-200 mb-1">Limitations</h3>
          <p className="text-gray-400">
            May occasionally produce incorrect or biased information. Verify
            critical details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InitialPrompt;
