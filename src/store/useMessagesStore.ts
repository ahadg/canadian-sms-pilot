import { create } from 'zustand';
import { authFetch, deviceAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Device } from '@/hooks/useCampaigns';
import { EjoinAPI } from '@/lib/api/ejoin';

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
  lastDirection?: 'inbound' | 'outbound';
  unreadCount: number;
  messageCount: number;
  simId: string;
  isReport: boolean;
  messages?: ReceivedSMS[];
  contact?: {
    isReport: boolean;
  };
  sim?: any
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
  isConversationLoading: boolean;
  conversationsHasMore: boolean;
  conversationsOffset: number;
  isLoadingMoreConversations: boolean;
  totalConversations: number;
  
  // Actions
  setConversationLoading: (loading: boolean) => void;
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
  fetchConversations: (deviceId: string, options?: { append?: boolean }) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  resetConversationPagination: () => void;
  fetchConversation: (simId,contactId,phoneNumber: string, port: number, slot: number, deviceId: string) => Promise<void>;
  
  // Async Actions
  fetchDevices: () => Promise<void>;
  syncMessagesFromDevice: (deviceId: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  clearFilters: () => void;
  filterMessages: (activeTab: string) => void;
  shouldUpdateCurrentConversation: (message: ReceivedSMS) => boolean;
  updateCurrentConversationWithMessage: (message: ReceivedSMS) => void;
  markConversationAsRead: (phoneNumber: string, port: number, slot: number) => void;
}

interface SendSMSParams {
  device: object;
  port: number;
  slot: number;
  to: string;
  sms: string;
  contact?: any
}

const initialFilters: InboxFilters = {
  search: '',
  status: 'all',
  direction: 'all',
  dateFrom: '',
  dateTo: ''
};

const CONVERSATIONS_PAGE_SIZE = 100;

export const useMessagesStore = create<MessagesState>((set, get) => ({
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
  isConversationLoading: false,
  conversationsHasMore: false,
  conversationsOffset: 0,
  isLoadingMoreConversations: false,
  totalConversations: 0,

  // Sync State Actions
  setConversationLoading: (isConversationLoading) => set({ isConversationLoading }),
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
  resetConversationPagination: () => set({
    conversations: [],
    conversationsHasMore: false,
    conversationsOffset: 0,
    isLoadingMoreConversations: false,
    totalConversations: 0,
  }),

  // Filter Actions
  updateFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value }
    }));
  },

  clearFilters: () => {
    set({ filters: initialFilters });
  },

  fetchConversations: async (deviceId: string, options = {}) => {
    const { append = false } = options;
    const currentOffset = append ? get().conversationsOffset : 0;
    const includeTotal = !append;

    if (append) {
      set({ isLoadingMoreConversations: true });
    }

    try {
      const response = await authFetch(
        `/api/sms/conversations?deviceId=${deviceId}&limit=${CONVERSATIONS_PAGE_SIZE}&offset=${currentOffset}&includeTotal=${includeTotal}`
      );
      console.log("fetchConversations_response", response);
      
      if (response.code !== 200) {
        throw new Error('Failed to fetch conversations');
      }

      const nextConversations = response.data.conversations || [];
      const pagination = response.data.pagination || {};

      set((state) => ({
        conversations: append
          ? [...state.conversations, ...nextConversations]
          : nextConversations,
        conversationsHasMore: Boolean(pagination.hasMore),
        conversationsOffset: Number.isFinite(pagination.nextOffset)
          ? pagination.nextOffset
          : currentOffset + nextConversations.length,
        totalConversations: Number.isFinite(pagination.total)
          ? pagination.total
          : append
            ? state.totalConversations
            : nextConversations.length,
      }));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      if (append) {
        set({ isLoadingMoreConversations: false });
      }
    }
  },

  loadMoreConversations: async () => {
    const { selectedDevice, conversationsHasMore, isLoadingMoreConversations, fetchConversations } = get();

    if (!selectedDevice || !conversationsHasMore || isLoadingMoreConversations) {
      return;
    }

    await fetchConversations(selectedDevice._id, { append: true });
  },

  fetchConversation: async (simId : string,contactId : string,phoneNumber: string, port: number, slot: number, deviceId: string) => {
    const { setConversationLoading, setCurrentConversation } = get();
    
    setConversationLoading(true);
    try {
      const response = await authFetch(
        `/api/sms/conversation?simId=${simId}&contactId=${contactId}&phoneNumber=${phoneNumber}&port=${port}&slot=${slot}&deviceId=${deviceId}`
      );
      
      console.log("fetchConversation response:", response);
      
      if (response.code !== 200) {
        throw new Error('Failed to fetch conversation');
      }
  
      // Ensure we have messages array
      const messages = response.data.messages || response.data || [];
      
      // Sort messages by timestamp (oldest first for proper display)
      const sortedMessages = messages.sort((a: ReceivedSMS, b: ReceivedSMS) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  
      const conversation: Conversation = {
        phoneNumber,
        port,
        slot,
        lastMessage: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].sms : '',
        lastTimestamp: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].timestamp : '',
        unreadCount: sortedMessages.filter((msg: ReceivedSMS) => !msg.read && msg.direction === 'inbound').length,
        messageCount: sortedMessages.length,
        messages: sortedMessages,
        contact: response.contact || { isReport: false },
        simId: `${port}-${slot}`,
        isReport: response.data.contact?.isReport || false,
        sim : response.data.sim
      };
  
      console.log("Processed conversation:", conversation);
      setCurrentConversation(conversation);
      
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      toast.error('Failed to load conversation');
      setCurrentConversation(null);
    } finally {
      setConversationLoading(false);
    }
  },

  sendSMS: async (params: SendSMSParams) => {
    const { device, port, slot, to, sms, contact } = params;
    const { currentConversation, conversations, setMessages, setConversations, setCurrentConversation } = get();
    
    set({ isLoading: true });
    try {
      // Step 1: Send SMS via device using EjoinAPI
      const tasks = [{
        id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`), 
        from: port, 
        recipients: [to], 
        sms
      }];
      
      const ejoinResponse = await EjoinAPI.submitSmsTasks(device, tasks);
  
      if (ejoinResponse?.[0]?.reason !== "OK") {
        throw new Error('Failed to send SMS via device');
      }
  
      // Step 2: Save to database via your backend API
      const saveResponse = await authFetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          deviceId: device._id,
          port,
          slot,
          to,
          sms,
          contactId: contact?._id
        })
      });
  
      // Parse the response properly
      const result = saveResponse;
      
      if (!result.success) {
        throw new Error('Failed to save SMS to database');
      }
  
      // Create the new message object
      const newMessage: ReceivedSMS = {
        id: result.data?.id || `temp-${Date.now()}`,
        port,
        slot,
        timestamp: new Date().toISOString(),
        from: `${port}`, // This should be the sender number, adjust as needed
        to,
        sms,
        status: 'delivered',
        direction: 'outbound',
        read: true,
        isReport: false
      };
  
      // Update messages state
      set((state) => ({
        messages: [...state.messages, newMessage]
      }));
  
      // Update conversations if we have a current conversation
      if (currentConversation && 
          currentConversation.phoneNumber === to && 
          currentConversation.port === port && 
          currentConversation.slot === slot) {
        
        const updatedConversation: Conversation = {
          ...currentConversation,
          lastMessage: sms,
          lastTimestamp: newMessage.timestamp,
          messageCount: currentConversation.messageCount + 1,
          messages: [...(currentConversation.messages || []), newMessage]
        };
  
        setCurrentConversation(updatedConversation);
  
        // Update conversations list
        const updatedConversations = conversations.map(conv =>
          conv.phoneNumber === to && conv.port === port && conv.slot === slot
            ? updatedConversation
            : conv
        );
        
        setConversations(updatedConversations);
      } else {
        // If no current conversation matches, refresh conversations
        await get().fetchConversations(device._id);
      }
  
      toast.success('Message sent successfully');
      return newMessage;
      
    } catch (error) {
      console.error('Failed to send SMS:', error);
      toast.error('Failed to send SMS: ' + (error.message || 'Unknown error'));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      const { messages, selectedMessage, currentConversation } = get();
      
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      );
      
      const updatedSelectedMessage = selectedMessage?.id === messageId 
        ? { ...selectedMessage, read: true } 
        : selectedMessage;

      // Update current conversation if the message is in it
      let updatedCurrentConversation = currentConversation;
      if (currentConversation && currentConversation.messages?.some(msg => msg.id === messageId)) {
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

  loadMessages: async () => {
    set({ isLoading: true });
    try {
      const { selectedDevice, fetchConversations, resetConversationPagination } = get();
      
      if (!selectedDevice) {
        throw new Error('No device selected');
      }

      // First try to get messages from the API
      const apiResponse = await authFetch(`/api/sms?deviceId=${selectedDevice._id}&limit=1000`);
      
      if (apiResponse && apiResponse.code == 200) {
        const messagesData = apiResponse.data.messages || [];
        set({ messages: messagesData });
        
        // Fetch conversations after loading messages
        resetConversationPagination();
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

  shouldUpdateCurrentConversation: (message: ReceivedSMS) => {
    const { currentConversation } = get();
    if (!currentConversation) return false;

    // Check if message belongs to current conversation
    const isSameConversation = 
      // For inbound messages, check if from matches conversation phone number
      (message.direction === 'inbound' && currentConversation.phoneNumber === message.from) ||
      // For outbound messages, check if to matches conversation phone number
      (message.direction === 'outbound' && currentConversation.phoneNumber === message.to) &&
      // Check same SIM (port and slot)
      currentConversation.port === message.port &&
      currentConversation.slot === message.slot;

    return isSameConversation;
  },

  updateCurrentConversationWithMessage: (message: ReceivedSMS) => {
    const { currentConversation, setCurrentConversation } = get();
    if (!currentConversation) return;

    // Create updated conversation with new message
    const updatedConversation: Conversation = {
      ...currentConversation,
      lastMessage: message.sms,
      lastTimestamp: message.timestamp,
      unreadCount: message.direction === 'inbound' && !message.read ? 
        currentConversation.unreadCount + 1 : currentConversation.unreadCount,
      messageCount: currentConversation.messageCount + 1,
      messages: [message, ...(currentConversation.messages || [])]
    };

    setCurrentConversation(updatedConversation);
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

  markConversationAsRead: (phoneNumber: string, port: number, slot: number) => {
    const { messages, setMessages, conversations, setConversations, currentConversation, setCurrentConversation } = get();
    
    // Update messages - mark as read only for this specific conversation
    const updatedMessages = messages.map(msg => 
      ((msg.direction === 'inbound' && msg.from === phoneNumber) ||
       (msg.direction === 'outbound' && msg.to === phoneNumber)) &&
      msg.port === port &&
      msg.slot === slot &&
      !msg.read
        ? { ...msg, read: true }
        : msg
    );
    
    // Update conversations - reset unread count only for this specific conversation
    const updatedConversations = conversations.map(conv =>
      conv.phoneNumber === phoneNumber &&
      conv.port === port &&
      conv.slot === slot
        ? { ...conv, unreadCount: 0 }
        : conv
    );

    // Update current conversation if it matches
    let updatedCurrentConversation = currentConversation;
    if (currentConversation && 
        currentConversation.phoneNumber === phoneNumber &&
        currentConversation.port === port &&
        currentConversation.slot === slot) {
      updatedCurrentConversation = {
        ...currentConversation,
        unreadCount: 0
      };
    }
    
    setMessages(updatedMessages);
    setConversations(updatedConversations);
    setCurrentConversation(updatedCurrentConversation);
  },
}));

export const decodeBase64 = (str: string): string => {
  try {
    const base64Regex = /^[A-Za-z0-9+/=]+$/;

    if (str && str.length % 4 === 0 && base64Regex.test(str)) {
      const decoded = atob(str);
      const englishRegex = /^[\x20-\x7E\s]+$/;
      if (englishRegex.test(decoded)) {
        return decoded;
      }
    }
    return str;
  } catch {
    return str;
  }
};
