// src/components/GuideSection.jsx

// This component is now purely for structure and styling.
// All animation control has been lifted up to the parent page.

const GuideSection = ({ title, children }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200 border-b border-white/10 pb-2 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
};

export default GuideSection;
