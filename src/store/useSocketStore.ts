// store/useSocketStore.ts - Simplified version
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';
import { decodeBase64, useMessagesStore } from './useMessagesStore';
import { toast } from 'sonner';
import { useNavigationStore } from './useNavigationStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  campaignUpdates: any[];
  devicesStatus: Record<string, any>;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  emitEvent: (event: string, data: any) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  campaignUpdates: [],
  devicesStatus: {},

  connect: () => {
    const { user, token } = useAuthStore.getState();
    const { addNotification, fetchNotifications } = useNotificationStore.getState();
    const { navigateToSection } = useNavigationStore.getState();

    const { 
      messages, 
      setMessages, 
      fetchConversations,
      currentConversation,
      selectedDevice 
    } = useMessagesStore.getState();
    
    if (!user || !token) {
      console.warn('No user or token available for socket connection');
      return;
    }

    // Prevent duplicate connections
    if (get().socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const socket = io(import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://212.56.32.203:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      set({ isConnected: true });
      
      // Join user-specific room only
      socket.emit('join-user-room', user._id);
      console.log(`Joined user room: user:${user._id}`);
      
      // Fetch initial notifications
      fetchNotifications();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      set({ isConnected: false });
    });

    // Handle real-time SMS reception
    // In your useSocketStore.ts - Complete sms-received handler
    socket.on('sms-received', (data: any) => {
      console.log('Received real-time SMS via user room:', data);
      
      const { 
        messages, 
        setMessages, 
        fetchConversations,
        currentConversation,
        selectedDevice,
        conversations,
        setConversations,
        fetchConversation,
        markAsRead
      } = useMessagesStore.getState();
    
      // Add new message to messages list
      const newMessage: any = {
        id: data._id || data.id || `msg-${Date.now()}-${Math.random()}`,
        port: data.port || data.sim?.port,
        slot: data.slot || data.sim?.slot,
        timestamp: data.timestamp || new Date().toISOString(),
        from: data.from,
        to: data.to,
        sms: data.sms,
        status: data.status || 'delivered',
        direction: data.direction || 'inbound',
        read: data.read || false,
        isReport: data.isReport || false,
        sim: data.sim || { port: data.port, slot: data.slot }
      };
    
      console.log('Processed new message:', newMessage);
    
      // Update messages list (new messages at top)
      const updatedMessages = [newMessage, ...messages];
      setMessages(updatedMessages);
    
      // Update conversations state with new message
      const phoneNumber = data.direction === 'inbound' ? data.from : data.to;
      const port = data.sim?.port || data.port;
      const slot = data.sim?.slot || data.slot;
      
      // Find if this conversation already exists
      const existingConversationIndex = conversations.findIndex(conv =>
        conv.phoneNumber === phoneNumber &&
        conv.port === port &&
        conv.slot === slot
      );
    
      if (existingConversationIndex !== -1) {
        // Update existing conversation
        const updatedConversations = [...conversations];
        const existingConv = updatedConversations[existingConversationIndex];
        
        updatedConversations[existingConversationIndex] = {
          ...existingConv,
          lastMessage: newMessage.sms,
          lastTimestamp: newMessage.timestamp,
          unreadCount: newMessage.direction === 'inbound' && !newMessage.read ? 
            existingConv.unreadCount + 1 : existingConv.unreadCount,
          messageCount: existingConv.messageCount + 1
        };
        
        // Move updated conversation to top of the list
        const [updatedConversation] = updatedConversations.splice(existingConversationIndex, 1);
        updatedConversations.unshift(updatedConversation);
        
        setConversations(updatedConversations);
      } else {
        // Create new conversation
        const newConversation: any = {
          phoneNumber: phoneNumber,
          port: port,
          slot: slot,
          lastMessage: newMessage.sms,
          lastTimestamp: newMessage.timestamp,
          unreadCount: newMessage.direction === 'inbound' && !newMessage.read ? 1 : 0,
          messageCount: 1,
          simId: `${port}-${slot}`
        };
        
        // Add new conversation to top of the list
        setConversations([newConversation, ...conversations]);
      }
    
      // Check if the new message belongs to the current conversation
      const shouldUpdateCurrentConversation = currentConversation && 
        (
          // Check if same phone number (considering both inbound and outbound)
          (data.direction === 'inbound' && currentConversation.phoneNumber === data.from) ||
          (data.direction === 'outbound' && currentConversation.phoneNumber === data.to)
        ) &&
        currentConversation.port === (data.sim?.port || data.port) &&
        currentConversation.slot === (data.sim?.slot || data.slot);
    
      console.log('Should update current conversation:', shouldUpdateCurrentConversation, {
        currentConversation,
        newMessageDirection: data.direction,
        currentPhone: currentConversation?.phoneNumber,
        messageFrom: data.from,
        messageTo: data.to,
        portMatch: currentConversation?.port === (data.sim?.port || data.port),
        slotMatch: currentConversation?.slot === (data.sim?.slot || data.slot)
      });
    
      // If current conversation matches the new message, update it
      if (shouldUpdateCurrentConversation && selectedDevice) {
        console.log('Updating current conversation with new message');
        
        // Update locally for immediate UI update
        if (currentConversation) {
          newMessage.read = true;
          const updatedConversation: any = {
            ...currentConversation,
            lastMessage: newMessage.sms,
            lastTimestamp: newMessage.timestamp,
            // unreadCount: newMessage.direction === 'inbound' && !newMessage.read ? 
            //   currentConversation.unreadCount + 1 : currentConversation.unreadCount,
            //messageCount: currentConversation.messageCount + 1,
            messages: [...currentConversation.messages, newMessage] // Add to end for chronological order
          };
          useMessagesStore.getState().setCurrentConversation(updatedConversation);
          markAsRead(newMessage.id);
        }
      } else if (currentConversation) {
        console.log('Message does not belong to current conversation', {
          currentPhone: currentConversation.phoneNumber,
          messageFrom: data.from,
          messageTo: data.to,
          direction: data.direction
        });
      }
    
      // Get current active section from App state to check if user is on inbox
      const isUserOnInbox = window.location.pathname.includes('inbox') || 
                          window.__ACTIVE_SECTION__ === 'inbox';
    
      console.log('User on inbox section:', isUserOnInbox);
    
      // Only show toast if user is NOT on inbox section OR if not viewing this specific conversation
      const isViewingThisConversation = shouldUpdateCurrentConversation;
      
      if (!isUserOnInbox || !isViewingThisConversation) {
        toast.info(`New message from ${data.from}`, {
          description: data.sms ? decodeBase64(data.sms).substring(0, 50) + (decodeBase64(data.sms).length > 50 ? '...' : '') : 'No content',
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to inbox or focus the app
              useNavigationStore.getState().navigateToSection('inbox');
            }
          }
        });
      }
    });

    socket.on('campaign-update', (data: any) => {
      console.log('Received campaign update:', data);
      set(state => ({
        campaignUpdates: [...state.campaignUpdates, data]
      }));
    });

    socket.on('device-status-update', (data: any) => {
      console.log('Received device status update:', data);
      set(state => ({
        devicesStatus: {
          ...state.devicesStatus,
          [data.deviceId]: data.status
        }
      }));
    });

    socket.on('new-notification', (data: any) => {
      console.log('Received new notification:', data);
      addNotification({
        id: data.id,
        _id: data._id || data.id,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        time: data.time || new Date().toISOString(),
        unread: true,
        data: data.data
      });
    });

    socket.on('system-notification', (data: any) => {
      console.log('Received system notification:', data);
      addNotification({
        id: `system-${Date.now()}`,
        _id: data._id || data.id ,
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        time: new Date().toISOString(),
        unread: true,
        data: data
      });
    });

    // Listen for notification updates from server
    socket.on('notifications-updated', () => {
      console.log('Notifications updated, refreshing...');
      fetchNotifications();
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  emitEvent: (event: string, data: any) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }
}));