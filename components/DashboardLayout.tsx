'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  User,
  LogOut,
  Menu,
  X,
  Shield,
  CheckCircle2
} from 'lucide-react';
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
  
  const navItems = [
    { href: '/', icon: Home, label: 'Beranda' },
    { href: '/pos', icon: ClipboardList, label: 'Daftar PO' },
    ...(canCreatePO ? [{ href: '/pos/new', icon: PlusCircle, label: 'Buat PO' }] : []),
    ...(isAdmin ? [{ href: '/admin/users', icon: Shield, label: 'Admin' }] : []),
    { href: '/reports', icon: BarChart3, label: 'Statistik' },
    { href: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-200">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900">Tracking Proyek</h1>
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-zinc-900">{user.name}</p>
            <p className="text-xs text-zinc-500 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold text-zinc-900">Tracking Proyek</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-zinc-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-zinc-200 px-4 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  {...item} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <p className="text-sm font-medium text-zinc-900">{user.name}</p>
              <p className="text-xs text-zinc-500 capitalize">{user.role.replace('_', ' ')}</p>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-3 w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 h-16 flex items-center justify-around px-4 z-50">
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
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
        isActive 
          ? "bg-zinc-900 text-white" 
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
      )}
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
      className={cn(
        "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
        isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl",
        isActive ? "bg-zinc-900 text-white" : ""
      )}>
        <Icon size={20} />
      </div>
      <span>{label}</span>
    </a>
  );
}
