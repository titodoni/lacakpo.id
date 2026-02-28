import { create } from 'zustand';

export type NotificationType = 'progress' | 'issue' | 'delivery' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  itemName?: string;
  poNumber?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, dedupKey?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const MAX_NOTIFICATIONS = 50;
const DEDUP_WINDOW_MS = 5000; // 5 seconds

// Track recent notification keys to prevent duplicates
const recentKeys = new Map<string, number>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const lastSeen = recentKeys.get(key);
  
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true; // Duplicate within window
  }
  
  recentKeys.set(key, now);
  
  // Cleanup old entries
  for (const [k, t] of recentKeys.entries()) {
    if (now - t > DEDUP_WINDOW_MS) {
      recentKeys.delete(k);
    }
  }
  
  return false;
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notificationData, dedupKey) => set((state) => {
    // Check for duplicates if key provided
    if (dedupKey && isDuplicate(dedupKey)) {
      console.log('[Notification] Duplicate prevented:', dedupKey);
      return state;
    }

    const newNotification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    let updatedNotifications = [newNotification, ...state.notifications];

    // Keep max 50 notifications, remove oldest
    if (updatedNotifications.length > MAX_NOTIFICATIONS) {
      updatedNotifications = updatedNotifications.slice(0, MAX_NOTIFICATIONS);
    }

    return {
      notifications: updatedNotifications,
      unreadCount: state.unreadCount + 1,
    };
  }),

  markAsRead: (id) => set((state) => {
    const notification = state.notifications.find(n => n.id === id);
    if (!notification || notification.read) return state;

    return {
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    };
  }),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  clearAll: () => set({
    notifications: [],
    unreadCount: 0,
  }),
}));
