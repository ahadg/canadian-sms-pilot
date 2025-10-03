import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  campaignUpdates: any[];
  notifications: any[];
  devicesStatus: Record<string, any>;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (notificationId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  campaignUpdates: [],
  notifications: [],
  devicesStatus: {},

  connect: () => {
    const { user, token } = useAuthStore.getState();
    
    if (!user || !token) {
      console.warn('No user or token available for socket connection');
      return;
    }

    // Prevent duplicate connections
    if (get().socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const socket = io(import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000', {
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
      
      // Join user-specific room
      socket.emit('join-user-room', user._id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      set({ isConnected: false });
    });

    socket.on('campaign-update', (data: any) => {
      console.log('Received campaign update:', data);
      set(state => ({
        campaignUpdates: [...state.campaignUpdates, data]
      }));
      
      // Add as notification if it's important
      if (data.updates.status === 'completed' || data.updates.status === 'failed') {
        get().addNotification({
          id: `campaign-${data.campaignId}-${Date.now()}`,
          type: data.updates.status === 'completed' ? 'success' : 'error',
          title: `Campaign ${data.updates.status}`,
          message: `Campaign "${data.campaignId}" has ${data.updates.status}`,
          time: new Date().toISOString(),
          unread: true,
          data: data
        });
      }
    });

    socket.on('device-status-update', (data: any) => {
      console.log('Received device status update:', data);
      set(state => ({
        devicesStatus: {
          ...state.devicesStatus,
          [data.deviceId]: data.status
        }
      }));

      // Add notification for device status changes
      if (data.status === 'offline' || data.status === 'error') {
        get().addNotification({
          id: `device-${data.deviceId}-${Date.now()}`,
          type: data.status === 'offline' ? 'error' : 'warning',
          title: `Device ${data.status}`,
          message: `Device "${data.deviceId}" is ${data.status}`,
          time: new Date().toISOString(),
          unread: true,
          data: data
        });
      }
    });

    socket.on('new-message', (data: any) => {
      console.log('Received new message:', data);
      get().addNotification({
        id: `message-${data.messageId}-${Date.now()}`,
        type: 'info',
        title: 'New Message Received',
        message: `From: ${data.from}`,
        time: new Date().toISOString(),
        unread: true,
        data: data
      });
    });

    socket.on('system-notification', (data: any) => {
      console.log('Received system notification:', data);
      get().addNotification({
        id: `system-${Date.now()}`,
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        time: new Date().toISOString(),
        unread: true,
        data: data
      });
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


  addNotification: (notification: any) => {
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 50) // Keep last 50 notifications
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  markNotificationAsRead: (notificationId: string) => {
    set(state => ({
      notifications: state.notifications.map(notif =>
        notif.id === notificationId ? { ...notif, unread: false } : notif
      )
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notif => ({ ...notif, unread: false }))
    }));
  }
}));