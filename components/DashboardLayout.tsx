'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Shield,
  CheckCircle2,
  Search,
  User,
  Bell
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useNotificationsStore } from '@/store/notifications-store';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    userId: string;
    username: string;
    name: string;
    role: string;
    department: string;
    isLoggedIn: boolean;
  };
}

const DashboardLayout = memo(function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const canCreatePO = ['sales_admin', 'super_admin'].includes(user.role);
  const isAdmin = user.role === 'super_admin';
  const isViewer = ['manager'].includes(user.role);
  
  const navItems = [
    { href: '/tasks', icon: ClipboardList, label: 'Tugas' },
    { href: '/search', icon: Search, label: 'Cari' },
    ...(canCreatePO ? [{ href: '/pos/new', icon: PlusCircle, label: 'Buat PO' }] : []),
    { href: '/issues', icon: AlertTriangle, label: 'Masalah' },
    ...(isAdmin ? [{ href: '/admin/users', icon: Shield, label: 'Admin' }] : []),
    ...((isAdmin || isViewer) ? [{ href: '/reports', icon: BarChart3, label: 'Laporan' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-sidebar-bg border-r border-sidebar-border z-40">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-sidebar-fg">lacakPO.id</h1>
            </div>
            <NotificationBell />
          </div>
        </div>

        <nav className="px-4 pb-4 space-y-1">
          {navItems.map((item) => (
            <NavLink 
              key={item.href} 
              {...item} 
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar-bg">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-sidebar-fg truncate">{user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user.role.replace('_', ' ')}</p>
          </div>
          
          <div className="flex gap-2 px-4">
            <Link
              href="/profile"
              prefetch={true}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg 
                bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <User size={16} />
              Profil
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg 
                bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut size={16} />
              {isLoggingOut ? '...' : 'Keluar'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-14">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-bold text-foreground">lacakPO.id</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu - SOLID BACKGROUND, NOT TRANSPARENT */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/70 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel - SOLID WHITE BACKGROUND */}
          <div 
            className="lg:hidden fixed top-16 left-3 right-3 bg-white rounded-2xl z-50 overflow-hidden"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #e5e7eb'
            }}
          >
            {/* Navigation Links */}
            <nav className="p-2 bg-white">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  prefetch={true}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all mb-1
                    ${pathname === item.href 
                      ? 'bg-foreground text-white' 
                      : 'text-foreground hover:bg-muted'
                    }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* User Section - SOLID BACKGROUND */}
            <div className="p-3 bg-muted border-t border-border">
              <div className="flex items-center gap-3 px-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-2 px-3">
                <Link
                  href="/profile"
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl 
                    bg-white text-foreground border border-border hover:bg-muted transition-colors"
                >
                  <User size={16} />
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl 
                    bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <LogOut size={16} />
                  {isLoggingOut ? '...' : 'Keluar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border h-16 
        bg-white flex items-center justify-around px-2 z-40">
        {navItems.slice(0, 4).map((item) => (
          <MobileNavLink key={item.href} {...item} />
        ))}
        <MobileNotificationBell />
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-8 min-h-screen">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
});

export default DashboardLayout;

const NavLink = memo(function NavLink({
  href,
  icon: Icon,
  label,
  onClick,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      prefetch={true}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
        ${isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-sidebar-fg hover:bg-sidebar-accent'
        }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
});

const MobileNotificationItem = memo(function MobileNotificationItem({
  notification,
  onClick,
}: {
  notification: import('@/store/notifications-store').Notification;
  onClick: () => void;
}) {
  const { type, title, message, timestamp, read } = notification;
  
  const typeConfig = {
    progress: { icon: 'TrendingUp', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    issue: { icon: 'AlertTriangle', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    delivery: { icon: 'Package', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    system: { icon: 'Info', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  }[type];

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

  const IconMap: Record<string, React.ElementType> = {
    TrendingUp: ({ className }: { className?: string }) => (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    ),
    AlertTriangle: ({ className }: { className?: string }) => (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
    ),
    Package: ({ className }: { className?: string }) => (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    ),
    Info: ({ className }: { className?: string }) => (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
    ),
  };
  
  const Icon = IconMap[typeConfig.icon] || IconMap.Info;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl transition-colors flex gap-3',
        'hover:bg-muted/50',
        !read && 'border-l-4 border-primary bg-primary/5',
        read && 'opacity-70'
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', typeConfig.bgColor)}>
        <Icon className={cn('w-4 h-4', typeConfig.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', !read && 'text-foreground')}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatTimeAgo(timestamp)}
        </p>
      </div>
    </button>
  );
});

const MobileNavLink = memo(function MobileNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      prefetch={true}
      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors min-w-[60px] py-2
        ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      <div 
        className={`p-1.5 rounded-xl transition-colors
          ${isActive ? 'bg-foreground text-white' : ''}`}
      >
        <Icon size={20} />
      </div>
      <span className="truncate max-w-[60px]">{label}</span>
    </Link>
  );
});

const MobileNotificationBell = memo(function MobileNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();
  const displayCount = unreadCount > 9 ? '9+' : unreadCount;
  const recentNotifications = notifications.slice(0, 10);
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

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors min-w-[60px] py-2 text-muted-foreground"
      >
        <div className="relative p-1.5 rounded-xl">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {displayCount}
            </span>
          )}
        </div>
        <span className="truncate max-w-[60px]">Notif</span>
      </button>

      {/* Mobile Notification Panel - Full width from bottom */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div
            ref={panelRef}
            className="fixed bottom-20 left-3 right-3 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[70vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <h3 className="font-semibold text-sm">Notifikasi</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    Tandai baca
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-64 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {recentNotifications.map((notification) => (
                    <MobileNotificationItem
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
        </>
      )}
    </div>
  );
});


