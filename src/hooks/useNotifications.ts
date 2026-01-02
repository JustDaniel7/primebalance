// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notification-store';

export function useNotifications(options?: { autoFetch?: boolean; pollInterval?: number }) {
  const { autoFetch = true, pollInterval } = options || {};

  const {
    notifications,
    unreadCount,
    isLoading,
    isInitialized,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotificationStore();

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !isInitialized) {
      fetchNotifications();
    }
  }, [autoFetch, isInitialized, fetchNotifications]);

  // Optional polling for real-time updates
  useEffect(() => {
    if (!pollInterval) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isInitialized,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  };
}
