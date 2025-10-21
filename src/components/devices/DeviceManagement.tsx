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
  MessageSquare,
  History,
  X,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { EjoinAPIService } from "../../lib/api/devices";
import { authFetch } from "@/lib/api";

interface Device {
  _id: string;
  id: string;
  name: string;
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
  macAddress: string;
  firmwareVersion: string;
  updated_at: string;
  dailyLimit: number;
  ipAddress: string;
}

interface SIMCard {
  _id?: string;
  slotId: number;
  imei: string;
  carrier: string;
  status: "active" | "inactive" | "error";
  signalStrength: number;
  operator: string;
  dailySent: number;
  dailyLimit: number;
  todaySent: number;
  lastResetDate: string;
  lastActivity: string;
  port: string;
  iccid: string;
  imsi: string;
  balance: string;
  inserted: boolean;
  phoneNumber?: string;
  ussdHistory?: USSDCommand[];
  device: Device;
}

interface USSDCommand {
  _id?: string;
  command: string;
  response: string;
  status: "pending" | "success" | "error" | "timeout";
  timestamp: string;
  error?: string;
}

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [simCards, setSimCards] = useState<SIMCard[]>([]);
  const [allSims, setAllSims] = useState<SIMCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [simLimitsDialogOpen, setSimLimitsDialogOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SIMCard | null>(null);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    ipAddress: "",
    port: 80,
    username: "root",
    password: "root",
    location: "",
  });
  const [ussdCommand, setUssdCommand] = useState("");
  const [sendingUssd, setSendingUssd] = useState<string | null>(null);
  const [ussdHistory, setUssdHistory] = useState<any>([]);
  const [selectedSimForHistory, setSelectedSimForHistory] = useState<{ deviceId: string; port: number } | null>(null);
  const [selectedSimForCommand, setSelectedSimForCommand] = useState<{ device: Device; port: number } | null>(null);
  const [quickCommands, setQuickCommands] = useState([
    { name: "Balance", command: "*102#" },
    { name: "Data Balance", command: "*101#" },
    { name: "Minutes", command: "*103#" },
    { name: "My Number", command: "*1#" },
  ]);

  useEffect(() => {
    loadDevices();
    loadAllSims();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceSIMs(selectedDevice);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const data = await EjoinAPIService.getDevices();
      console.log("loadDevices_data", data);
      setDevices(data || [] as any);
      
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

  const loadAllSims = async () => {
    try {
      const response = await authFetch('/api/sims');
      console.log("response",response)
      if (response) {
        setAllSims(response.sims || []);
      }
    } catch (error) {
      console.error('Error loading all SIMs:', error);
      toast.error('Failed to load SIM cards');
    }
  };

  const handleSaveSimLimit = async () => {
    if (!editingSim) return;

    setIsSaving(true);
    try {
      const result = await authFetch(`/api/sims/${editingSim._id}/limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          dailyLimit: dailyLimit
        })
      });

      if (result) {
       // const updatedSim = await result.json();
        
        // Update in allSims
        setAllSims(prev => prev.map(sim => 
          sim._id === editingSim._id ? { ...sim, dailyLimit: dailyLimit } : sim
        ));
        
        // Update in current device SIMs if applicable
        setSimCards(prev => prev.map(sim => 
          sim._id === editingSim._id ? { ...sim, dailyLimit: dailyLimit } : sim
        ));
        
        toast.success('SIM limit updated successfully');
        setSettingsDialogOpen(false);
      } else {
        const error = await result.json();
        toast.error(error.message || 'Failed to update SIM limit');
      }
    } catch (error) {
      console.error('Error saving SIM limit:', error);
      toast.error('Failed to update SIM limit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBulkSimLimits = async (sims: SIMCard[], limit: number) => {
    setIsSaving(true);
    try {
      const result = await authFetch('/api/sims/bulk-limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          simIds: sims.map(sim => sim._id),
          dailyLimit: limit
        })
      });

      if (result) {
        const updatedSims = result
        
        // Update all SIMs
        setAllSims(prev => prev.map(sim => {
          const updatedSim = updatedSims.sims.find((us: SIMCard) => us._id === sim._id);
          return updatedSim ? updatedSim : sim;
        }));
        
        // Update current device SIMs
        setSimCards(prev => prev.map(sim => {
          const updatedSim = updatedSims.sims.find((us: SIMCard) => us._id === sim._id);
          return updatedSim ? updatedSim : sim;
        }));
        
        toast.success(`Updated limits for ${sims.length} SIM cards`);
      } else {
        const error = await result.json();
        toast.error(error.message || 'Failed to update SIM limits');
      }
    } catch (error) {
      console.error('Error saving bulk SIM limits:', error);
      toast.error('Failed to update SIM limits');
    } finally {
      setIsSaving(false);
    }
  };

  const refreshDeviceStatus = async (device: Device) => {
    try {
      console.log("refreshDeviceStatus", device);
      const result = await EjoinAPIService.refreshDevice(device);
      console.log("refreshDeviceStatus_result", result);
      if (result?.success && result?.device) {
        setDevices(prev => prev.map((d: any) => d.id === device.id ? result.device : d));
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
      setSimCards(sims as any);
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
      console.log("handleAddDevice", result);
      if (result.success == true && result.device) {
        // Add to state
        setDevices((prev: any) => [result.device, ...prev]);

        setSelectedDevice(result.device as any)

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

  const handleSendUSSD = async (device: Device, port: number, command: string) => {
    if (!command.trim()) {
      toast.error('Please enter a USSD command');
      return;
    }

    const key = `${device.id}-${port}`;
    setSendingUssd(key);

    try {
      const result = await EjoinAPIService.sendUSSDCommand(device?._id, [{ports: [port], ussd: command, timeout: 60}]);
      console.log("handleSendUSSD_result", result);
      if (result.success) {
        toast.success(`USSD command executed successfully`);
        // Refresh USSD history for this SIM
        //await loadUSSDHistory(device.id, port);
        setSelectedSimForCommand(null);
        setUssdCommand("");
      } else {
        toast.error(`USSD command failed: ${result?.[0]?.resp || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending USSD:', error);
      toast.error('Failed to send USSD command');
    } finally {
      setSendingUssd(null);
    }
  };

  const handleQuickCommand = (command: string) => {
    setUssdCommand(command);
  };

  const loadUSSDHistory = async (deviceId: string, port: number) => {
    try {
      const history = await EjoinAPIService.getUSSDHistory(deviceId, port);
      console.log("history", history);
      const key = `${deviceId}-${port}`;
      setUssdHistory(history?.response.ussdCommands);
    } catch (error) {
      console.error('Error loading USSD history:', error);
    }
  };

  const handleShowHistory = async (device: Device, port: number) => {
    setSelectedSimForHistory({ deviceId: device.id, port });
    await loadUSSDHistory(device._id, port);
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

  const getUSSDStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "timeout":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Timeout</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your Ejoin 512-SIM gateways
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh All
          </Button>
          
          {/* SIM Limits Button */}
          <Button 
            variant="outline" 
            onClick={() => setSimLimitsDialogOpen(true)}
          >
            <IdCard className="h-4 w-4 mr-2" />
            SIM Limits
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
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
          <Card 
            key={device._id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
              selectedDevice?._id === device._id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-gray-300'
            }`}
            onClick={() => setSelectedDevice(device)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className={`p-2 rounded-lg ${
                    device.status === 'online' ? 'bg-green-100' :
                    device.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Router className={`h-5 w-5 ${
                      device.status === 'online' ? 'text-green-600' :
                      device.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <span className="truncate">{device.name}</span>
                </CardTitle>
                {getStatusBadge(device.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">IP Address</span>
                  <div className="font-mono text-xs font-medium">{device.ipAddress}:{device.port}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Location</span>
                  <div className="font-medium truncate">{device.location || 'N/A'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Last Seen</span>
                  <div className="font-mono text-xs font-medium">{device.macAddress}:{device.port}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Firmware Version</span>
                  <div className="font-medium truncate">{device.firmwareVersion || 'N/A'}</div>
                </div>
              </div>
  
              
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Active SIMs</span>
                  <span className="font-semibold text-blue-600">{device.activeSlots}/{device.totalSlots}</span>
                </div>
                <Progress 
                  value={device.totalSlots > 0 ? (device.activeSlots / device.totalSlots) * 100 : 0}
                  className="h-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  // onClick={(e) => {
                  //   e.stopPropagation();
                  //   setSelectedDevice(device);
                  // }}
                  onClick={() => setSimLimitsDialogOpen(true)}
                >
                  <IdCard className="h-4 w-4 mr-2" />
                  SIM Limits
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshDeviceStatus(device);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {devices.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <Router className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No devices added</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first Ejoin gateway device.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Device
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
                    <Label htmlFor="deviceName2">Device Name</Label>
                    <Input 
                      id="deviceName2" 
                      placeholder="Ejoin Gateway 004" 
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ipAddress2">IP Address</Label>
                    <Input 
                      id="ipAddress2" 
                      placeholder="192.168.1.103" 
                      value={newDevice.ipAddress}
                      onChange={(e) => setNewDevice({...newDevice, ipAddress: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="port2">Port</Label>
                    <Input 
                      id="port2" 
                      type="number" 
                      placeholder="80" 
                      value={newDevice.port}
                      onChange={(e) => setNewDevice({...newDevice, port: parseInt(e.target.value) || 80})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username2">Username</Label>
                    <Input 
                      id="username2" 
                      placeholder="root" 
                      value={newDevice.username}
                      onChange={(e) => setNewDevice({...newDevice, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password2">Password</Label>
                    <Input 
                      id="password2" 
                      type="password" 
                      placeholder="root" 
                      value={newDevice.password}
                      onChange={(e) => setNewDevice({...newDevice, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location2">Location</Label>
                    <Input 
                      id="location2" 
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadDeviceSIMs(selectedDevice)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh SIMs
                </Button>
              </div>
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
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simCards.length > 0 ? (
                    simCards.map((sim) => {
                      const simKey = `${selectedDevice._id}-${sim.port}`;
                      const currentUssdHistory = ussdHistory[simKey] || [];
                      const latestCommand = currentUssdHistory[0];
                      
                      return (
                        <TableRow key={`${sim.port}-${sim.slotId}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {sim.port}
                              {latestCommand && (
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    latestCommand.status === 'success' ? 'bg-green-500' :
                                    latestCommand.status === 'error' ? 'bg-red-500' :
                                    latestCommand.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}
                                  title={`Last USSD: ${latestCommand.status}`}
                                />
                              )}
                            </div>
                          </TableCell>
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
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSimForCommand({ device: selectedDevice, port: parseInt(sim.port) })}
                                disabled={!sim.inserted || sim.status !== 'active'}
                                className="h-8 w-8 p-0"
                                title="Send USSD Command"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowHistory(selectedDevice, parseInt(sim.port))}
                                className="h-8 w-8 p-0"
                                title="View USSD History"
                              >
                                <History className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                          <span className="text-muted-foreground">
                            No SIM card data available. Click "Refresh SIMs" to load device status.
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

      {/* SIM Limits Dialog */}
      <Dialog open={simLimitsDialogOpen} onOpenChange={setSimLimitsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              SIM Card Limits Management
            </DialogTitle>
            <DialogDescription>
              Set daily SMS limits for all SIM cards across your devices
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Bulk Actions */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="bulkLimit">Set Limit for All Active SIMs</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="bulkLimit"
                    type="number"
                    placeholder="Enter daily limit"
                    className="flex-1"
                    defaultValue={300}
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('bulkLimit') as HTMLInputElement;
                      const limit = parseInt(input.value) || 100;
                      const activeSims = allSims.filter(sim => sim.inserted && sim.status === 'active');
                      handleSaveBulkSimLimits(activeSims, limit);
                    }}
                  >
                    Apply to All Active
                  </Button>
                </div>
              </div>
            </div>

            {/* SIMs Table */}
            <div className="border rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-50 sticky top-0">
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Today's Usage</TableHead>
                      <TableHead>Daily Limit</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSims.map((sim) => {
                      console.log("sim_devices",devices)
                      console.log("sim",sim)
                      const device = devices.find(d => d._id === sim.device?._id);
                      const usagePercentage = sim.dailyLimit > 0 ? (sim.todaySent / sim.dailyLimit) * 100 : 0;
                      
                      return (
                        <TableRow key={sim._id}>
                          <TableCell className="font-medium">
                            {device?.name || 'Unknown Device'}
                          </TableCell>
                          <TableCell>{sim.port}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {sim.phoneNumber || 'N/A'}
                          </TableCell>
                          <TableCell>{sim.operator}</TableCell>
                          <TableCell>
                            {getSIMStatusBadge(sim.status, sim.inserted)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{sim.todaySent}/{sim.dailyLimit}</span>
                                <span>{Math.round(usagePercentage)}%</span>
                              </div>
                              <Progress 
                                value={usagePercentage} 
                                className={`h-1 ${
                                  usagePercentage >= 90 ? 'bg-red-500' :
                                  usagePercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={sim.dailyLimit}
                                onChange={(e) => {
                                  const newLimit = parseInt(e.target.value) || 0;
                                  setAllSims(prev => prev.map(s => 
                                    s._id === sim._id ? { ...s, dailyLimit: newLimit } : s
                                  ));
                                }}
                                className="w-20 h-8"
                                min="0"
                                max="10000"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingSim(sim);
                                setDailyLimit(sim.dailyLimit);
                                setSettingsDialogOpen(true);
                              }}
                            >
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual SIM Limit Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              SIM Card Settings
            </DialogTitle>
            <DialogDescription>
              Configure daily SMS limit for {editingSim?.phoneNumber || `Port ${editingSim?.port}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="dailyLimit">Daily SMS Limit</Label>
              <Input
                id="dailyLimit"
                type="number"
                placeholder="Enter daily SMS limit"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                min="0"
                max="10000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of SMS messages allowed per day
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSettingsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSimLimit}
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* USSD Command Dialog */}
      <Dialog open={!!selectedSimForCommand} onOpenChange={() => {
        setSelectedSimForCommand(null);
        setUssdCommand("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send USSD Command
            </DialogTitle>
            <DialogDescription>
              Send USSD command to port {selectedSimForCommand?.port} on {selectedSimForCommand?.device.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ussdCommand">USSD Command</Label>
              <Input
                id="ussdCommand"
                placeholder="Enter USSD command (e.g., *102#)"
                value={ussdCommand}
                onChange={(e) => setUssdCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedSimForCommand) {
                    handleSendUSSD(selectedSimForCommand.device, selectedSimForCommand.port, ussdCommand);
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quick Commands</Label>
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((cmd, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-3 py-1 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors"
                    onClick={() => setUssdCommand(cmd.command)}
                  >
                    {cmd.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                if (selectedSimForCommand) {
                  handleSendUSSD(selectedSimForCommand.device, selectedSimForCommand.port, ussdCommand);
                }
              }}
              disabled={!ussdCommand.trim() || sendingUssd === `${selectedSimForCommand?.device.id}-${selectedSimForCommand?.port}`}
              className="w-full"
            >
              {sendingUssd === `${selectedSimForCommand?.device.id}-${selectedSimForCommand?.port}` ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Command
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* USSD History Dialog */}
      <Dialog open={!!selectedSimForHistory} onOpenChange={() => setSelectedSimForHistory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              USSD Command History
            </DialogTitle>
            <DialogDescription>
              Port {selectedSimForHistory?.port} command history
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto max-h-[60vh]">
            {selectedSimForHistory && ussdHistory.length > 0 ? (
              ussdHistory.map((cmd: USSDCommand) => (
                <Card key={cmd._id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {cmd.command}
                        </Badge>
                        {getUSSDStatusBadge(cmd.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(cmd.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {cmd.response && cmd.response.trim() !== "" && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Response:</p>
                        <p className="text-sm whitespace-pre-wrap">{cmd.response}</p>
                      </div>
                    )}

                    {cmd.error && (
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="text-xs font-semibold text-red-600 mb-1">Error:</p>
                        <p className="text-sm text-red-700">{cmd.error}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">No USSD command history available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}