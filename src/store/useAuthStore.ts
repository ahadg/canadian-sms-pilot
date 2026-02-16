import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      // Login function
      login: async (email, password) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.reason || 'Login failed');
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
            loading: false,
          });

          return { success: true, data: data.data };
        } catch (error) {
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      // Register function
      register: async (email, password, name) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.reason || 'Registration failed');
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
            loading: false,
          });

          return { success: true, data: data.data };
        } catch (error) {
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      // Logout function
      logout: async () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      },

      // Check authentication status
      checkAuth: async () => {
        const { token } = get();

        if (!token) {
          set({ loading: false });
          return false;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.data.user,
              isAuthenticated: true,
              loading: false,
            });
            return true;
          } else {
            // Token is invalid, clear storage
            get().logout();
            return false;
          }
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // Update user profile
      updateProfile: async (updateData) => {
        const { token } = get();

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.reason || 'Update failed');
          }

          set({ user: data.data.user });
          return { success: true, data: data.data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        const { token } = get();

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.reason || 'Password change failed');
          }

          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      // Forgot password function
      forgotPassword: async (email) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.reason || 'Failed to send reset email');
          }

          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Reset password function
      resetPassword: async (token, newPassword) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.reason || 'Failed to reset password');
          }

          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: any) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);