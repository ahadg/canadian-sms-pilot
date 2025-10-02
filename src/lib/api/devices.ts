import { authFetch, deviceAPI } from "@/lib/api";

interface DeviceStatus {
  type: string;
  seq: number;
  expires: number;
  mac: string;
  ip: string;
  ver?: string;
  "max-ports": number;
  "max-slot": number;
  status: PortStatus[];
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

interface Device {
  _id: string;
  id: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
  status: "online" | "offline" | "warning";
  totalSlots: number;
  activeSlots: number;
  location: string;
  lastSeen: string;
  dailySent: number;
  dailyLimit: number;
  temperature: number;
  uptime: string;
  createdAt: string;
  updatedAt: string;
}

interface PortStatus {
  port: string;
  sim: string;
  seq: number;
  st: number;
  imei: string;
  active: number;
  inserted: number;
  slot_active: number;
  led: number;
  network: number;
  iccid?: string;
  imsi?: string;
  sn?: string;
  opr?: string;
  bal?: string;
  sig?: number;
}

// API Service Functions - Updated to use backend routes
export class EjoinAPIService {
  // Get device status - uses the correct backend endpoint
  static async getDeviceStatus(device: Device): Promise<DeviceStatus | null> {
    try {
      console.log("device",device)
      const response = await authFetch(`/api/ejoin/goip_get_status?device_id=${device._id}`);
      console.log("getDeviceStatus response:", response);
      return response;
    } catch (error) {
      console.error('Error fetching device status:', error);
      return null;
    }
  }

  static async getDevices(): Promise<DeviceStatus | null> {
    try {
      const response = await deviceAPI.getAll();;
      console.log("getDevices response:", response);
      return response.data?.devices;
    } catch (error) {
      console.error('Error fetching device status:', error);
      return null;
    }
  }

  // Get SIM cards - using the correct endpoint and fixed data mapping
  static async getSIMCards(device: Device): Promise<SIMCard[]> {
    try {
      const statusData = await EjoinAPIService.getDeviceStatus(device);
      console.log("statusData", statusData);
      
      if (!statusData || !statusData.status || !Array.isArray(statusData.status)) {
        console.error('Invalid status data received');
        return [];
      }

      // Transform the API response to match our SIMCard interface
      return statusData.status.map((port: PortStatus, index: number) => ({
        slotId: index + 1,
        port: port.port || `${index + 1}`,
        imei: port.imei || 'N/A',
        carrier: port.opr || 'Unknown',
        status: EjoinAPIService.getSIMStatus(port.st, port.inserted),
        signalStrength: port.sig || 0,
        dailySent: 0, // These would come from your statistics endpoint
        dailyLimit: 100, // Default limit
        lastActivity: new Date().toISOString(),
        iccid: port.iccid || 'N/A',
        imsi: port.imsi || 'N/A',
        balance: port.bal || '0.00',
        inserted: Boolean(port.inserted),
      }));
    } catch (error) {
      console.error('Error fetching SIM cards:', error);
      return [];
    }
  }

  // Add device function - updated for MongoDB backend
  static async addDevice(deviceData: any): Promise<{success: boolean, device?: Device, message?: string}> {
    try {
      const response = await deviceAPI.create(deviceData);
      return { success: true, device: response?.device };
    } catch (error: any) {
      console.error('Error adding device:', error);
      return { success: false, message: error.message };
    }
  }

  // Refresh device function - updated for MongoDB backend
  static async refreshDevice(device: any): Promise<{success: boolean, device?: Device, message?: string}> {
    try {

      // Try to get the actual device status using the correct endpoint
      try {
        const statusData = await EjoinAPIService.getDeviceStatus(device);
        console.log("statusData",statusData)
        if (statusData && statusData.status) {
          // Count active slots (SIMs that are inserted and active)
          const activeSlotsCount = statusData.status.filter((port: PortStatus) => 
            port.inserted === 1 && port.active === 1
          ).length;

          // Update the device in our backend with new status
          const updateData = {
            status: 'online' as const,
            activeSlots: activeSlotsCount,
            totalSlots: statusData["max-ports"] || device?.totalSlots,
            lastSeen: new Date().toISOString(),
            temperature: 25, // You might get this from statusData if available
            uptime: '0 days, 0 hours' // You might get this from statusData if available
          };

          const updateResponse = await deviceAPI.update(device?._id, updateData);
          return { success: true, 
            device: updateResponse.data.device 
          };
        } else {
          throw new Error('Device not responding');
        }
      } catch (error) {
        console.error('Device communication error:', error);
        // If device is not responding, mark it as offline
        const updateData = {
          status: 'offline' as const,
          lastSeen: new Date().toISOString()
        };

        const updateResponse = await deviceAPI.update(device?._id, updateData);
        return { success: false, device: updateResponse.data.device, message: 'Device is offline or not responding' };
      }
    } catch (error: any) {
      console.error('Error refreshing device:', error);
      return { success: false, message: error.message };
    }
  }

  // Update device status directly
  static async updateDeviceStatus(deviceId: string, statusData: Partial<Device>): Promise<{success: boolean, device?: Device, message?: string}> {
    try {
      const response = await deviceAPI.update(deviceId, statusData);
      return { success: true, device: response.data.device };
    } catch (error: any) {
      console.error('Error updating device status:', error);
      return { success: false, message: error.message };
    }
  }

  // Send command to device
  static async sendDeviceCommand(deviceId: string, command: string, params?: any): Promise<{success: boolean, response?: any, message?: string}> {
    try {
      const response = await authFetch(`/goip_send_cmd?device_id=${deviceId}`, {
        method: 'POST',
        data: JSON.stringify({ command, ...params })
      });
      return { success: true, response };
    } catch (error: any) {
      console.error('Error sending device command:', error);
      return { success: false, message: error.message };
    }
  }

  // Get device statistics
  static async getDeviceStats(deviceId: string): Promise<{success: boolean, stats?: any, message?: string}> {
    try {
      const deviceResponse = await deviceAPI.getById(deviceId);
      const device = deviceResponse.data.device;
      
      if (!device) {
        throw new Error('Device not found');
      }

      const stats = {
        totalSlots: device.totalSlots,
        activeSlots: device.activeSlots,
        dailySent: device.dailySent,
        dailyLimit: device.dailyLimit,
        status: device.status,
        lastSeen: device.lastSeen,
        temperature: device.temperature,
        uptime: device.uptime
      };

      return { success: true, stats };
    } catch (error: any) {
      console.error('Error getting device stats:', error);
      return { success: false, message: error.message };
    }
  }

  // Reset daily sent count
  static async resetDailyCount(deviceId: string): Promise<{success: boolean, message?: string}> {
    try {
      await authFetch(`/api/devices/${deviceId}/reset-daily-count`, {
        method: 'POST'
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting daily count:', error);
      return { success: false, message: error.message };
    }
  }

  // Helper method to get SIM status from status code and inserted state
  private static getSIMStatus(statusCode: number, inserted: number): "active" | "inactive" | "error" {
    // If SIM is not inserted, it's inactive
    if (!inserted) return "inactive";
    
    // Status codes based on Ejoin documentation
    // 0: No SIM, 1: PIN required, 3: Ready, 4: Ready (roaming), 15: Ready
    switch (statusCode) {
      case 3:
      case 4:
      case 15:
        return "active";
      case 0:
      case 1:
        return "inactive";
      default:
        return "error";
    }
  }
}