import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch contact lists
  const fetchContactLists = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      toast.error('Failed to load contact lists');
    }
  };

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

  // Create contact list
  const createContactList = async (name: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .insert([{
          name,
          user_id: user.id,
          total_contacts: 0,
          opted_in: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      setContactLists(prev => [data, ...prev]);
      toast.success('Contact list created successfully');
      return data;
    } catch (error) {
      console.error('Error creating contact list:', error);
      toast.error('Failed to create contact list');
      throw error;
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
          fetchContactLists(),
          fetchMessageTemplates()
        ]);
        setLoading(false);
      };
      
      loadData();
    }
  }, [user]);

  return {
    campaigns,
    contactLists,
    messageTemplates,
    loading,
    createCampaign,
    updateCampaignStatus,
    createContactList,
    createMessageTemplate,
    deleteMessageTemplate,
    fetchCampaigns,
    fetchContactLists,
    fetchMessageTemplates
  };
}