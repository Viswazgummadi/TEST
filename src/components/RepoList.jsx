// src/components/RepoList.jsx

import { AnimatePresence } from "framer-motion";
import DataSourceCard from "./DataSourceCard";

// ✅ ADDED NEW PROPS
const RepoList = ({ sources, isAdmin, onDeleteSource, onReindexSource, onSyncSource, onDeleteEmbeddings }) => {
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {sources.map((source, index) => (
          <DataSourceCard
            key={source.id}
            source={source}
            isAdmin={isAdmin}
            onDeleteSource={onDeleteSource} // This is for deleting the record
            onReindexSource={onReindexSource} // New prop for re-indexing
            onSyncSource={onSyncSource}       // New prop for syncing
            onDeleteEmbeddings={onDeleteEmbeddings} // New prop for deleting embeddings
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RepoList;