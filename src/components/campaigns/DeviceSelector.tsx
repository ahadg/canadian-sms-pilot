// components/DeviceSelector.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, Settings } from 'lucide-react';
import { useCampaigns, type Device } from '@/hooks/useCampaigns';

interface DeviceSelectorProps {
  onDeviceSelect: (device: Device) => void;
  selectedDevice?: Device;
}

export function DeviceSelector({ onDeviceSelect, selectedDevice }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchDevices } = useCampaigns();

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const deviceList = await fetchDevices();
        setDevices(deviceList);
      } catch (error) {
        console.error('Error loading devices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, [fetchDevices]);

  const getStatusIcon = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Offline</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Select Device</h3>
      {devices?.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            No devices configured. Please add devices in the settings.
          </CardContent>
        </Card>
      ) : (
        devices?.map((device) => (
          <Card 
            key={device.id}
            className={`cursor-pointer transition-colors ${
              selectedDevice?.id === device.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => onDeviceSelect(device)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(device.status)}
                  <div>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.ip_address}:{device.port}
                    </div>
                  </div>
                </div>
                {getStatusBadge(device.status)}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}