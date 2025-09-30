import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DeviceManagement } from "@/components/devices/DeviceManagement";
import { CampaignManagement } from "@/components/campaigns/CampaignManagement";
import { AIMessages } from "@/components/messages/AIMessages";
import { Analytics } from "@/components/analytics/Analytics";
import { Auth } from "./Auth";
import { useAuthStore } from "@/store/useAuthStore";
import { Toaster } from "@/components/ui/toaster";
import { Settings } from "@/components/settings";
import { Inbox } from "@/components/inbox";

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, isAuthenticated, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "devices":
        return <DeviceManagement />;
      case "campaigns":
        return <CampaignManagement />;
      case "messages":
        return <AIMessages />;
      case "analytics":
        return <Analytics />;
      case "inbox":
        return <Inbox />;
      case "settings":
        return <Settings />
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        //user={user}
      />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}