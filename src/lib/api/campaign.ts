import { authFetch } from "@/lib/api";

export interface Campaign {
  _id: string;
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  totalContacts: number;
  sentMessages: number;
  taskId: Array<number>;
  deliveredMessages: number;
  failedMessages: number;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  messageContent: string;
  messagePreview?: string;
  priority: 'low' | 'normal' | 'high';
  contactList?: string;
  device?: string;
  pauseReason?: string;
  taskSettings?: {
    interval_min: number;
    interval_max: number;
    timeout: number;
    charset: string;
    coding: number;
    sdr: boolean;
    fdr: boolean;
    dr: boolean;
    to_all: boolean;
    sms_count: number;
    sms_period: number;
    messageVariantType : string;
  };
  user: string;
  }
  
  export interface CreateCampaignData {
    name: string;
    messageContent: string;
    priority?: 'low' | 'normal' | 'high';
    contactList?: string;
    device?: string;
    scheduledDate?: string;
    taskId?: number[];
    taskSettings?: {
      interval: number;
      timeout: number;
      coding: number;
      smsType: number;
    };
  }
  
  
  export interface CampaignStats {
    totalContacts: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    successRate: number;
  }
  
  export const campaignAPI = {
    // Get all campaigns with pagination and filtering
    getAll: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
  
      const queryString = queryParams.toString();
      const url = queryString ? `/api/campaigns?${queryString}` : '/api/campaigns';
      
      return authFetch<{ data: {
        campaigns: Campaign[];
        total: number;
        totalPages: number;
        currentPage: number;
      } }>(url);
    },
  
    // Get campaign by ID
    getById: async (id: string) => {
      return authFetch<{ data: { campaign: Campaign } }>(`/api/campaigns/${id}`);
    },
  
    // Create new campaign
    create: async (data: CreateCampaignData) => {
      return authFetch<{ data: {campaign: Campaign } }>('/api/campaigns', {
        method: 'POST',
        data: JSON.stringify(data)
      });
    },
  
    // Update campaign
    update: async (id: string, data: any) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}`, {
        method: 'PUT',
        data: JSON.stringify(data)
      });
    },
  
    // Delete campaign
    delete: async (id: string) => {
      return authFetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      });
    },
  
    // Update campaign status
    updateStatus: async (id: string, status: string) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/status`, {
        method: 'POST',
        data: JSON.stringify({ status })
      });
    },
  
    // Update campaign statistics
    updateStats: async (id: string, stats: {
      sentMessages?: number;
      deliveredMessages?: number;
      failedMessages?: number;
    }) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/stats`, {
        method: 'PATCH',
        data: JSON.stringify(stats)
      });
    },
  
    // Start campaign (send to all contacts)
    start: async (id: string, deviceId: string) => {
      return authFetch<{ 
        success: boolean; 
        message: string;
        campaign: Campaign;
      }>(`/api/campaigns/${id}/start`, {
        method: 'POST',
        data: JSON.stringify({ deviceId })
      });
    },
  
    // Pause campaign
    pauseCampaign: async (id: string) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/pause`, {
        method: 'POST'
      });
    },


    // Pause campaign
    startProcessing: async (id: string) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/start-processing`, {
        method: 'POST'
      });
    },
  
    // Resume campaign
    resumeCampaign: async (id: string) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/resume`, {
        method: 'POST'
      });
    },

    // Resume campaign
    stopCampaign: async (id: string) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/stop`, {
        method: 'POST'
      });
    },
  
    // Complete campaign
    complete: async (id: string) => {
      return authFetch<{ data: {campaign: Campaign } }>(`/api/campaigns/${id}/complete`, {
        method: 'POST'
      });
    },
  
    // Get campaign analytics
    getAnalytics: async (id: string) => {
      return authFetch<{ analytics: CampaignStats }>(`/api/campaigns/${id}/analytics`);
    },
  
    // Duplicate campaign
    duplicate: async (id: string, newName?: string) => {
      return authFetch<{ campaign: Campaign }>(`/api/campaigns/${id}/duplicate`, {
        method: 'POST',
        data: JSON.stringify({ newName })
      });
    },
  
    // Bulk update campaigns
    bulkUpdate: async (ids: string[], updates: Partial<any>) => {
      return authFetch<{ updatedCount: number }>('/api/campaigns/bulk-update', {
        method: 'POST',
        data: JSON.stringify({ ids, updates })
      });
    },
  
    // Get campaign progress
    getProgress: async (id: string) => {
      return authFetch<{
        total: number;
        sent: number;
        delivered: number;
        failed: number;
        progress: number;
        estimatedCompletion?: string;
      }>(`/api/campaigns/${id}/progress`);
    }
  };
  