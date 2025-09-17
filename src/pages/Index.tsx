import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "devices":
        return (
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-bold mb-6">Device Management</h1>
            <p className="text-muted-foreground">Device management interface coming soon...</p>
          </div>
        );
      case "campaigns":
        return (
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-bold mb-6">Campaign Management</h1>
            <p className="text-muted-foreground">Campaign creation and management interface coming soon...</p>
          </div>
        );
      case "messages":
        return (
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-bold mb-6">AI Message Variations</h1>
            <p className="text-muted-foreground">AI message generation interface coming soon...</p>
          </div>
        );
      case "analytics":
        return (
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-bold mb-6">Analytics & Reports</h1>
            <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
          </div>
        );
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
