import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CreateClientPage from "./CreateClient";

const CreateClientLayout = () => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <CreateClientPage />
        </main>
      </div>
    </div>
  );
};

export default CreateClientLayout;
