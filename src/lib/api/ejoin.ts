import { authFetch } from "@/lib/api";

export const EjoinAPI = {
  // ==============================
  // SMS Task Management Endpoints
  // ==============================

  // Submit new SMS tasks
  submitSmsTasks: async (device:any,tasks: {
    id: number;
    from: number;
    sms: string;
    interval_min: number;
    interval_max: number;
    timeout: number;
    charset: string;
    coding: number;
    sms_type: number;
    sdr: boolean;
    fdr: boolean;
    dr: boolean;
    to_all: boolean;
    recipients: number[];
    attachments?: { type: string; content: string }[];
  }[]) => {
    return authFetch(
      `/api/ejoin/sms/submit_sms_tasks?device_id=${device._id}`,
      {
        method: "POST",
        data: JSON.stringify(tasks),
      }
    );
  },

  // Pause SMS tasks
  pauseSmsTasks: async (device:any,taskId: number[]) => {
    return authFetch(
      `/api/ejoin/sms/pause_sms_tasks?device_id=${device._id}`,
      {
        method: "POST",
        data: JSON.stringify(taskId),
      }
    );
  },

  // Resume SMS tasks
  resumeSmsTasks: async (device:any,taskId: number[]) => {
    return authFetch(
      `/api/ejoin/sms/resume_sms_tasks?device_id=${device._id}`,
      {
        method: "POST",
        data: JSON.stringify(taskId),
      }
    );
  },

  // Remove SMS tasks
  removeSmsTasks: async (device:any,taskId: number[]) => {
    return authFetch(
      `/api/ejoin/sms/remove_sms_tasks?device_id=${device._id}`,
      {
        method: "POST",
        data: JSON.stringify(taskId),
      }
    );
  },

  // Get SMS tasks
  getSmsTasks: async (device:any,payload: {
    port: number;
    index: number;
    num: number;
    need_content: boolean;
  }) => {
    return authFetch<{
      tasks: {
        id: number;
        from: number;
        sms: string;
        status: string;
        progress: number;
      }[];
    }>(`/api/ejoin/sms/get_sms_tasks?device_id=${device._id}`, {
      method: "POST",
      data: JSON.stringify(payload),
    });
  },

  // Get received SMSes
  getReceivedSmses: async (device:any,payload: {
    id: number;
    num: number;
  }) => {
    return authFetch<{
      smses: {
        id: number;
        from: string;
        to: string;
        content: string;
        timestamp: string;
      }[];
    }>(`/api/ejoin/sms/get_received_smses?device_id=${device._id}`, {
      method: "POST",
      data: JSON.stringify(payload),
    });
  },
};
