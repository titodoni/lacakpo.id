'use client';

import { useState, memo } from 'react';
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
  User
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
