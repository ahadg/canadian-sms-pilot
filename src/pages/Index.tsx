import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DeviceManagement } from "@/components/devices/DeviceManagement";
import { CampaignManagement } from "@/components/campaigns/CampaignManagement";
import { AIMessages } from "@/components/messages/AIMessages";
import { Analytics } from "@/components/analytics/Analytics";
import { Auth } from "@/pages/Auth";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
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
      case "settings":
        return (
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <p className="text-muted-foreground">Platform settings coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
