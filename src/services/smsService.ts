// services/smsService.ts
import { authFetch, baseURL } from '@/lib/api';
import { toast } from 'sonner';

export interface SmsTask {
  id: string;
  recipients: string[]; // Array of phone numbers
  sms: string;
  chs?: 'utf8' | 'base64';
  coding?: number;
  smstype?: number;
  intvl?: number;
  tmo?: number;
  sdr?: number;
  fdr?: number;
  dr?: number;
  sr_prd?: number;
  sr_cnt?: number;
}

export interface SmsResponse {
  code: number;
  reason: string;
  type?: string;
  status?: Array<{
    id: string;
    status: string;
  }>;
}

export interface DeviceConfig {
  device_ip: string;
  device_port?: number;
  version?: string;
  password: string;
  username: string;
  device_id: string;
}

class SmsService {
  private async makeDeviceRequest(
    deviceConfig: DeviceConfig,
    endpoint: string,
    data?: any,
    method: string = 'POST'
  ): Promise<any> {
    try {
      const { device_ip, device_port = 80, device_id } = deviceConfig;
      
      const url = `${baseURL}${endpoint}`;
      
      // Add device_id as a query parameter
      const params = new URLSearchParams();
      params.append('device_id', device_id);
      
      const fullUrl = `${url}?${params.toString()}`;
      
      const response = await authFetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      console.log("response",response)
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      return response;
    } catch (error) {
      console.error('Device request error:', error);
      throw new Error(`Failed to communicate with device: ${error.message}`);
    }
  }

  // Optimize tasks by grouping recipients with same message
  private optimizeTasks(tasks: SmsTask[]): SmsTask[] {
    const messageMap = new Map<string, { task: SmsTask, recipients: string[] }>();
    
    // Group recipients by message content and settings
    tasks.forEach(task => {
      const key = task.sms + (task.coding || 0) + (task.smstype || 0);
      if (!messageMap.has(key)) {
        messageMap.set(key, { 
          task: { ...task, recipients: [] }, 
          recipients: [] 
        });
      }
      messageMap.get(key)!.recipients.push(...task.recipients);
    });
    
    // Create optimized tasks with grouped recipients
    const optimizedTasks: SmsTask[] = [];
    messageMap.forEach(({ task, recipients }) => {
      optimizedTasks.push({
        ...task,
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recipients: recipients
      });
    });
    
    return optimizedTasks;
  }

  async sendSms(deviceConfig: DeviceConfig, tasks: SmsTask[]): Promise<SmsResponse> {
    // Convert old format to new format if needed
    const formattedTasks = tasks.map(task => {
      // If task has 'to' field (old format), convert to recipients array
      if ((task as any).to) {
        const recipients = (task as any).to.split(',').map((num: string) => num.trim());
        return {
          id: task.id,
          recipients: recipients,
          sms: task.sms,
          chs: task.chs || 'utf8',
          coding: task.coding || 0,
          smstype: task.smstype || 0,
          intvl: task.intvl || 10,
          tmo: task.tmo || 30,
          sdr: task.sdr || 0,
          fdr: task.fdr || 1,
          dr: task.dr || 0,
          sr_prd: task.sr_prd || 60,
          sr_cnt: task.sr_cnt || 10,
        };
      }
      
      return task;
    });

    // Group recipients by message content to send in batches
    const optimizedTasks = this.optimizeTasks(formattedTasks);
    
    console.log("sendSms optimized data", optimizedTasks);
    return this.makeDeviceRequest(deviceConfig, '/api/sms/submit_sms_task', optimizedTasks);
  }

  async pauseSms(deviceConfig: DeviceConfig, ids: string[]): Promise<SmsResponse> {
    return this.makeDeviceRequest(deviceConfig, '/api/sms/pause_sms_task', { ids });
  }

  async resumeSms(deviceConfig: DeviceConfig, ids: string[]): Promise<SmsResponse> {
    return this.makeDeviceRequest(deviceConfig, '/api/sms/resume_sms_task', { ids });
  }

  async removeSms(deviceConfig: DeviceConfig, ids: string[]): Promise<SmsResponse> {
    return this.makeDeviceRequest(deviceConfig, '/api/sms/remove_sms_task', { ids });
  }

  async getTasks(deviceConfig: DeviceConfig, port: string, index: number = 0, num: number = 10, need_content: boolean = false): Promise<any> {
    const data = { port, index, num, need_content };
    return this.makeDeviceRequest(deviceConfig, '/api/sms/get_sms_task', data);
  }

  async getSms(deviceConfig: DeviceConfig, sms_id: number = 1, sms_num: number = 0, sms_del: number = 0): Promise<any> {
    const params = { 
      sms_id: sms_id.toString(), 
      sms_num: sms_num.toString(), 
      sms_del: sms_del.toString() 
    };
    const queryString = new URLSearchParams(params).toString();
    return this.makeDeviceRequest(deviceConfig, `/api/sms/get_received_smses?${queryString}`, undefined, 'GET');
  }

  // New SMS config methods
  async getSmsConfig(deviceConfig: DeviceConfig): Promise<any> {
    return this.makeDeviceRequest(deviceConfig, '/api/sms/get_sms_config', undefined, 'GET');
  }

  async setSmsConfig(deviceConfig: DeviceConfig, config: any): Promise<any> {
    return this.makeDeviceRequest(deviceConfig, '/api/sms/set_sms_config', config);
  }
}

export const smsService = new SmsService();