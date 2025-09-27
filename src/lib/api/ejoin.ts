import { authFetch } from "@/lib/api";

export const EjoinAPI = {
  // ==============================
  // SMS Task Management Endpoints
  // ==============================

  // Submit new SMS tasks
  submitSmsTasks: async (tasks: {
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
    return authFetch<{ success: boolean; message: string }>(
      `/api/submit_sms_task`,
      {
        method: "POST",
        data: JSON.stringify(tasks),
      }
    );
  },

  // Pause SMS tasks
  pauseSmsTasks: async (taskIds: number[]) => {
    return authFetch<{ success: boolean; message: string }>(
      `/api/pause_sms_tasks`,
      {
        method: "POST",
        data: JSON.stringify(taskIds),
      }
    );
  },

  // Resume SMS tasks
  resumeSmsTasks: async (taskIds: number[]) => {
    return authFetch<{ success: boolean; message: string }>(
      `/api/resume_sms_tasks`,
      {
        method: "POST",
        data: JSON.stringify(taskIds),
      }
    );
  },

  // Remove SMS tasks
  removeSmsTasks: async (taskIds: number[]) => {
    return authFetch<{ success: boolean; message: string }>(
      `/api/remove_sms_tasks`,
      {
        method: "POST",
        data: JSON.stringify(taskIds),
      }
    );
  },

  // Get SMS tasks
  getSmsTasks: async (payload: {
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
    }>(`/api/get_sms_tasks`, {
      method: "POST",
      data: JSON.stringify(payload),
    });
  },

  // Get received SMSes
  getReceivedSmses: async (payload: {
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
    }>(`/api/get_received_smses`, {
      method: "POST",
      data: JSON.stringify(payload),
    });
  },
};
