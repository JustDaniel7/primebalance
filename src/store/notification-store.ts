// src/store/notification-store.ts
import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  taskId: string | null;
  riskId: string | null;
  actorId: string | null;
  actorName: string | null;
  recipientId: string;
  isRead: boolean;
  readAt: string | null;
  timestamp: string;
  task?: {
    id: string;
    title: string;
  } | null;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Fetch
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;

  // Actions
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // UI
  clearError: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isInitialized: false,
  error: null,

  // =====================================================================
  // FETCH
  // =====================================================================

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const url = unreadOnly
        ? '/api/notifications?unreadOnly=true'
        : '/api/notifications';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('fetchNotifications error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // =====================================================================
  // ACTIONS
  // =====================================================================

  markAsRead: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('markAsRead error:', error);
      set({ error: (error as Error).message });
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('markAllAsRead error:', error);
      set({ error: (error as Error).message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete notification');

      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.isRead;
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('deleteNotification error:', error);
      set({ error: (error as Error).message });
    }
  },

  // =====================================================================
  // UI
  // =====================================================================

  clearError: () => set({ error: null }),
}));
