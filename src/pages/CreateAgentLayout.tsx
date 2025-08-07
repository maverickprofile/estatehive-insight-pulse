// src/pages/CreateAgentLayout.tsx
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CreateAgentPage from "./CreateAgent";

export default function CreateAgentLayout() {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <CreateAgentPage />
        </main>
      </div>
    </div>
  );
}