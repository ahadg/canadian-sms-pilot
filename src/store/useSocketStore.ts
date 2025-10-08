// store/useSocketStore.ts - Clean version without notifications
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';

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
      
      // Fetch initial notifications through notification store
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
        id: data.id || `notification-${Date.now()}`,
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