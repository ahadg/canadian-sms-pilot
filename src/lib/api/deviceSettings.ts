import { authFetch } from "@/lib/api";

export const settingsAPI = {
  getConfig: async (deviceId: string) => {
    return authFetch(`/api/ejoin/sms/get_sms_config?device_id=${deviceId}`);
  },

  setConfig: async (data: any,deviceId: string) => {
    return authFetch(`/api/ejoin/sms/set_sms_config?device_id=${deviceId}`, {
      method: "POST",
      data: JSON.stringify(data),
    });
  },

  setStatusReport: async (data: any,deviceId: string) => {
    return authFetch(`/api/ejoin/goip_get_status/set_status_report_server?device_id=${deviceId}`, {
      method: "POST",
      data: JSON.stringify(data),
    });
  },

  getstatusReport: async (data: any,deviceId: string) => {
    return authFetch(`/api/ejoin/goip_get_status/get_status_report_server?device_id=${deviceId}`);
  },
};
