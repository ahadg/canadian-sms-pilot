import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { settingsAPI } from "@/lib/api/deviceSettings";
import { EjoinAPIService } from "@/lib/api/devices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingStatusReport, setLoadingStatusReport] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const [config, setConfig] = useState({
    sms_status_url: "",
    sms_status_max: 100,
    sms_status_period: 30,
    recv_sms_url: "",
    recv_sms_max: 1,
    recv_sms_period: 30,
  });

  const [statusReport, setStatusReport] = useState({
    enable: false,
    url: "",
    period: 60,
  });

  // Load devices
  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const data = await EjoinAPIService.getDevices();
      setDevices(data || []);
      if (data && data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]);
      }
    } catch (error: any) {
      console.error("Error loading devices:", error);
      toast({ title: "Error", description: "Failed to load devices", variant: "destructive" });
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Load main config
  const loadConfig = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      setLoading(true);
      const data = await settingsAPI.getConfig(deviceId);
      setConfig(data || config);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Load status report config
  const loadStatusReport = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      setLoadingStatusReport(true);
      const data = await settingsAPI.getstatusReport({}, deviceId);
      setStatusReport(data || statusReport);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingStatusReport(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice?._id || selectedDevice?.id) {
      const deviceId = selectedDevice._id || selectedDevice.id;
      loadConfig(deviceId);
      loadStatusReport(deviceId);
    }
  }, [selectedDevice]);

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleStatusChange = (key: string, value: any) => {
    setStatusReport((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    if (!selectedDevice) return;
    try {
      setLoading(true);
      await settingsAPI.setConfig(config, selectedDevice._id || selectedDevice.id);
      toast({ title: "Success", description: "SMS & Receive Settings saved successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatusReport = async () => {
    if (!selectedDevice) return;
    try {
      setLoadingStatusReport(true);
      await settingsAPI.setStatusReport(statusReport, selectedDevice._id || selectedDevice.id);
      toast({ title: "Success", description: "Status Report settings saved successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingStatusReport(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Device Selector */}
      <div className="mb-6 max-w-xl">
        <label className="block mb-2">Select Device</label>
        <Select
          value={selectedDevice?._id || selectedDevice?.id || ""}
          onValueChange={(val) => {
            const dev = devices.find((d) => d._id === val || d.id === val);
            setSelectedDevice(dev || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingDevices ? "Loading devices..." : "Choose a device"} />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d._id || d.id} value={d._id || d.id}>
                {d.name || d.ipAddress || `Device ${d._id || d.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Config Form */}
      {selectedDevice && (
        <div className="grid gap-6 max-w-xl">
          {/* Status Report Server Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Status Report Server</h3>

            <div className="flex items-center space-x-2">
              <Switch
                checked={statusReport.enable}
                onCheckedChange={(checked) => handleStatusChange("enable", checked)}
              />
              <Label>Enable Status Reporting</Label>
            </div>

            <label>
              Status Report URL
              <Input
                value={statusReport.url}
                onChange={(e) => handleStatusChange("url", e.target.value)}
                placeholder="http://host:port/path"
              />
            </label>

            <label>
              Status Report Period (seconds)
              <Input
                type="number"
                value={statusReport.period}
                onChange={(e) => handleStatusChange("period", Number(e.target.value))}
              />
            </label>

            <Button onClick={handleSaveStatusReport} disabled={loadingStatusReport}>
              {loadingStatusReport ? "Saving..." : "Save Status Report Settings"}
            </Button>
          </div>

          {/* SMS Status Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">SMS Status</h3>

            <label>
              SMS Status URL
              <Input
                value={config.sms_status_url}
                onChange={(e) => handleChange("sms_status_url", e.target.value)}
              />
            </label>
            <label>
              SMS Status Max
              <Input
                type="number"
                value={config.sms_status_max}
                onChange={(e) => handleChange("sms_status_max", Number(e.target.value))}
              />
            </label>
            <label>
              SMS Status Period
              <Input
                type="number"
                value={config.sms_status_period}
                onChange={(e) => handleChange("sms_status_period", Number(e.target.value))}
              />
            </label>
          </div>

          {/* Receive SMS Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Receive SMS</h3>

            <label>
              Receive SMS URL
              <Input
                value={config.recv_sms_url}
                onChange={(e) => handleChange("recv_sms_url", e.target.value)}
              />
            </label>
            <label>
              Receive SMS Max
              <Input
                type="number"
                value={config.recv_sms_max}
                onChange={(e) => handleChange("recv_sms_max", Number(e.target.value))}
              />
            </label>
            <label>
              Receive SMS Period
              <Input
                type="number"
                value={config.recv_sms_period}
                onChange={(e) => handleChange("recv_sms_period", Number(e.target.value))}
              />
            </label>

            <Button onClick={handleSaveConfig} disabled={loading}>
              {loading ? "Saving..." : "Save SMS Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
