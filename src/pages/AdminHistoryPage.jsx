import PageLayout from "../components/PageLayout";

const AdminHistoryPage = () => {
  return (
    <PageLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-4xl font-bold text-red-400">
          [ADMIN] History & FAQ Curation
        </h1>
        <p className="mt-4 text-gray-400">
          This page will have components to review, edit, and delete
          LLM-generated summaries from the database.
        </p>
      </div>
    </PageLayout>
  );
};

export default AdminHistoryPage;
