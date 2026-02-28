'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, TrendingUp, AlertTriangle, Package, Info } from 'lucide-react';
import { useNotificationsStore, type NotificationType } from '@/store/notifications-store';
import { cn } from '@/lib/utils';

const typeConfig: Record<NotificationType, { icon: typeof TrendingUp; color: string; borderColor: string }> = {
  progress: { icon: TrendingUp, color: 'text-blue-500', borderColor: 'border-l-blue-500' },
  issue: { icon: AlertTriangle, color: 'text-amber-500', borderColor: 'border-l-amber-500' },
  delivery: { icon: Package, color: 'text-emerald-500', borderColor: 'border-l-emerald-500' },
  system: { icon: Info, color: 'text-muted-foreground', borderColor: 'border-l-border' },
};

interface Toast {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

const MAX_TOASTS = 3;
const TOAST_DURATION = 4000;

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { notifications } = useNotificationsStore();

  // Watch for new notifications and create toasts
  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];
    
    const newToast: Toast = {
      id: latestNotification.id,
      title: latestNotification.title,
      message: latestNotification.message,
      type: latestNotification.type,
    };

    setToasts((prev) => {
      // Prevent duplicate toasts
      if (prev.some(t => t.id === newToast.id)) return prev;
      
      // Add new toast at the beginning, keep max 3
      const updated = [newToast, ...prev].slice(0, MAX_TOASTS);
      return updated;
    });
  }, [notifications]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, TOAST_DURATION);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300); // Wait for exit animation
  };

  return (
    <div
      className={cn(
        'pointer-events-auto w-80 bg-card border border-border rounded-xl shadow-lg',
        'border-l-4 transition-all duration-300 ease-out',
        config.borderColor,
        isVisible && !isExiting && 'translate-x-0 opacity-100',
        !isVisible && !isExiting && 'translate-x-full opacity-0',
        isExiting && 'translate-x-full opacity-0'
      )}
    >
      <div className="p-4 flex gap-3">
        <div className="shrink-0">
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toast.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
