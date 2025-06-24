import RepoCard from "./RepoCard";
import { AnimatePresence } from "framer-motion";
import { useAdmin } from "../context/AdminContext";

const RepoList = ({ repos }) => {
  const { isAdmin } = useAdmin();
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {repos.map((repo, index) => (
          <RepoCard key={repo.id} repo={repo} isAdmin={isAdmin} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RepoList;
