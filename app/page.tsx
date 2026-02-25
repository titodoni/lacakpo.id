'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { StatCard } from '@/components/StatCard';
import { ActivityLogItem } from '@/components/ActivityLogItem';
import { AlertTriangle, CheckCircle2, Clock, Package, ClipboardList, BarChart3 } from 'lucide-react';

interface DashboardData {
  stats: {
    totalItems: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    myDeptStats: {
      department: string;
      total: number;
      notStarted: number;
      inProgress: number;
      completed: number;
      averageProgress: number;
    } | null;
  };
  recentActivity: any[];
  urgentItems: any[];
}


export default function HomePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      // Redirect to role-specific pages
      const isViewerOnly = ['manager'].includes(user.role);
      const isAdmin = user.role === 'super_admin';
      const isFinance = user.role === 'finance';
      
      if (isFinance) {
        router.push('/finance');
        return;
      }
      
      if (!isViewerOnly && !isAdmin) {
        // Workers, operators, sales, etc. go to tasks
        router.push('/tasks');
        return;
      }
      // Admin and managers see dashboard
      fetchDashboard();
    }
  }, [user, userLoading, router]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Memuat...</p>
      </div>
    );
  }

  if (!user) return null;

  const userData = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    department: user.department,
    name: user.name,
    isLoggedIn: user.isLoggedIn,
  };

  // Role-based permissions
  const canCreatePO = ['sales_admin', 'super_admin'].includes(user.role);

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <h1 className="text-2xl font-bold text-zinc-900">
            Selamat datang, {user.name}
          </h1>
          <p className="text-zinc-500 mt-1">
            {user.role === 'super_admin' ? 'Akses Penuh' : 'Akses View Only'}
          </p>
        </div>

        {/* Quick Action Cards - TOP SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="Tugas"
            description="Lihat & update tugas"
            href="/tasks"
            icon={ClipboardList}
            color="bg-blue-50 text-blue-600"
          />
          <QuickActionCard
            title="Masalah"
            description="Lihat masalah dilaporkan"
            href="/issues"
            icon={AlertTriangle}
            color="bg-amber-50 text-amber-600"
          />
          <QuickActionCard
            title="Riwayat"
            description="Aktivitas terbaru"
            href="/logs"
            icon={Clock}
            color="bg-purple-50 text-purple-600"
          />
          <QuickActionCard
            title="Statistik"
            description="Laporan & data"
            href="/reports"
            icon={BarChart3}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            label="Total Item"
            value={data?.stats.totalItems || 0}
            color="bg-zinc-100"
          />
          <StatCard
            icon={Clock}
            label="Belum Mulai"
            value={data?.stats.notStarted || 0}
            color="bg-zinc-100"
          />
          <StatCard
            icon={AlertTriangle}
            label="Sedang Dikerjakan"
            value={data?.stats.inProgress || 0}
            color="bg-amber-50"
          />
          <StatCard
            icon={CheckCircle2}
            label="Selesai"
            value={data?.stats.completed || 0}
            color="bg-emerald-50"
          />
        </div>

        {/* Department Stats */}
        {data?.stats.myDeptStats && (
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Departemen: {data.stats.myDeptStats.department.charAt(0).toUpperCase() + data.stats.myDeptStats.department.slice(1)}
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {data.stats.myDeptStats.completed} selesai / {data.stats.myDeptStats.total} total
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold">
                  {data.stats.myDeptStats.averageProgress}%
                </span>
                <p className="text-zinc-400 text-sm">rata-rata progress</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${data.stats.myDeptStats.averageProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Aktivitas Terbaru</h2>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.slice(0, 5).map((log) => (
                <ActivityLogItem key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">Tidak ada aktivitas terbaru</p>
          )}
          <a
            href="/logs"
            className="block text-center text-sm text-zinc-600 hover:text-zinc-900 mt-4 pt-4 border-t border-zinc-100"
          >
            Lihat semua aktivitas →
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-2xl p-5 border border-zinc-200 hover:border-zinc-400 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-1">{description}</p>
    </a>
  );
}


