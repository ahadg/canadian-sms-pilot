import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { parse } from 'papaparse';
import { Message } from 'node_modules/react-hook-form/dist/types';
import { smsService, type SmsTask, type DeviceConfig } from '@/services/smsService';

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  total_contacts: number;
  sent_messages: number;
  delivered_messages: number;
  failed_messages: number;
  scheduled_date?: string;
  created_at: string;
  message_content: string;
  message_preview?: string;
  priority: 'low' | 'normal' | 'high';
  contact_list_id?: string;
}

// Add this interface
export interface Device {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  status: 'online' | 'offline' | 'maintenance';
  created_at: string;
  updated_at: string;
}


export interface Contact {
  id: string;
  contact_list_id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  opted_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactList {
  id: string;
  name: string;
  total_contacts: number;
  opted_in: number;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available devices
  const fetchDevices = async (): Promise<Device[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
      return [];
    }
  };

  // Send SMS campaign
  const sendCampaignSms = async (
    campaignId: string,
    deviceConfig: DeviceConfig,
    contactIds: string[]
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log("sendCampaignSms",{campaignId,deviceConfig,contactIds});
      // Fetch campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Fetch contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds)
        .eq('opted_in', true);

      if (contactsError) throw contactsError;

      if (contacts.length === 0) {
        throw new Error('No opted-in contacts found');
      }

      // Create SMS tasks
      const tasks: SmsTask[] = contacts.map(contact => ({
        tid: `${campaignId}-${contact.id}-${Date.now()}`,
        to: contact.phone_number,
        sms: campaign.message_content,
        chs: 'utf8' as const,
        coding: campaign.message_content.length > 160 ? 1 : 0, // USC2 for long messages
      }));

      // Send SMS via device
      const result = await smsService.sendSms(deviceConfig, tasks);

      if (result.code !== 200) {
        throw new Error(`SMS sending failed: ${result.reason}`);
      }

      // Update campaign statistics
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          sent_messages: campaign.sent_messages + contacts.length,
          status: 'active'
        })
        .eq('id', campaignId);

      if (updateError) throw updateError;

      // Log the SMS sending activity
      await supabase
        .from('sms_logs')
        .insert(contacts.map(contact => ({
          campaign_id: campaignId,
          contact_id: contact.id,
          phone_number: contact.phone_number,
          message_content: campaign.message_content,
          status: 'sent',
          device_ip: deviceConfig.device_ip,
          user_id: user.id
        })));

      toast.success(`SMS sent successfully to ${contacts.length} contacts`);
      return result;
    } catch (error) {
      console.error('Error sending campaign SMS:', error);
      toast.error('Failed to send SMS campaign');
      throw error;
    }
  };

  // Start campaign (send to all contacts in the associated list)
  const startCampaign = async (campaignId: string, deviceConfig: DeviceConfig) => {
    if (!user) throw new Error('User not authenticated');
  
    try {
      console.log("send_command_here");
  
      // 1) Load the campaign and (optionally) its list record
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          id,
          contact_list_id,
          status,
          contact_lists:contact_list_id (
            id,
            name
          )
        `)
        .eq('id', campaignId)
        .maybeSingle();
  
      if (campaignError) throw campaignError;
      if (!campaign) throw new Error('Campaign not found');
      if (!campaign.contact_list_id) {
        throw new Error('Campaign does not have a contact list assigned');
      }
  
      // 2) Fetch opted-in contacts for that list
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, phone_number, first_name, last_name')
        .eq('contact_list_id', campaign.contact_list_id)
        .eq('opted_in', true);
  
      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) {
        throw new Error('No opted-in contacts found in the selected list');
      }
  
      // 3) Send messages
      await sendCampaignSms(
        campaignId,
        deviceConfig,
        contacts.map((c) => c.id)
      );
  
      // 4) Update campaign status AFTER successful send
      await updateCampaignStatus(campaignId, 'active');
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  };
  

  // Test campaign (send to a few contacts)
  const testCampaign = async (campaignId: string, deviceConfig: DeviceConfig, testContactIds: string[]) => {
    try {
      await sendCampaignSms(campaignId, deviceConfig, testContactIds);
      toast.success('Test campaign sent successfully');
    } catch (error) {
      console.error('Error testing campaign:', error);
      throw error;
    }
  };

  // Fetch campaigns
  const fetchCampaigns = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as Campaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  const getAllMessages = async () => {
    const { data: messages, error: messagesError } = await (supabase as any)
      .from('messages')
      .select(`
        *,
        message_variants (*)
      `)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    setMessages(messages.map(message => ({
      id: message.id,
      name: message.name,
      category: message.category,
      originalPrompt: message.original_prompt,
      baseMessage: message.base_message,
      variants: message.message_variants.map((variant: any) => ({
        id: variant.id,
        content: variant.content,
        tone: variant.tone,
        language: variant.language,
        characterCount: variant.character_count,
        spamScore: variant.spam_score,
        encoding: variant.encoding,
        cost: variant.cost,
        createdAt: variant.created_at,
      })),
      settings: message.settings,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      isTemplate: message.is_template,
    })));
  }


  // Fetch message templates
  const fetchMessageTemplates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessageTemplates(data || []);
    } catch (error) {
      console.error('Error fetching message templates:', error);
      toast.error('Failed to load message templates');
    }
  };

  // Create campaign
  const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          ...campaignData,
          user_id: user.id,
          message_preview: campaignData.message_content.substring(0, 50) + '...'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCampaigns(prev => [data as Campaign, ...prev]);
      toast.success('Campaign created successfully');
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      throw error;
    }
  };

  // Update campaign status
  const updateCampaignStatus = async (id: string, status: Campaign['status']) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? { ...campaign, status } : campaign
        )
      );
      toast.success(`Campaign ${status}`);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Failed to update campaign status');
    }
  };


  // Create message template
  const createMessageTemplate = async (templateData: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert([{
          ...templateData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setMessageTemplates(prev => [data, ...prev]);
      toast.success('Message template created successfully');
      return data;
    } catch (error) {
      console.error('Error creating message template:', error);
      toast.error('Failed to create message template');
      throw error;
    }
  };

  // Delete message template
  const deleteMessageTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setMessageTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Message template deleted');
    } catch (error) {
      console.error('Error deleting message template:', error);
      toast.error('Failed to delete message template');
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchCampaigns(),
          fetchMessageTemplates(),
          getAllMessages()
        ]);
        setLoading(false);
      };
      
      loadData();
    }
  }, [user]);

  return {
    campaigns,
    contactLists,
    messages,
    messageTemplates,
    loading,
    createCampaign,
    updateCampaignStatus,
    createMessageTemplate,
    deleteMessageTemplate,
    fetchCampaigns,
    fetchMessageTemplates,
    fetchDevices,
    sendCampaignSms,
    startCampaign,
    testCampaign,
  };
}