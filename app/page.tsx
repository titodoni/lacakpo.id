'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { StatCard } from '@/components/StatCard';
import { ActivityLogItem } from '@/components/ActivityLogItem';
import { AlertTriangle, CheckCircle2, Clock, Package, Plus, ListTodo, ClipboardList, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  poList: POItem[];
  totalPOCount: number;
}

interface POItem {
  id: string;
  poNumber: string;
  clientName: string;
  deliveryDeadline: string | null;
  daysLeft: number | null;
  urgency: 'overdue' | 'today' | 'urgent' | 'warning' | 'normal';
  isUrgent: boolean;
  itemCount: number;
  firstItemName: string;
  firstItemQty: number;
  firstItemUnit: string;
  avgProgress: number;
  tracks: { department: string; progress: number }[];
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

  const deptLabel: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Pembelian',
    production: 'Produksi',
    qc: 'QC',
  };

  // Role-based permissions
  const canCreatePO = ['sales_admin', 'super_admin'].includes(user.role);
  const isAdmin = user.role === 'super_admin';
  const hasDepartment = ['drafter', 'purchasing', 'cnc_operator', 'milling_operator', 'fab_operator', 'qc'].includes(user.role);

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <h1 className="text-2xl font-bold text-zinc-900">
            Selamat datang, {user.name}
          </h1>
          <p className="text-zinc-500 mt-1">
            {user.role === 'super_admin' ? 'Akses Penuh' : 
             hasDepartment ? `Departemen ${deptLabel[user.department] || user.department}` : 
             'Akses View Only'}
          </p>
        </div>

        {/* Quick Action Cards - TOP SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="Daftar PO"
            description="Lihat semua PO"
            href="/pos"
            icon={ClipboardList}
            color="bg-blue-50 text-blue-600"
          />
          {hasDepartment && (
            <QuickActionCard
              title="Tugas Saya"
              description="Update progress"
              href="/tasks"
              icon={ListTodo}
              color="bg-amber-50 text-amber-600"
            />
          )}
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

        {/* My Department Stats - Only for department users */}
        {hasDepartment && data?.stats.myDeptStats && (
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Departemen Saya: {deptLabel[data.stats.myDeptStats.department]}
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

        {/* PO List - Top 5 Projects */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Purchase Order Aktif</h2>
                <p className="text-sm text-zinc-500">
                  {data?.totalPOCount || 0} total PO • Diurutkan deadline terdekat
                </p>
              </div>
              {canCreatePO && (
                <a 
                  href="/pos/new" 
                  className="flex items-center gap-1 text-sm text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Buat PO
                </a>
              )}
            </div>
          </div>

          {data?.poList && data.poList.length > 0 ? (
            <div className="divide-y divide-zinc-200">
              {data.poList.map((po) => (
                <POCard key={po.id} po={po} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500">Tidak ada Purchase Order aktif</p>
              {canCreatePO && (
                <a
                  href="/pos/new"
                  className="inline-flex items-center gap-2 mt-3 text-zinc-900 font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Buat PO Baru
                </a>
              )}
            </div>
          )}

          {/* Show More Link */}
          {(data?.totalPOCount || 0) > 5 && (
            <div className="p-4 border-t border-zinc-200 bg-zinc-50">
              <a
                href="/pos"
                className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Lihat semua {data?.totalPOCount} PO →
              </a>
            </div>
          )}
        </div>

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

function POCard({ po }: { po: POItem }) {
  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'today':
        return 'bg-red-100 text-red-700';
      case 'urgent':
        return 'bg-amber-100 text-amber-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  };

  const getUrgencyLabel = (urgency: string, daysLeft: number | null) => {
    switch (urgency) {
      case 'overdue':
        return `Terlambat ${Math.abs(daysLeft || 0)}h`;
      case 'today':
        return 'Hari Ini';
      case 'urgent':
        return `${daysLeft}h lagi`;
      case 'warning':
        return `${daysLeft}h lagi`;
      default:
        return daysLeft !== null ? `${daysLeft}h lagi` : '-';
    }
  };

  return (
    <a
      href={`/pos/${po.id}`}
      className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors gap-4"
    >
      {/* Left: Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-zinc-900 truncate">
            {po.firstItemName}
          </h3>
          {po.itemCount > 1 && (
            <span className="text-xs text-zinc-400">+{po.itemCount - 1}</span>
          )}
          {po.isUrgent && (
            <span className="text-xs">🔥</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
            {po.poNumber}
          </span>
          <span>•</span>
          <span className="truncate">{po.clientName}</span>
        </div>
      </div>

      {/* Right: Progress & Due Date */}
      <div className="flex items-center gap-4">
        {/* Progress Percentage */}
        <span className={cn(
          'text-sm font-bold font-mono',
          po.avgProgress === 100 ? 'text-emerald-600' : 'text-zinc-700'
        )}>
          {po.avgProgress}%
        </span>

        {/* Due Date Badge */}
        <span className={cn(
          'px-2 py-1 text-xs font-medium rounded',
          getUrgencyStyles(po.urgency)
        )}>
          {getUrgencyLabel(po.urgency, po.daysLeft)}
        </span>
      </div>
    </a>
  );
}
