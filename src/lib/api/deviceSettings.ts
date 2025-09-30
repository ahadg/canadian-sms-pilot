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
};
