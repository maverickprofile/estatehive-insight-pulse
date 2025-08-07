// src/pages/AgentsLayout.tsx
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AgentsPage from "./Agents";

export default function AgentsLayout() {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <AgentsPage />
        </main>
      </div>
    </div>
  );
}



