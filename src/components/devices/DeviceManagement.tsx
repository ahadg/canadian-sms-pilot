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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Import your Supabase client
import { EjoinAPIService } from "../../lib/api/devices";

interface Device {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  status: "online" | "offline" | "warning";
  totalSlots: number;
  activeSlots: number;
  location: string;
  last_seen: string;
  daily_usage: { sent: number; limit: number };
  temperature: number;
  uptime: string;
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
  port: string;
  iccid: string;
  imsi: string;
  balance: string;
  inserted: boolean;
}





export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [simCards, setSimCards] = useState<SIMCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    ipAddress: "",
    port: 80,
    username: "root",
    password: "root",
    location: "",
  });

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceSIMs(selectedDevice);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const data = await EjoinAPIService.getDevices()
      console.log("loadDevices_data",data)
      setDevices(data || []);
      
      // Auto-select first device if none selected
      if (data && data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDeviceStatus = async (device: Device) => {
    try {
      console.log("refreshDeviceStatus",device)
      const result = await EjoinAPIService.refreshDevice(device);
      console.log("refreshDeviceStatus_result",result)
      if (result?.success && result?.device) {
        setDevices(prev => prev.map((d : any) => d.id === device.id ? result.device : d));
        toast.success(`${device.name} refreshed successfully`);
        return result.device;
      } else {
        toast.warning(result.message || `${device.name} is not responding`);
        // Update device status to offline in local state
        const updatedDevice = {
          ...device,
          status: "offline" as const,
          last_seen: new Date().toISOString(),
        };
        
        setDevices(prev => prev.map(d => d.id === device.id ? updatedDevice : d));
        return updatedDevice;
      }
    } catch (error) {
      console.error('Error refreshing device status:', error);
      toast.error(`Failed to refresh ${device.name}`);
      return device;
    }
  };

  const loadDeviceSIMs = async (device: any) => {
    try {
      setSimCards([]); // Clear existing data
      const sims = await EjoinAPIService.getSIMCards(device);
      setSimCards(sims);
      console.log(`Loaded ${sims.length} SIM cards for device ${device.name}`);
    } catch (error) {
      console.error('Error loading SIM cards:', error);
      toast.error('Failed to load SIM cards');
      setSimCards([]);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const promises = devices.map(device => refreshDeviceStatus(device));
      await Promise.all(promises);
      toast.success('All devices refreshed');
    } catch (error) {
      console.error('Error refreshing devices:', error);
      toast.error('Failed to refresh some devices');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddDevice = async () => {
    try {
      // Validate input
      if (!newDevice.name || !newDevice.ipAddress) {
        toast.error('Name and IP address are required');
        return;
      }

      const result = await EjoinAPIService.addDevice(newDevice);
      console.log("handleAddDevice",result)
      if (result.success && result.device) {
        // Add to state
        setDevices((prev : any) => [result.device, ...prev]);

        // Reset form
        setNewDevice({
          name: "",
          ipAddress: "",
          port: 80,
          username: "root",
          password: "root",
          location: "",
        });

        toast.success('Device added successfully');
      } else {
        toast.error(result?.message || 'Failed to add device');
      }
    } catch (error: any) {
      console.error('Error adding device:', error);
      toast.error(error.message || 'Failed to add device');
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case "offline":
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSIMStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSIMStatusBadge = (status: string, inserted: boolean) => {
    if (!inserted) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">No SIM</Badge>;
    }
    
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Inactive</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading devices...</span>
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh All
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input 
                    id="deviceName" 
                    placeholder="Ejoin Gateway 004" 
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input 
                    id="ipAddress" 
                    placeholder="192.168.1.103" 
                    value={newDevice.ipAddress}
                    onChange={(e) => setNewDevice({...newDevice, ipAddress: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input 
                    id="port" 
                    type="number" 
                    placeholder="80" 
                    value={newDevice.port}
                    onChange={(e) => setNewDevice({...newDevice, port: parseInt(e.target.value) || 80})}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="root" 
                    value={newDevice.username}
                    onChange={(e) => setNewDevice({...newDevice, username: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="root" 
                    value={newDevice.password}
                    onChange={(e) => setNewDevice({...newDevice, password: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="Calgary, AB" 
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddDevice} className="w-full">
                  Connect Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Device Grid */}
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
                  <div className="font-medium">{device.ip_address}:{device.port}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div className="font-medium">{device.location || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Seen:</span>
                  <div className="font-medium">{new Date(device.last_seen).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Username:</span>
                  <div className="font-medium">{device.username}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active SIMs</span>
                  <span>{device.activeSlots}/{device.totalSlots}</span>
                </div>
                <Progress value={device.totalSlots > 0 ? (device.activeSlots / device.totalSlots) * 100 : 0} />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setSelectedDevice(device)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Monitor
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refreshDeviceStatus(device)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {devices.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Router className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No devices added</h3>
            <p className="text-muted-foreground">
              Get started by adding your first Ejoin gateway device.
            </p>
          </div>
        )}
      </div>

      {/* Detailed SIM Management */}
      {devices.length > 0 && selectedDevice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                SIM Card Management - {selectedDevice.name}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadDeviceSIMs(selectedDevice)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh SIMs
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Port</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>ICCID</TableHead>
                    <TableHead>IMSI</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simCards.length > 0 ? (
                    simCards.map((sim) => (
                      <TableRow key={`${sim.port}-${sim.slotId}`}>
                        <TableCell className="font-medium">{sim.port}</TableCell>
                        <TableCell className="font-mono text-xs">{sim.imei}</TableCell>
                        <TableCell>{sim.carrier}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSIMStatusIcon(sim.status)}
                            {getSIMStatusBadge(sim.status, sim.inserted)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Signal className="h-3 w-3" />
                            {sim.signalStrength}%
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {sim.iccid}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {sim.imsi}
                        </TableCell>
                        <TableCell>
                          ${sim.balance}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                          <span className="text-muted-foreground">
                            No SIM card data available. Click "Monitor" to load device status.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}