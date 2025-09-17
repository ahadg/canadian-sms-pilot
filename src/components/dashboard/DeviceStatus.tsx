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
} from "lucide-react";

interface DeviceData {
  id: string;
  name: string;
  status: "online" | "offline" | "warning";
  totalSlots: number;
  activeSlots: number;
  location: string;
  lastSeen: string;
  dailyUsage: {
    sent: number;
    limit: number;
  };
}

interface DeviceStatusProps {
  devices: DeviceData[];
}

const mockDevices: DeviceData[] = [
  {
    id: "ejoin-001",
    name: "Ejoin Gateway 001",
    status: "online",
    totalSlots: 512,
    activeSlots: 487,
    location: "Toronto, ON",
    lastSeen: "2 minutes ago",
    dailyUsage: { sent: 12450, limit: 15000 },
  },
  {
    id: "ejoin-002", 
    name: "Ejoin Gateway 002",
    status: "warning",
    totalSlots: 512,
    activeSlots: 356,
    location: "Vancouver, BC",
    lastSeen: "15 minutes ago",
    dailyUsage: { sent: 8920, limit: 12000 },
  },
  {
    id: "ejoin-003",
    name: "Ejoin Gateway 003", 
    status: "offline",
    totalSlots: 512,
    activeSlots: 0,
    location: "Montreal, QC",
    lastSeen: "2 hours ago",
    dailyUsage: { sent: 0, limit: 10000 },
  },
];

export function DeviceStatus({ devices = mockDevices }: DeviceStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "offline":
        return <Clock className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Online</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Warning</Badge>;
      case "offline":
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Router className="h-5 w-5" />
          Device Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
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
                    {device.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {device.dailyUsage.sent.toLocaleString()} / {device.dailyUsage.limit.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">SMS today</div>
                <Progress 
                  value={(device.dailyUsage.sent / device.dailyUsage.limit) * 100} 
                  className="w-24 h-2 mt-1"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusBadge(device.status)}
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}