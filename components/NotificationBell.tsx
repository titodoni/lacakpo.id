'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Bell, Check, TrendingUp, AlertTriangle, Package, Info, X } from 'lucide-react';
import { useNotificationsStore, type Notification, type NotificationType } from '@/store/notifications-store';
import { cn } from '@/lib/utils';

// Time ago in Indonesian
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs} detik lalu`;
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
}

const typeConfig: Record<NotificationType, { icon: typeof TrendingUp; color: string; bgColor: string }> = {
  progress: { icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  issue: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  delivery: { icon: Package, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  system: { icon: Info, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

const NotificationItem = memo(function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl transition-colors flex gap-3',
        'hover:bg-muted/50',
        !notification.read && 'border-l-4 border-primary bg-primary/5',
        notification.read && 'opacity-70'
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', !notification.read && 'text-foreground')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatTimeAgo(notification.timestamp)}
        </p>
      </div>
    </button>
  );
});

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl transition-colors',
          'hover:bg-sidebar-accent text-sidebar-fg',
          isOpen && 'bg-sidebar-accent'
        )}
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-2 border-t border-border bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">
                {notifications.length} notifikasi tersimpan
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
