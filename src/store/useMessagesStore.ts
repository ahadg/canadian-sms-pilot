import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authFetch, deviceAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Device } from '@/hooks/useCampaigns';

// Interfaces
export interface ReceivedSMS {
  id: string;
  port: number;
  slot: number;
  timestamp: string;
  from: string;
  to: string;
  sms: string;
  status: 'delivered' | 'read' | 'replied' | 'failed';
  direction: 'inbound' | 'outbound';
  read: boolean;
  isReport: boolean;
  sim?: {
    port: number;
    slot: number;
  };
}

interface Conversation {
  phoneNumber: string;
  port: number;
  slot: number;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messageCount: number;
  simId: string;
}

export interface InboxFilters {
  search: string;
  status: string;
  direction: string;
  dateFrom: string;
  dateTo: string;
}

interface MessagesState {
  // State
  messages: ReceivedSMS[];
  filteredMessages: ReceivedSMS[];
  selectedMessage: ReceivedSMS | null;
  isLoading: boolean;
  isSyncing: boolean;
  filters: InboxFilters;
  devices: Device[];
  selectedDevice: Device | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  // Actions
  setMessages: (messages: ReceivedSMS[]) => void;
  setFilteredMessages: (messages: ReceivedSMS[]) => void;
  setSelectedMessage: (message: ReceivedSMS | null) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setFilters: (filters: InboxFilters) => void;
  updateFilter: (key: keyof InboxFilters, value: string) => void;
  setDevices: (devices: Device[]) => void;
  setSelectedDevice: (device: Device | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendSMS: (params: SendSMSParams) => Promise<void>;
  fetchConversations: (deviceId: string) => Promise<void>;
  fetchConversation: (phoneNumber: string, port: number, slot: number, deviceId: string) => Promise<void>;
  // Async Actions
  fetchDevices: () => Promise<void>;
  syncMessagesFromDevice: (deviceId: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  clearFilters: () => void;
  filterMessages: (activeTab: string) => void;
}

const initialFilters: InboxFilters = {
  search: '',
  status: 'all',
  direction: 'all',
  dateFrom: '',
  dateTo: ''
};


interface SendSMSParams {
  deviceId: string;
  port: number;
  slot: number;
  to: string;
  sms: string;
}

interface Conversation {
  phoneNumber: string;
  port: number;
  slot: number;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: ReceivedSMS[];
}

export const useMessagesStore = create<MessagesState>()(
  persist(
    (set, get) => ({
      // Initial State
      messages: [],
      filteredMessages: [],
      selectedMessage: null,
      isLoading: false,
      isSyncing: false,
      filters: initialFilters,
      devices: [],
      selectedDevice: null,
      conversations: [],
      currentConversation: null,

      // Sync State Actions
      setMessages: (messages) => set({ messages }),
      setFilteredMessages: (filteredMessages) => set({ filteredMessages }),
      setSelectedMessage: (selectedMessage) => set({ selectedMessage }),
      setLoading: (isLoading) => set({ isLoading }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setFilters: (filters) => set({ filters }),
      setDevices: (devices) => set({ devices }),
      setSelectedDevice: (selectedDevice) => set({ selectedDevice }),
      setConversations: (conversations) => set({ conversations }),
      setCurrentConversation: (currentConversation) => set({ currentConversation }),
      // Filter Actions
      updateFilter: (key, value) => {
        const { filters } = get();
        const newFilters = { ...filters, [key]: value };
        set({ filters: newFilters });
      },

      clearFilters: () => {
        set({ filters: initialFilters });
      },

      fetchConversations: async (deviceId: string) => {
        try {
          const response = await authFetch(`/api/sms/conversations?deviceId=${deviceId}`);
          console.log("fetchConversations_response",response)
          if (response.code !== 200) {
            throw new Error('Failed to fetch conversations');
          }

          set({ conversations: response.data.conversations || [] });
          
        } catch (error) {
          console.error('Failed to fetch conversations:', error);
          toast.error('Failed to load conversations');
        }
      },

      fetchConversation: async (phoneNumber: string, port: number, slot: number, deviceId: string) => {
        try {
          const response = await authFetch(
            `/api/sms/conversation?phoneNumber=${phoneNumber}&port=${port}&slot=${slot}&deviceId=${deviceId}`
          );
          console.log("fetchConversation",response)
          if (response.code !== 200) {
            throw new Error('Failed to fetch conversation');
          }

          const conversation: Conversation = {
            phoneNumber,
            port,
            slot,
            lastMessage: response.data.messages[response.data.messages.length - 1]?.sms || '',
            lastTimestamp: response.data.messages[response.data.messages.length - 1]?.timestamp || '',
            unreadCount: 0, // All messages are marked as read when fetched
            messageCount: response.data.messages.length,
            simId: '', // This would come from backend
            messages: response.data.messages
          };

          set({ currentConversation: conversation });
          
        } catch (error) {
          console.error('Failed to fetch conversation:', error);
          toast.error('Failed to load conversation');
        }
      },

      sendSMS: async (params: SendSMSParams) => {
        const { deviceId, port, slot, to, sms } = params;
        
        set({ isLoading: true });
        try {
          const response = await authFetch('/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            data: JSON.stringify({
              deviceId,
              port,
              slot,
              to,
              sms
            })
          });

          if (!response.success) {
            throw new Error('Failed to send SMS');
          }

          toast.success('SMS sent successfully');
          
          // Refresh conversations and current conversation
          const { selectedDevice, fetchConversations, currentConversation, fetchConversation } = get();
          if (selectedDevice) {
            await fetchConversations(selectedDevice._id);
            
            // Refresh current conversation if it's the same recipient
            if (currentConversation && currentConversation.phoneNumber === to) {
              await fetchConversation(to, port, slot, selectedDevice._id);
            }
          }
          
        } catch (error) {
          console.error('Failed to send SMS:', error);
          toast.error('Failed to send SMS');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (messageId: string) => {
        try {
          // Update local state immediately for better UX
          const { messages, selectedMessage, currentConversation } = get();
          
          const updatedMessages = messages.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          );
          
          const updatedSelectedMessage = selectedMessage?.id === messageId 
            ? { ...selectedMessage, read: true } 
            : selectedMessage;

          // Update current conversation if the message is in it
          let updatedCurrentConversation = currentConversation;
          if (currentConversation && currentConversation.messages.some(msg => msg.id === messageId)) {
            updatedCurrentConversation = {
              ...currentConversation,
              messages: currentConversation.messages.map(msg =>
                msg.id === messageId ? { ...msg, read: true } : msg
              ),
              unreadCount: Math.max(0, currentConversation.unreadCount - 1)
            };
          }

          set({ 
            messages: updatedMessages,
            selectedMessage: updatedSelectedMessage,
            currentConversation: updatedCurrentConversation
          });
          
          // Send API request to mark as read
          await authFetch(`/api/sms/markAsRead/${messageId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } catch (error) {
          console.error('Failed to mark as read:', error);
          toast.error('Failed to mark message as read');
        }
      },

      // Update other methods to use deviceId parameter
      loadMessages: async () => {
        set({ isLoading: true });
        try {
          const { selectedDevice, fetchConversations } = get();
          
          if (!selectedDevice) {
            throw new Error('No device selected');
          }

          // First try to get messages from the API
          const apiResponse = await authFetch(`/api/sms?deviceId=${selectedDevice._id}&limit=1000`);
          
          if (apiResponse && apiResponse.success) {
            const messagesData = apiResponse.data.messages || [];
            set({ messages: messagesData });
            
            // Fetch conversations after loading messages
            await fetchConversations(selectedDevice._id);
          }
          
        } catch (error) {
          console.error('Failed to load messages:', error);
          toast.error('Failed to load messages');
        } finally {
          set({ isLoading: false });
        }
      },
     
      filterMessages: (activeTab) => {
        const { messages, filters } = get();
        let filtered = [...messages];

        // Filter by tab
        switch (activeTab) {
          case 'unread':
            filtered = filtered.filter(msg => !msg.read);
            break;
          case 'replied':
            filtered = filtered.filter(msg => msg.status === 'replied');
            break;
          case 'inbound':
            filtered = filtered.filter(msg => msg.direction === 'inbound');
            break;
          case 'outbound':
            filtered = filtered.filter(msg => msg.direction === 'outbound');
            break;
          // 'all' tab - no additional filtering
        }

        // Filter by search
        if (filters.search.trim()) {
          const searchLower = filters.search.toLowerCase().trim();
          filtered = filtered.filter(msg => 
            decodeBase64(msg.sms).toLowerCase().includes(searchLower) ||
            msg.from.toLowerCase().includes(searchLower) ||
            msg.to.toLowerCase().includes(searchLower)
          );
        }

        // Filter by status
        if (filters.status !== 'all') {
          filtered = filtered.filter(msg => msg.status === filters.status);
        }

        // Filter by direction
        if (filters.direction !== 'all') {
          filtered = filtered.filter(msg => msg.direction === filters.direction);
        }

        // Filter by date range
        if (filters.dateFrom) {
          filtered = filtered.filter(msg => 
            new Date(msg.timestamp) >= new Date(filters.dateFrom)
          );
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(msg => 
            new Date(msg.timestamp) <= toDate
          );
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        set({ filteredMessages: filtered });
      },

      // Async Actions
      fetchDevices: async () => {
        try {
          const response = await deviceAPI.getAll();
          const deviceList = response.data.devices || [];
          set({ devices: deviceList });
          if (deviceList.length > 0) {
            set({ selectedDevice: deviceList[0] });
          }
        } catch (error) {
          console.error('Error fetching devices:', error);
          toast.error('Failed to load devices');
        }
      },

      syncMessagesFromDevice: async (deviceId: string) => {
        if (!deviceId) return;
        
        set({ isSyncing: true });
        try {
          const response = await authFetch(`/api/sms/sync/${deviceId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.success) {
            throw new Error(`Sync failed: ${response.statusText}`);
          }

          toast.success('Messages synced successfully from device');
          
          // Reload messages after sync
          await get().loadMessages();
        } catch (error) {
          console.error('Failed to sync messages from device:', error);
          toast.error('Failed to sync messages from device');
        } finally {
          set({ isSyncing: false });
        }
      },

    }),
    {
      name: 'messages-storage',
      partialize: (state) => ({
        messages: state.messages,
        filters: state.filters,
        selectedDevice: state.selectedDevice,
      }),
    }
  )
);

// Helper function (moved from utils)
export const decodeBase64 = (str: string): string => {
  try {
    return atob(str);
  } catch {
    return str;
  }
};