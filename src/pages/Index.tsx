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
  WifiOff as WifiDisconnected
} from "lucide-react";

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { user, isAuthenticated, loading, checkAuth } = useAuthStore();
  const { 
    socket, 
    isConnected, 
    connect, 
    disconnect, 
    notifications, 
    //markAllAsRead,
    markNotificationAsRead 
  } = useSocketStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

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

  // Get unread count from socket notifications
  const unreadCount = notifications.filter(n => n.unread).length;

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

  const handleMarkAllAsRead = () => {
    //markAllAsRead();
    setShowNotifications(false);
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (notification.unread) {
      markNotificationAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.data?.campaignId) {
      setActiveSection('campaigns');
    } else if (notification.data?.deviceId) {
      setActiveSection('devices');
    } else if (notification.type === 'info' && notification.title.includes('Message')) {
      setActiveSection('inbox');
    }

    setShowNotifications(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
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
              {/* <span>Connected</span> */}
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
            !isConnected && "opacity-70"
          )}
          onClick={() => setShowNotifications(!showNotifications)}
          disabled={!isConnected}
        >
          <Bell className={cn(
            "h-6 w-6 transition-all duration-300",
            showNotifications && "rotate-12 scale-110"
          )} />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-xs font-bold text-white flex items-center justify-center shadow-lg border-2 border-background animate-in zoom-in duration-300">
                {unreadCount}
              </span>
              <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 animate-ping opacity-75" />
            </>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setShowNotifications(false)}
          />
          
          {/* Notifications Dropdown */}
          <div className="fixed bottom-24 right-6 w-[420px] bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl z-50 max-h-[36rem] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Header with Gradient */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Notifications</h3>
                    {unreadCount > 0 ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        All caught up
                      </p>
                    )}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-primary-foreground">{unreadCount}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
              {notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 mx-auto mb-4 flex items-center justify-center ring-1 ring-border/50">
                    <Bell className="h-10 w-10 opacity-20" />
                  </div>
                  <p className="font-semibold text-base mb-2">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected 
                      ? "No new notifications at the moment" 
                      : "Connect to receive real-time notifications"
                    }
                  </p>
                </div>
              ) : (
                <div className="p-3">
                  {notifications.map((notification, index) => {
                    const config = getNotificationConfig(notification.type);
                    const IconComponent = config.icon;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "group relative p-4 rounded-2xl mb-2.5 last:mb-0 transition-all duration-300 cursor-pointer",
                          "hover:bg-accent/50 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5",
                          notification.unread 
                            ? "bg-gradient-to-br from-primary/8 via-primary/5 to-background border border-primary/20 shadow-sm" 
                            : "hover:bg-accent/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ 
                          animationDelay: `${index * 75}ms`,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon with colored background */}
                          <div className={cn(
                            "relative flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ring-1 ring-border/20 shadow-sm transition-transform duration-300 group-hover:scale-110",
                            config.bgColor
                          )}>
                            <IconComponent className={cn("h-5 w-5", config.color)} />
                            {notification.unread && (
                              <div className="absolute -top-1 -right-1">
                                <div className="h-3 w-3 rounded-full bg-primary animate-pulse ring-2 ring-background" />
                                <div className="absolute inset-0 h-3 w-3 rounded-full bg-primary animate-ping opacity-75" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className={cn(
                                "font-bold text-sm leading-tight",
                                notification.unread ? "text-foreground" : "text-foreground/80"
                              )}>
                                {notification.title}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground/60 font-medium">
                                {formatTime(notification.time)}
                              </p>
                              {notification.unread && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold ring-1 ring-primary/20">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Subtle hover border effect */}
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-primary/30 transition-all pointer-events-none" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer with action button */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-border/50 bg-gradient-to-br from-background to-background/50">
                <Button
                  variant="ghost"
                  className="w-full text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl h-11 gap-2 group"
                  onClick={handleMarkAllAsRead}
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