// src/components/RepoList.jsx
import RepoCard from "./RepoCard";
import { AnimatePresence } from "framer-motion";

const RepoList = ({ sources, isAdmin, onDeleteSource, onReindexSource, onSyncSource, onDeleteEmbeddings }) => {
  if (sources.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No data sources found.</p>;
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {sources.map((repo, index) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            isAdmin={isAdmin}
            index={index}
            onDeleteSource={onDeleteSource}
            onReindexSource={onReindexSource}
            onSyncSource={onSyncSource}
            onDeleteEmbeddings={onDeleteEmbeddings}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RepoList;