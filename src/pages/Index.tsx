import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DeviceManagement } from "@/components/devices/DeviceManagement";
import { CampaignManagement } from "@/components/campaigns/CampaignManagement";
import { AIMessages } from "@/components/messages/AIMessages";
import { Analytics } from "@/components/analytics/Analytics";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
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
    <div className="flex min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      {renderContent()}
    </div>
  );
};

export default Index;
