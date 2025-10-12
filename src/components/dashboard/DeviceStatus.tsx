import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Router,
  Signal,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";

interface DeviceData {
  _id: string;
  name: string;
  status: "online" | "offline" | "warning" | "connected" | "disconnected";
  totalSlots: number;
  activeSlots: number;
  location?: string;
  lastSeen: string;
  connectionType?: string;
  simSlots?: Array<{
    id: string;
    status: string;
    operator?: string;
    signal?: number;
  }>;
  dailyUsage?: {
    sent: number;
    limit: number;
  };
}

interface DeviceStatusProps {
  devices?: DeviceData[];
}


export function DeviceStatus({ devices: propDevices }: DeviceStatusProps) {
  const [devices, setDevices] = useState<DeviceData[]>(propDevices || []);
  const [loading, setLoading] = useState(!propDevices);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  console.log("devices",devices)
  // Fetch devices if not provided via props
  useEffect(() => {
    if (propDevices) {
      setDevices(propDevices);
      return;
    }
    
    fetchDevices();
  }, [propDevices]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await authFetch('/api/dashboard/devices');
      console.log("fetchDevices",data)
      
      if (data.code === 200) {
        setDevices(data.data.devices || []);
        setLastUpdated(new Date());
      } else {
        // Fallback to mock data if API fails
        setDevices([]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      // Fallback to mock data on error
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status: string): "online" | "offline" | "warning" => {
    const onlineStatuses = ['online', 'connected', 'active'];
    const warningStatuses = ['warning', 'degraded', 'unstable'];
    
    if (onlineStatuses.includes(status?.toLowerCase())) return 'online';
    if (warningStatuses.includes(status?.toLowerCase())) return 'warning';
    return 'offline';
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    
    switch (normalizedStatus) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "offline":
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    
    switch (normalizedStatus) {
      case "online":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Online
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Warning
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            Offline
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    if (!lastSeen) return 'Never';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const getLocation = (device: DeviceData) => {
    return device.location || device.connectionType || 'Unknown Location';
  };

  const getDailyUsage = (device: DeviceData) => {
    // If device has dailyUsage, use it
    if (device.dailyUsage) {
      return device.dailyUsage;
    }
    
    // Otherwise, create a simulated usage based on device status
    const baseLimit = 15000;
    const multiplier = device.status === 'online' ? 0.8 : device.status === 'warning' ? 0.6 : 0;
    
    return {
      sent: Math.floor(baseLimit * multiplier),
      limit: baseLimit
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="h-5 w-5" />
            Device Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-2 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Router className="h-5 w-5" />
          Device Status
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDevices}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Router className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No devices found</p>
            <Button variant="outline" size="sm" className="mt-2">
              Add Device
            </Button>
          </div>
        ) : (
          devices.map((device) => {
            const usage = getDailyUsage(device);
            const usagePercentage = usage.limit > 0 ? (usage.sent / usage.limit) * 100 : 0;
            
            return (
              <div
                key={device._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(device.status)}
                  <div>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {device.activeSlots}/{device.totalSlots} SIMs
                      </span>
                      <span className="flex items-center gap-1">
                        <Signal className="h-3 w-3" />
                        {getLocation(device)}
                      </span>
                      <span className="text-xs">
                        Last seen: {formatLastSeen(device.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* <div className="text-right">
                    <div className="text-sm font-medium">
                      {usage.sent.toLocaleString()} / {usage.limit.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">SMS today</div>
                    <Progress 
                      value={usagePercentage} 
                      className="w-24 h-2 mt-1"
                    />
                  </div> */}
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(device.status)}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Summary Stats */}
        {devices.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <div>
              Total: {devices.length} devices •{' '}
              Online: {devices.filter(d => normalizeStatus(d.status) === 'online').length} •{' '}
              Warning: {devices.filter(d => normalizeStatus(d.status) === 'warning').length} •{' '}
              Offline: {devices.filter(d => normalizeStatus(d.status) === 'offline').length}
            </div>
            <div>
              Total SIMs: {devices.reduce((sum, device) => sum + device.activeSlots, 0)} /{' '}
              {devices.reduce((sum, device) => sum + device.totalSlots, 0)} active
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}