// services/smsService.ts
import { toast } from 'sonner';

export interface SmsTask {
  tid: string;
  from?: string;
  to: string;
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
  type: string;
  status: Array<{
    tid: string;
    status: string;
  }>;
}

export interface DeviceConfig {
  device_ip: string;
  device_port?: number;
  version?: string;
}

class SmsService {
  private async makeDeviceRequest(
    deviceConfig: DeviceConfig,
    endpoint: string,
    data?: any,
    method: string = 'POST'
  ): Promise<any> {
    try {
      const { device_ip, device_port = 80, version = '1.1' } = deviceConfig;
      
      const url = `http://${device_ip}:${device_port}${endpoint}`;
      
      const params = new URLSearchParams();
      params.append('version', version);
      
      const fullUrl = `${url}?${params.toString()}`;
      
      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Device request error:', error);
      throw new Error(`Failed to communicate with device: ${error.message}`);
    }
  }

  async sendSms(deviceConfig: DeviceConfig, tasks: SmsTask[]): Promise<SmsResponse> {
    const data = {
      type: 'send-sms',
      task_num: tasks.length,
      tasks: tasks.map(task => ({
        ...task,
        chs: task.chs || 'utf8',
        coding: task.coding || 0,
        smstype: task.smstype || 0,
        intvl: task.intvl || 0,
        tmo: task.tmo || 30,
        sdr: task.sdr || 0,
        fdr: task.fdr || 1,
        dr: task.dr || 0,
        sr_prd: task.sr_prd || 60,
        sr_cnt: task.sr_cnt || 10,
      })),
    };

    return this.makeDeviceRequest(deviceConfig, '/goip_post_sms.html', data);
  }

  async pauseSms(deviceConfig: DeviceConfig, tids: string[]): Promise<SmsResponse> {
    return this.makeDeviceRequest(deviceConfig, '/goip_pause_sms.html', { tids });
  }

  async resumeSms(deviceConfig: DeviceConfig, tids: string[]): Promise<SmsResponse> {
    return this.makeDeviceRequest(deviceConfig, '/goip_resume_sms.html', { tids });
  }

  async removeSms(deviceConfig: DeviceConfig, tids: string[]): Promise<SmsResponse> {
    return this.makeDeviceRequest(deviceConfig, '/goip_remove_sms.html', { tids });
  }

  async getTasks(deviceConfig: DeviceConfig, port?: string, pos: number = 0, num: number = 10, has_content: number = 0): Promise<any> {
    const params = { port, pos: pos.toString(), num: num.toString(), has_content: has_content.toString() };
    const queryString = new URLSearchParams(params).toString();
    return this.makeDeviceRequest(deviceConfig, `/goip_get_tasks.html?${queryString}`, undefined, 'GET');
  }

  async getSms(deviceConfig: DeviceConfig, sms_id: number = 1, sms_num: number = 0, sms_del: number = 0): Promise<any> {
    const params = { 
      sms_id: sms_id.toString(), 
      sms_num: sms_num.toString(), 
      sms_del: sms_del.toString() 
    };
    const queryString = new URLSearchParams(params).toString();
    return this.makeDeviceRequest(deviceConfig, `/goip_get_sms.html?${queryString}`, undefined, 'GET');
  }
}

export const smsService = new SmsService();