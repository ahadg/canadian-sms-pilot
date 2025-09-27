import { useState, useEffect } from 'react';
import { toast } from 'sonner';
// import { campaignAPI, contactAPI, deviceAPI, messageAPI } from '@/utils/api';
import { useAuthStore } from "@/store/useAuthStore";
import { deviceAPI } from '@/lib/api';
import { messageAPI, SavedMessage } from '@/lib/api/messages';
import { v4 as uuidv4 } from 'uuid';
import { campaignAPI } from '@/lib/api/campaign';
import { contactAPI } from '@/lib/api/contacts';
import { EjoinAPI } from '@/lib/api/ejoin';

export interface Campaign {
  _id: string;
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  totalContacts: number;
  sentMessages: number;
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
  taskSettings?: {
    interval: number;
    timeout: number;
    coding: number;
    smsType: number;
  };
  user: string;
}

export interface SmsTask {
  tid: string;
  from?: string;
  to: string;
  sms: string;
  chs?: 'utf8' | 'base64';
  coding?: number;
  smsType?: number;
  interval?: number;
  timeout?: number;
  sdr?: number;
  fdr?: number;
  dr?: number;
  srPeriod?: number;
  srCount?: number;
}

export interface Device {
  _id: string;
  id: string;
  name: string;
  ipAddress: string;
  port: string;
  status: 'online' | 'offline' | 'warning';
  createdAt: string;
  updatedAt: string;
  username: string;
  password: string;
  user: string;
  totalSlots: number;
  activeSlots: number;
  dailySent: number;
  dailyLimit: number;
  temperature: number;
  uptime: string;
  lastSeen: string;
}

export interface Contact {
  _id: string;
  contactList: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  optedIn: boolean;
  createdAt: string;
  updatedAt: string;
  user: string;
}

export interface ContactList {
  _id: string;
  name: string;
  totalContacts: number;
  optedInCount: number;
  optedOutCount: number;
  createdAt: string;
  updatedAt: string;
  user: string;
}

export interface MessageTemplate {
  _id: string;
  name: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  user: string;
}

export interface MessageVariant {
  _id: string;
  content: string;
  tone: string;
  language: string;
  characterCount: number;
  spamScore: number;
  encoding: string;
  cost: number;
  createdAt: string;
}

export interface Message {
  _id: string;
  name: string;
  category: string;
  originalPrompt: string;
  baseMessage: string;
  variants: MessageVariant[];
  settings: any;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  user?: string;
}

export function useCampaigns() {
  const { user, isAuthenticated } = useAuthStore();
  const [campaigns, setCampaigns] = useState<any>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [messages, setMessages] = useState<any>([]);
  const [messageTemplates, setMessageTemplates] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available devices
  const fetchDevices = async (): Promise<Device[]> => {
    if (!isAuthenticated) return [];
    
    try {
      const response = await deviceAPI.getAll();
      return response.data.devices || [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
      return [];
    }
  };

  // Send SMS campaign
  const sendCampaignSms = async (
    campaignId: string,
    deviceId: string,
    contacts: any
  ) => {
    if (!isAuthenticated) throw new Error('User not authenticated');
  
    try {
      console.log("sendCampaignSms", { campaignId, deviceId, contacts });
      
      // Fetch campaign details
      const campaignResponse = await campaignAPI.getById(campaignId);
      console.log("campaignResponse",campaignResponse)
      const campaign = campaignResponse?.data?.campaign;
  
      if (!campaign) {
        throw new Error('Campaign not found');
      }
  
      // Fetch device details
      const deviceResponse = await deviceAPI.getById(deviceId);
      const device = deviceResponse.data.device;
  
      if (!device) {
        throw new Error('Device not found');
      }
  

  
      if (contacts.length === 0) {
        throw new Error('No opted-in contacts found');
      }
  
      // Prepare SMS tasks
      const tasks = [{
        tid: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
        scheduledDate : `${Date.now()}`,
        to: contacts.map(contact => contact.phoneNumber).join(','),
        sms: campaign.messageContent,
        chs: 'utf8' as const,
        coding: campaign.taskSettings?.coding || (campaign.messageContent.length > 160 ? 1 : 0),
        smsType: campaign.taskSettings?.smsType || 0,
        interval: campaign.taskSettings?.interval || 10,
        timeout: campaign.taskSettings?.timeout || 30,
        "sdr": true,
        "fdr": true,
        "dr": true,
      }];
      console.log("tasks",tasks)
      // Send SMS via device using the goip_send_cmd endpoint
      const ejoin_repsonses = await EjoinAPI.submitSmsTasks(tasks);
  
      if (!ejoin_repsonses.success) {
        throw new Error(`SMS sending failed: ${ejoin_repsonses.message}`);
      }

  
      // if (result.code !== 200) {
      //   throw new Error(`SMS sending failed: ${result.reason}`);
      // }
  
      // Update campaign statistics
      await campaignAPI.updateStats(campaignId, {
        sentMessages: contacts.length
      });
  
      // Update device daily sent count
      await deviceAPI.updateStats(deviceId, {
        dailySent: device.dailySent + contacts.length
      });
  
      toast.success(`SMS sent successfully to ${contacts.length} contacts`);
      return result;
    } catch (error) {
      console.error('Error sending campaign SMS:', error);
      toast.error('Failed to send SMS campaign');
      throw error;
    }
  };

  // Start campaign (send to all contacts in the associated list)
  const startCampaign = async (campaignId: string, deviceId: string) => {
    if (!isAuthenticated) throw new Error('User not authenticated');
  
    try {
      console.log("Starting campaign:", campaignId);
  
      // 1) Load the campaign
      const campaignResponse = await campaignAPI.getById(campaignId);
      console.log("campaignResponse",campaignResponse)
      const campaign = campaignResponse?.data?.campaign;
  
      if (!campaign) throw new Error('Campaign not found');
      if (!campaign.contactList) {
        throw new Error('Campaign does not have a contact list assigned');
      }
      console.log("campaign",campaign)
  
      // 2) Fetch opted-in contacts for that list
      const contactsResponse = await contactAPI.getContacts(campaign.contactList?._id, {
        status: 'active',
        optedIn: true
      });
      console.log("contactsResponse",contactsResponse)
      const contacts = contactsResponse.data.contacts || [];
  
      if (contacts.length === 0) {
        throw new Error('No opted-in contacts found in the selected list');
      }
  
      // 3) Send messages
      await sendCampaignSms(
        campaignId,
        deviceId,
        contacts
      );
  
      // 4) Update campaign status AFTER successful send
      await updateCampaignStatus(campaignId, 'active');
      
      return { success: true, message: `Campaign started successfully. Sent to ${contacts.length} contacts.` };
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await campaignAPI.getAll();
      console.log("fetchCampaigns_response",response)
      setCampaigns(response.data?.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  // Fetch contact lists
  const fetchContactLists = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await contactAPI.getLists();
      setContactLists(response.data.contactLists || []);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    }
  };

  // Fetch messages and templates
  const getAllMessages = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Fetch regular messages
      const messagesResponse = await messageAPI.getAll({ isTemplate: false });
      console.log("messagesResponse",messagesResponse)
      setMessages(messagesResponse?.data?.messages || []);
      
      // Fetch templates
      // const templatesResponse = await messageAPI.getTemplates();
      // setMessageTemplates(templatesResponse.templates || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Create campaign
  const createCampaign = async (campaignData: any) => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    try {
      const response = await campaignAPI.create({
        ...campaignData,
        messagePreview: campaignData.messageContent.substring(0, 50) + '...'
      });
      
      const newCampaign = response.campaign;
      setCampaigns(prev => [newCampaign, ...prev]);
      toast.success('Campaign created successfully');
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      throw error;
    }
  };

  // Update campaign status
  const updateCampaignStatus = async (id: string, status: Campaign['status']) => {
    try {
      await campaignAPI.updateStatus(id, status);
      
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign._id === id ? { ...campaign, status } : campaign
        )
      );
      toast.success(`Campaign ${status}`);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Failed to update campaign status');
      throw error;
    }
  };

  // Update campaign
  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const response = await campaignAPI.update(id, updates);
      const updatedCampaign = response.campaign;
      
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign._id === id ? { ...campaign, ...updatedCampaign } : campaign
        )
      );
      toast.success('Campaign updated successfully');
      return updatedCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
      throw error;
    }
  };

  // Delete campaign
  const deleteCampaign = async (id: string) => {
    try {
      await campaignAPI.delete(id);
      
      setCampaigns(prev => prev.filter(campaign => campaign._id !== id));
      toast.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
      throw error;
    }
  };

  // Fetch campaign analytics
  const getCampaignAnalytics = async (campaignId: string) => {
    try {
      const campaignResponse = await campaignAPI.getById(campaignId);
      const campaign = campaignResponse.campaign;
      
      return {
        totalContacts: campaign.totalContacts,
        sentMessages: campaign.sentMessages,
        deliveredMessages: campaign.deliveredMessages,
        failedMessages: campaign.failedMessages,
        successRate: campaign.totalContacts > 0 ? 
          (campaign.deliveredMessages / campaign.totalContacts) * 100 : 0
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchCampaigns(),
          fetchContactLists(),
          getAllMessages()
        ]);
        setLoading(false);
      };
      
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    campaigns,
    contactLists,
    messages,
    messageTemplates,
    loading,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
    fetchCampaigns,
    fetchDevices,
    sendCampaignSms,
    startCampaign,
    getCampaignAnalytics,
  };
}