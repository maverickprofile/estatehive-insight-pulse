import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProfilePage from "./Profile";

const ProfileLayout = () => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <ProfilePage />
        </main>
      </div>
    </div>
  );
};

export default ProfileLayout;
