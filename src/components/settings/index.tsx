import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { settingsAPI } from "@/lib/api/deviceSettings";
import { authFetch } from "@/lib/api";
import { EjoinAPIService } from "@/lib/api/devices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";

type BillingSubscription = {
  provider: string;
  status: string;
  isSubscribed: boolean;
  productName?: string | null;
  variantName?: string | null;
  renewsAt?: string | null;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  customerPortalUrl?: string | null;
  updatePaymentMethodUrl?: string | null;
};

export function Settings() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [loadingStatusReport, setLoadingStatusReport] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null);

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

  const loadBillingSubscription = async () => {
    if (!isAdmin) return;

    try {
      setIsLoadingBilling(true);
      const response = await authFetch<{
        configured: boolean;
        subscription: BillingSubscription;
      }>("/api/billing/subscription");

      setBillingConfigured(Boolean(response.data?.configured));
      setBillingSubscription(response.data?.subscription || null);
    } catch (error: any) {
      console.error("Error loading billing subscription:", error);
      toast({ title: "Error", description: error.message || "Failed to load billing subscription", variant: "destructive" });
    } finally {
      setIsLoadingBilling(false);
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
    if (isAdmin) {
      loadBillingSubscription();
    }
  }, [isAdmin]);

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

  const handleStartSubscription = async () => {
    try {
      setIsOpeningCheckout(true);
      const response = await authFetch<{ checkoutUrl: string }>("/api/billing/checkout", {
        method: "POST",
      });

      const checkoutUrl = response.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Checkout URL was not returned.");
      }

      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to open checkout", variant: "destructive" });
    } finally {
      setIsOpeningCheckout(false);
    }
  };

  const billingStatusLabel = billingSubscription?.status
    ? billingSubscription.status.replace(/_/g, " ")
    : "inactive";

  const planName = billingSubscription?.variantName || billingSubscription?.productName || "Admin Monthly";

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {isAdmin && (
        <div className="mb-6 max-w-3xl space-y-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Admin Billing</h2>
              <p className="mt-1 text-sm text-slate-600">
                Manage the monthly Lemon Squeezy subscription for this admin account.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium capitalize text-white">
              {billingStatusLabel}
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Plan</div>
              <div className="mt-1 font-medium text-slate-900">{planName}</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Renews</div>
              <div className="mt-1 font-medium text-slate-900">
                {billingSubscription?.renewsAt ? new Date(billingSubscription.renewsAt).toLocaleDateString() : "Not scheduled"}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Ends</div>
              <div className="mt-1 font-medium text-slate-900">
                {billingSubscription?.endsAt ? new Date(billingSubscription.endsAt).toLocaleDateString() : "Active"}
              </div>
            </div>
          </div>

          {!billingConfigured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Lemon Squeezy is not fully configured yet. Add the backend env vars before starting checkout.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleStartSubscription}
              disabled={!billingConfigured || isOpeningCheckout}
            >
              {isOpeningCheckout ? "Opening checkout..." : billingSubscription?.isSubscribed ? "Update Subscription" : "Start Monthly Subscription"}
            </Button>

            <Button
              variant="outline"
              onClick={loadBillingSubscription}
              disabled={isLoadingBilling}
            >
              {isLoadingBilling ? "Refreshing..." : "Refresh Billing"}
            </Button>

            {billingSubscription?.customerPortalUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(billingSubscription.customerPortalUrl!, "_blank", "noopener,noreferrer")}
              >
                Open Billing Portal
              </Button>
            )}

            {billingSubscription?.updatePaymentMethodUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(billingSubscription.updatePaymentMethodUrl!, "_blank", "noopener,noreferrer")}
              >
                Update Payment Method
              </Button>
            )}
          </div>
        </div>
      )}

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
