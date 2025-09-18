import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Router,
  Plus,
  Signal,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  name: string;
  ip_address: string;
  status: "online" | "offline" | "warning";
  total_slots: number;
  active_slots: number;
  location: string;
  last_seen: string;
  daily_sent: number;
  daily_limit: number;
  temperature: number;
  uptime: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface SIMCard {
  slotId: number;
  imei: string;
  carrier: string;
  status: "active" | "inactive" | "error";
  signalStrength: number;
  dailySent: number;
  dailyLimit: number;
  lastActivity: string;
}

const mockDevices: Device[] = [];

const mockSIMCards: SIMCard[] = [
  { slotId: 1, imei: "861234567890123", carrier: "Rogers", status: "active", signalStrength: 85, dailySent: 245, dailyLimit: 300, lastActivity: "2 min ago" },
  { slotId: 2, imei: "861234567890124", carrier: "Bell", status: "active", signalStrength: 92, dailySent: 189, dailyLimit: 300, lastActivity: "5 min ago" },
  { slotId: 3, imei: "861234567890125", carrier: "Telus", status: "error", signalStrength: 23, dailySent: 0, dailyLimit: 300, lastActivity: "45 min ago" },
  { slotId: 4, imei: "861234567890126", carrier: "Rogers", status: "active", signalStrength: 78, dailySent: 267, dailyLimit: 300, lastActivity: "1 min ago" },
  { slotId: 5, imei: "861234567890127", carrier: "Bell", status: "inactive", signalStrength: 0, dailySent: 0, dailyLimit: 300, lastActivity: "2 hours ago" },
];

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    location: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

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

  const getSIMStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Wifi className="h-4 w-4 text-success" />;
      case "inactive":
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const fetchDevices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevices((data || []) as Device[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("devices").insert({
        user_id: user.id,
        name: formData.name,
        ip_address: formData.ipAddress,
        location: formData.location,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Device added successfully",
      });

      setFormData({ name: "", ipAddress: "", location: "" });
      setDialogOpen(false);
      fetchDevices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your Ejoin 512-SIM gateways
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary shadow-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Ejoin Gateway</DialogTitle>
                <DialogDescription>
                  Connect a new Ejoin 512-SIM gateway to your platform
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input 
                    id="deviceName" 
                    placeholder="Ejoin Gateway 004"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input 
                    id="ipAddress" 
                    placeholder="192.168.1.103"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="Calgary, AB"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Connect Device</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="text-center py-8">Loading devices...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
          <Card key={device.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Router className="h-5 w-5" />
                  {device.name}
                </CardTitle>
                {getStatusBadge(device.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">IP Address:</span>
                  <div className="font-medium">{device.ip_address}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div className="font-medium">{device.location}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Temperature:</span>
                  <div className="font-medium">{device.temperature}°C</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Uptime:</span>
                  <div className="font-medium">{device.uptime}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active SIMs</span>
                  <span>{device.active_slots}/{device.total_slots}</span>
                </div>
                <Progress value={(device.active_slots / device.total_slots) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Usage</span>
                  <span>{device.daily_sent.toLocaleString()}/{device.daily_limit.toLocaleString()}</span>
                </div>
                <Progress value={(device.daily_sent / device.daily_limit) * 100} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Activity className="h-4 w-4 mr-2" />
                  Monitor
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Detailed SIM Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            SIM Card Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={devices[0]?.id || ""}>
            <TabsList className="grid w-full grid-cols-3">
              {devices.slice(0, 3).map((device) => (
                <TabsTrigger key={device.id} value={device.id}>
                  {device.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {devices.map((device) => (
              <TabsContent key={device.id} value={device.id}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Slot</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signal</TableHead>
                        <TableHead>Daily Usage</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSIMCards.slice(0, 5).map((sim) => (
                        <TableRow key={sim.slotId}>
                          <TableCell className="font-medium">#{sim.slotId}</TableCell>
                          <TableCell className="font-mono text-xs">{sim.imei}</TableCell>
                          <TableCell>{sim.carrier}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSIMStatusIcon(sim.status)}
                              <span className="capitalize">{sim.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Signal className="h-3 w-3" />
                              {sim.signalStrength}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {sim.dailySent}/{sim.dailyLimit}
                              </div>
                              <Progress 
                                value={(sim.dailySent / sim.dailyLimit) * 100} 
                                className="h-1 w-16"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {sim.lastActivity}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}