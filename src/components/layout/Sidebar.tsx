import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Router,
  Send,
  BarChart3,
  Settings,
  Zap,
  MessageSquare,
  LogOut,
  MessageCircle,
  MessageCircleMore
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & monitoring",
  },
  {
    id: "devices",
    label: "Devices",
    icon: Router,
    description: "Ejoin gateways & SIMs",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Send,
    description: "SMS campaigns",
  },
  {
    id: "messages",
    label: "AI Messages",
    icon: MessageSquare,
    description: "Message variations",
  },
  // {
  //   id: "analytics",
  //   label: "Analytics",
  //   icon: BarChart3,
  //   description: "Reports & insights",
  // },
  {
    id: "inbox",
    label: "inbox",
    icon: MessageCircleMore,
    description: "Reports & insights",
  },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { logout } = useAuthStore();
  
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">SMS Platform</h1>
          <p className="text-xs text-muted-foreground">Bulk SMS Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-auto p-3",
                isActive && "bg-primary text-primary-foreground shadow-primary"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Button>
          );
        })}
      </nav>

      <Separator />

      {/* Settings */}
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => onSectionChange("settings")}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}