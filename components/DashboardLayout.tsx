'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  User
} from 'lucide-react';
import { PaletteSwitcherCompact } from './PaletteOptions';

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

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
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
    { href: '/search', icon: Search, label: 'Pencarian' },
    ...(canCreatePO ? [{ href: '/pos/new', icon: PlusCircle, label: 'Buat PO' }] : []),
    { href: '/issues', icon: AlertTriangle, label: 'Masalah' },
    ...(isAdmin ? [{ href: '/admin/users', icon: Shield, label: 'Admin' }] : []),
    ...((isAdmin || isViewer) ? [{ href: '/reports', icon: BarChart3, label: 'Laporan' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-sidebar-bg border-r border-sidebar-border">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-fg">lacakPO.id</h1>
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          {/* Theme Switcher */}
          <div className="mb-4 px-4">
            <PaletteSwitcherCompact />
          </div>
          
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-sidebar-fg">{user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user.role.replace('_', ' ')}</p>
          </div>
          
          <div className="flex gap-2 px-4">
            <a
              href="/profile"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg 
                bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <User size={16} />
              Profil
            </a>
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
      <header className="lg:hidden sticky top-0 z-50 bg-sidebar-bg border-b border-sidebar-border">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold text-sidebar-fg">lacakPO.id</h1>
          <div className="flex items-center gap-2">
            <PaletteSwitcherCompact />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-sidebar-border px-4 py-4 bg-sidebar-bg">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  {...item} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 px-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-fg">{user.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-2 px-4">
                <a
                  href="/profile"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg 
                    bg-muted text-foreground hover:bg-muted/80 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User size={16} />
                  Profil
                </a>
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
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-sidebar-border h-16 
        bg-sidebar-bg flex items-center justify-around px-4 z-50">
        {navItems.slice(0, 4).map((item) => (
          <MobileNavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({
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
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
        ${isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-sidebar-fg hover:bg-sidebar-accent'
        }`}
    >
      <Icon size={18} />
      {label}
    </a>
  );
}

function MobileNavLink({
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
    <a
      href={href}
      className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors
        ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <div 
        className={`p-1.5 rounded-xl transition-colors
          ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
      >
        <Icon size={20} />
      </div>
      <span>{label}</span>
    </a>
  );
}
