const TraceEmbed = ({ url }) => {
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        No trace URL provided.
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title="LangSmith Trace"
      className="w-full h-full bg-white rounded-lg"
      style={{ border: "none" }}
      // The "sandbox" attribute has been removed to allow the LangSmith page to load fully.
    />
  );
};

export default TraceEmbed;
