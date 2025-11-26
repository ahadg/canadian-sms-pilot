// components/Sidebar.tsx
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
  MessageCircleMore,
  Users
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigationStore } from "@/store/useNavigationStore";

interface SidebarProps {
  // Remove activeSection and onSectionChange props since we're using Zustand
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & monitoring",
    //adminOnly: true, // Only admins can see dashboard
  },
  {
    id: "devices",
    label: "Devices",
    icon: Router,
    description: "Ejoin gateways & SIMs",
    adminOnly: true, // Only admins can see devices
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Send,
    description: "SMS campaigns",
    adminOnly: false, // All users can see campaigns
  },
  {
    id: "messages",
    label: "AI Messages",
    icon: MessageSquare,
    description: "Message variations",
    adminOnly: false, // All users can see messages
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
    adminOnly: false, // All users can see inbox
  },
];

export function Sidebar({ }: SidebarProps) {
  const { logout, user } = useAuthStore();
  const { activeSection, navigateToSection } = useNavigationStore();

  // Filter navigation items based on user role
  const isAdmin = user?.role === 'admin';
  const visibleNavigationItems = navigationItems.filter(item => {
    // If item is admin-only, only show to admins
    if (item.adminOnly) {
      return isAdmin;
    }
    // Otherwise, show to all users
    return true;
  });

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
        {visibleNavigationItems.map((item) => {
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
              onClick={() => navigateToSection(item.id)}
            >
              <Icon className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Button>
          );
        })}

        {/* Admin-only User Management */}
        {isAdmin && (
          <Button
            variant={activeSection === "users" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-auto p-3",
              activeSection === "users" && "bg-primary text-primary-foreground shadow-primary"
            )}
            onClick={() => navigateToSection("users")}
          >
            <Users className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">User Management</div>
              <div className="text-xs opacity-70">Manage users & SIMs</div>
            </div>
          </Button>
        )}
      </nav>

      <Separator />

      {/* Settings */}
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => navigateToSection("settings")}
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