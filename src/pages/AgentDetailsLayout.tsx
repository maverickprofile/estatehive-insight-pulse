// src/pages/AgentDetailsLayout.tsx
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AgentDetailsPage from "./AgentDetails";

export default function AgentDetailsLayout() {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <AgentDetailsPage />
        </main>
      </div>
    </div>
  );
}
