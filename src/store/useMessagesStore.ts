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

      // Sync State Actions
      setMessages: (messages) => set({ messages }),
      setFilteredMessages: (filteredMessages) => set({ filteredMessages }),
      setSelectedMessage: (selectedMessage) => set({ selectedMessage }),
      setLoading: (isLoading) => set({ isLoading }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setFilters: (filters) => set({ filters }),
      setDevices: (devices) => set({ devices }),
      setSelectedDevice: (selectedDevice) => set({ selectedDevice }),

      // Filter Actions
      updateFilter: (key, value) => {
        const { filters } = get();
        const newFilters = { ...filters, [key]: value };
        set({ filters: newFilters });
      },

      clearFilters: () => {
        set({ filters: initialFilters });
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

      loadMessages: async () => {
        set({ isLoading: true });
        try {
          const { selectedDevice, syncMessagesFromDevice } = get();
          
          // First try to get messages from the API
          let messagesData: ReceivedSMS[] = [];
          
          try {
            const apiResponse = await authFetch('/api/sms');
            console.log("apiResponse",apiResponse)
            if (apiResponse) {
              const apiData = apiResponse.data;
              messagesData = apiData.messages || apiData.smses || [];
              
              // If no messages found in API, try to sync from device
              if (messagesData.length === 0 && selectedDevice) {
                toast.info('No messages found in database, syncing from device...');
                await syncMessagesFromDevice(selectedDevice._id);
                return; // Exit early as sync will trigger reload
              }
            }
          } catch (apiError) {
            console.warn('Failed to fetch messages from API, trying device sync:', apiError);
            
            // If API fails, try to get messages directly from device
            if (selectedDevice) {
              toast.info('Fetching messages directly from device...');
              await syncMessagesFromDevice(selectedDevice._id);
              return; // Exit early as sync will trigger reload
            }
          }

          // If we have messages from API, set them
          if (messagesData.length > 0) {
            set({ messages: messagesData });
          }
          
        } catch (error) {
          console.error('Failed to load messages:', error);
          toast.error('Failed to load messages');
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (messageId: string) => {
        try {
          const { messages, selectedMessage } = get();
          
          const updatedMessages = messages.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          );
          
          const updatedSelectedMessage = selectedMessage?.id === messageId 
            ? { ...selectedMessage, read: true } 
            : selectedMessage;

          set({ 
            messages: updatedMessages,
            selectedMessage: updatedSelectedMessage
          });
          
          // Optional: Send API request to mark as read
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