'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Shield,
  CheckCircle2,
  Search
} from 'lucide-react';

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

// Color Palette
const colors = {
  primary: '#003049',
  danger: '#d62828',
  accent: '#f77f00',
};

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
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 border-r" style={{ backgroundColor: '#ffffff', borderColor: colors.accent }}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.danger }}>
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: colors.primary }}>Tracking Proyek</h1>
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: colors.accent }}>
          <div className="mb-4 px-4">
            <p className="text-sm font-medium" style={{ color: colors.primary }}>{user.name}</p>
            <p className="text-xs capitalize" style={{ color: colors.accent }}>{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors"
            style={{ color: '#ea580c' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `'rgba(234,88,12,0.1)'`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} />
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b" style={{ backgroundColor: '#ffffff', borderColor: colors.accent }}>
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold" style={{ color: colors.primary }}>Tracking Proyek</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: colors.accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ea580c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t px-4 py-4" style={{ borderColor: colors.accent }}>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  {...item} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.accent }}>
              <p className="text-sm font-medium" style={{ color: colors.primary }}>{user.name}</p>
              <p className="text-xs capitalize" style={{ color: colors.accent }}>{user.role.replace('_', ' ')}</p>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-3 w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors"
                style={{ color: '#ea580c' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `'rgba(234,88,12,0.1)'`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={18} />
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t h-16 flex items-center justify-around px-4 z-50" style={{ backgroundColor: '#ffffff', borderColor: colors.accent }}>
        {navItems.map((item) => (
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
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all"
      style={{
        backgroundColor: isActive ? colors.danger : 'transparent',
        color: isActive ? 'white' : colors.accent,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#ea580c';
          e.currentTarget.style.color = colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.accent;
        }
      }}
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
      className="flex flex-col items-center gap-1 text-xs font-medium transition-colors"
      style={{ color: isActive ? colors.danger : '#ea580c' }}
    >
      <div 
        className="p-1.5 rounded-xl"
        style={{ 
          backgroundColor: isActive ? colors.danger : 'transparent',
          color: isActive ? 'white' : 'inherit'
        }}
      >
        <Icon size={20} />
      </div>
      <span>{label}</span>
    </a>
  );
}
