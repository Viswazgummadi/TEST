import PageLayout from "../components/PageLayout"; // Using our new layout component

const HistoryPage = () => {
  return (
    <PageLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-4xl font-bold">History Management</h1>
        <p className="mt-4 text-gray-400">
          This page will display a list of history items for manual curation
          from the database.
        </p>
      </div>
    </PageLayout>
  );
};

export default HistoryPage;
