// App.tsx - Updated to use useNavigationStore
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DeviceManagement } from "@/components/devices/DeviceManagement";
import { CampaignManagement } from "@/components/campaigns/CampaignManagement";
import { AIMessages } from "@/components/messages/AIMessages";
import { Analytics } from "@/components/analytics/Analytics";
import { Auth } from "./Auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useNavigationStore } from "@/store/useNavigationStore"; // Import the navigation store
import { Toaster } from "@/components/ui/toaster";
import { Settings } from "@/components/settings";
import { Inbox } from "@/components/inbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  CheckCheck, 
  Smartphone, 
  TrendingDown, 
  WifiOff, 
  MessageCircle, 
  Sparkles,
  Wifi,
  WifiOff as WifiDisconnected,
  Loader2
} from "lucide-react";

declare global {
  interface Window {
    __ACTIVE_SECTION__: string;
  }
}

function AppContent() {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Use navigation store instead of local state
  const { activeSection, setActiveSection } = useNavigationStore();
  const { user, isAuthenticated, loading, checkAuth } = useAuthStore();
  const { 
    isConnected, 
    connect, 
    disconnect 
  } = useSocketStore();
  
  const {
    notifications,
    notificationsLoading,
    markNotificationAsReadOnServer,
    markAllAsReadOnServer,
    fetchNotifications,
    getUnreadCount
  } = useNotificationStore();

  console.log("notifications", notifications);

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    window.__ACTIVE_SECTION__ = activeSection;
  }, [activeSection]);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Authenticated, connecting socket...');
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Cleanup on unmount
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // Load notifications when authenticated (even if socket is slow)
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Authenticated, loading notifications...');
      fetchNotifications();
    }
  }, [isAuthenticated, user, fetchNotifications]);

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

  // Get unread count from notification store
  const unreadCount = getUnreadCount();

  // Format notification time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon and color for notification type
  const getNotificationConfig = (type: string) => {
    const configs = {
      success: {
        icon: Sparkles,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      },
      warning: {
        icon: TrendingDown,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
      error: {
        icon: WifiOff,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      },
      info: {
        icon: MessageCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
      default: {
        icon: Bell,
        color: "text-gray-500",
        bgColor: "bg-gray-500/10",
      }
    };

    return configs[type as keyof typeof configs] || configs.default;
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadOnServer();
    setShowNotifications(false);
  };

  const handleNotificationClick = async (notification: any) => {
    console.log("handleNotificationClick_notification",notification)
    // Mark as read when clicked
    if (notification.unread) {
      markNotificationAsReadOnServer(notification.id || notification._id);
    }

    // Handle navigation based on notification type using navigation store
    if (notification.data?.campaignId) {
      setActiveSection('campaigns');
    } else if (notification.data?.deviceId) {
      setActiveSection('devices');
    } else if (notification.type === 'info' && notification.title.includes('SMS')) {
      setActiveSection('inbox');
    } else if (notification.data?.section) {
      // If notification has a specific section defined, use that
      setActiveSection(notification.data.section);
    }

    setShowNotifications(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar now uses navigation store internally */}
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
      <Toaster />
      
      {/* Connection Status Indicator */}
      <div className="fixed top-1 right-4 z-30">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border backdrop-blur-sm",
          isConnected 
            ? "bg-green-500/10 text-green-700 border-green-500/20" 
            : "bg-red-500/10 text-red-700 border-red-500/20"
        )}>
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
            </>
          ) : (
            <>
              <WifiDisconnected className="h-3 w-3" />
              <span>Disconnected</span>
            </>
          )}
        </div>
      </div>
      
      {/* Notification Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          variant="default"
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg relative transition-all duration-300 hover:scale-110 hover:shadow-xl",
            !isConnected && "opacity-70",
            notificationsLoading && "opacity-50"
          )}
          onClick={() => setShowNotifications(!showNotifications)}
          disabled={!isConnected || notificationsLoading}
        >
          {notificationsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Bell className={cn(
              "h-6 w-6 transition-all duration-300",
              showNotifications && "rotate-12 scale-110"
            )} />
          )}
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-xs font-bold text-white flex items-center justify-center shadow-lg border-2 border-background animate-in zoom-in duration-300">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
              <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 animate-ping opacity-75" />
            </>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      {/* Notifications Panel */}
{showNotifications && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
      onClick={() => setShowNotifications(false)}
    />

    {/* Notifications Dropdown */}
    <div className="fixed bottom-24 right-6 w-[440px] bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-2xl border border-border/40 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 max-h-[36rem] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
      {/* Header */}
      <div className="relative p-6 border-b border-border/40 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/25 shadow-inner shadow-primary/20">
              {notificationsLoading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Bell className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Notifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notificationsLoading
                  ? "Syncing your updates..."
                  : unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up 🎉"}
              </p>
            </div>
          </div>
          {!notificationsLoading && unreadCount > 0 && (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-primary-foreground">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {/* <div className="flex px-3 py-2 border-b border-border/30 bg-background/50 backdrop-blur-md">
        {["All", "Unread", "System"].map((tab) => (
          <button
            key={tab}
            className={cn(
              "flex-1 text-sm py-2 rounded-xl transition-all duration-200 font-medium",
              "hover:bg-primary/10 hover:text-primary",
              tab === "All" && "bg-primary/15 text-primary font-semibold shadow-inner"
            )}
          >
            {tab}
          </button>
        ))}
      </div> */}

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
        {notificationsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center animate-in fade-in duration-300">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 mx-auto mb-4 flex items-center justify-center ring-1 ring-border/40 animate-pulse">
              <Bell className="h-10 w-10 opacity-25" />
            </div>
            <p className="font-semibold text-base mb-1">No new notifications</p>
            <p className="text-sm text-muted-foreground">
              {isConnected
                ? "You’ll see updates here as they arrive."
                : "Connect to receive live updates."}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2 animate-in fade-in-50 duration-300">
            {notifications.map((notification, index) => {
              const config = getNotificationConfig(notification.type);
              const IconComponent = config.icon;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer backdrop-blur-sm border border-border/40 shadow-sm",
                    "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:bg-primary/5",
                    notification.unread
                      ? "bg-gradient-to-br from-primary/8 via-primary/5 to-background border-primary/30"
                      : "bg-background/60"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "relative flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner ring-1 ring-border/20",
                        config.bgColor
                      )}
                    >
                      <IconComponent className={cn("h-5 w-5", config.color)} />
                      {notification.unread && (
                        <div className="absolute -top-1 -right-1">
                          <div className="h-3 w-3 rounded-full bg-primary animate-pulse ring-2 ring-background" />
                          <div className="absolute inset-0 h-3 w-3 rounded-full bg-primary animate-ping opacity-70" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-sm leading-tight mb-1",
                          notification.unread
                            ? "text-foreground"
                            : "text-foreground/80"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground/70 font-medium">
                          {formatTime(notification.time || notification.createdAt)}
                        </p>
                        {notification.unread && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold ring-1 ring-primary/20">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Glow border on hover */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-primary/30 transition-all pointer-events-none" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!notificationsLoading && notifications.length > 0 && (
        <div className="p-4 border-t border-border/40 bg-gradient-to-br from-background/80 to-background/50">
          <Button
            variant="ghost"
            className="w-full text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl h-11 gap-2 group"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  </>
)}

    </div>
  );
}

export default function App() {
  return <AppContent />;
}