// src/pages/AgentDetailsLayout.tsx
import ResponsiveLayout from "@/components/ResponsiveLayout";
import AgentDetailsPage from "./AgentDetails";

export default function AgentDetailsLayout() {
  return (
    <ResponsiveLayout>
      <AgentDetailsPage />
    </ResponsiveLayout>
  );
}
