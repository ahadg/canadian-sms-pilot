// components/Sidebar.tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Users,
  ChevronsUpDown,
  Mail,
  Shield
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
  const userInitials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

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
                "w-full justify-start gap-3 h-auto p-3 transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-primary" 
                  : "hover:bg-primary hover:text-white"
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
              "w-full justify-start gap-3 h-auto p-3 transition-all duration-200",
              activeSection === "users" 
                ? "bg-primary text-primary-foreground shadow-primary" 
                : "hover:bg-primary hover:text-white"
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

      {/* User + Settings */}
      <div className="p-4 space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between gap-3 rounded-xl border border-border/60 px-3 py-3 group hover:bg-primary hover:text-white transition-all duration-200"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 border group-hover:border-white/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold group-hover:bg-white/20 group-hover:text-white transition-colors">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <div className="truncate font-medium group-hover:text-white">{user?.name || "User"}</div>
                  <div className="truncate text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                    {user?.email || "No email"}
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover:text-white/70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" side="top" className="w-72 rounded-xl p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-2 -m-2 rounded-lg hover:bg-primary group transition-colors cursor-default">
                <Avatar className="h-12 w-12 border group-hover:border-white/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold group-hover:bg-white/20 group-hover:text-white transition-colors">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold group-hover:text-white">{user?.name || "User"}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white/80 transition-colors">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user?.email || "No email"}</span>
                  </div>
                  <div className="mt-3">
                    <Badge variant="secondary" className="gap-1 group-hover:bg-white/20 group-hover:text-white border-none transition-colors">
                      <Shield className="h-3 w-3" />
                      {isAdmin ? "Admin" : "User"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  onClick={() => navigateToSection("settings")}
                >
                  <Settings className="h-4 w-4" />
                  Open Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* 
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
        </Button> */}
      </div>
    </div>
  );
}
