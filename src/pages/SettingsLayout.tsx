import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SettingsPage from "./Settings";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <SettingsPage />
        </main>
      </div>
    </div>
  );
};

export default Settings;