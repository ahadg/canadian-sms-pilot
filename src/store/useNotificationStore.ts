// store/useNotificationStore.ts
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { authFetch } from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'system';
  time: string;
  unread: boolean;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  notificationsLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  
  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  markNotificationAsReadOnServer: (notificationId: string) => Promise<void>;
  markAllAsReadOnServer: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  notificationsLoading: false,
  hasMore: true,
  currentPage: 1,

  fetchNotifications: async (page = 1, limit = 50) => {
    try {
      set({ notificationsLoading: true });
      
      const response = await authFetch(`/api/notifications?page=${page}&limit=${limit}&sort=-createdAt`);
      console.log("response",response)
      if (response.code === 200) {
          const newNotifications = response.data.notifications;
          
          set({
            notifications: page === 1 ? newNotifications : [...get().notifications, ...newNotifications],
            hasMore: page < response.data.totalPages,
            currentPage: page,
            notificationsLoading: false
          });
      } else {
        set({ notificationsLoading: false });
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      set({ notificationsLoading: false });
      console.error('Failed to fetch notifications:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 100) // Keep last 100
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
  },

  markNotificationAsReadOnServer: async (notificationId: string) => {
    try {
      const response = await authFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (response.code === 200) {
        get().markNotificationAsRead(notificationId);
      } else {
        console.error('Failed to mark notification as read on server');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsReadOnServer: async () => {
    try {
      const response = await authFetch('/api/notifications/read-all', {
        method: 'PUT'
      });
      
      if (response.code === 200) {
        get().markAllAsRead();
      } else {
        console.error('Failed to mark all notifications as read on server');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await authFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.code === 200) {
        set(state => ({
          notifications: state.notifications.filter(notif => notif.id !== notificationId)
        }));
      } else {
        console.error('Failed to delete notification on server');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  clearAllNotifications: async () => {
    try {
      const response = await authFetch('/api/notifications', {
        method: 'DELETE'
      });
      
      if (response.code === 200) {
        set({ notifications: [] });
      } else {
        console.error('Failed to clear all notifications on server');
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => n.unread).length;
  }
}));