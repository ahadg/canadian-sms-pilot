import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { settingsAPI } from "@/lib/api/deviceSettings";
import { EjoinAPIService } from "@/lib/api/devices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  // Load devices
  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const data = await EjoinAPIService.getDevices();
      setDevices(data || []);

      // Auto-select first device if none selected
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

  // Load config for selected device
  const loadConfig = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      setLoading(true);
      const data = await settingsAPI.getConfig(deviceId);
      console.log("loadConfig_data",data)
      setConfig(data || config);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // On mount: fetch devices
  useEffect(() => {
    loadDevices();
  }, []);

  // When device changes, fetch config
  useEffect(() => {
    if (selectedDevice?._id || selectedDevice?.id) {
      loadConfig(selectedDevice._id || selectedDevice.id);
    }
  }, [selectedDevice]);

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedDevice) return;
    try {
      setLoading(true);
      await settingsAPI.setConfig(config,selectedDevice._id || selectedDevice.id);
      toast({ title: "Success", description: "Settings updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
        <div className="grid gap-4 max-w-xl">
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

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </div>
  );
}
