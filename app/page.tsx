'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { StatCard } from '@/components/StatCard';
import { AlertTriangle, CheckCircle2, Clock, Package, ClipboardList, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';

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
  openIssuesCount?: number;
  onTimeDeliveryRate?: number;
  todayLogsCount?: number;
  activeItemsCount?: number;
}

interface PO {
  id: string;
  poNumber: string;
  clientPoNumber: string | null;
  client: { name: string };
  poDate: string;
  deliveryDeadline: string | null;
  status: string;
  isUrgent: boolean;
  isVendorJob: boolean;
  vendorName: string | null;
  _count: { items: number };
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [poList, setPoList] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuCounts, setMenuCounts] = useState({
    tasks: 0,
    issues: 0,
    logs: 0,
    onTimeRate: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

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
      fetchPOList();
      fetchMenuCounts();
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

  const fetchMenuCounts = async () => {
    setCountsLoading(true);
    try {
      // Fetch active items count (not delivered)
      const itemsRes = await fetch('/api/items?status=active&isDelivered=false&limit=1');
      const itemsData = itemsRes.ok ? await itemsRes.json() : { total: 0 };

      // Fetch open issues count
      const issuesRes = await fetch('/api/issues?status=open&limit=1');
      const issuesData = issuesRes.ok ? await issuesRes.json() : { total: 0 };

      // Fetch today's logs count
      const today = new Date().toISOString().split('T')[0];
      const logsRes = await fetch(`/api/logs?date=${today}&limit=1`);
      const logsData = logsRes.ok ? await logsRes.json() : { total: 0 };

      // Fetch on-time delivery rate from reports API
      const reportsRes = await fetch('/api/reports/dashboard');
      const reportsData = reportsRes.ok ? await reportsRes.json() : { onTimeDeliveryRate: 0 };

      setMenuCounts({
        tasks: itemsData.total || 0,
        issues: issuesData.total || 0,
        logs: logsData.total || 0,
        onTimeRate: reportsData.onTimeDeliveryRate || 0,
      });
    } catch (error) {
      console.error('Failed to fetch menu counts:', error);
    } finally {
      setCountsLoading(false);
    }
  };

  const fetchPOList = async () => {
    try {
      const res = await fetch('/api/pos?limit=10');
      if (res.ok) {
        const poData = await res.json();
        setPoList(poData.pos || []);
      }
    } catch (error) {
      console.error('Failed to fetch PO list:', error);
    }
  };

  const getDaysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat...</p>
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
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.role === 'super_admin' ? 'Akses Penuh' : 'Akses View Only'}
          </p>
        </div>

        {/* Quick Action Cards - TOP SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="Tugas"
            subtitle="Item aktif"
            count={menuCounts.tasks}
            loading={countsLoading}
            onClick={() => router.push('/tasks')}
            icon={ClipboardList}
            color="bg-blue-50 text-blue-600"
          />
          <QuickActionCard
            title="Masalah"
            subtitle="Masalah terbuka"
            count={menuCounts.issues}
            loading={countsLoading}
            isDestructive={menuCounts.issues > 0}
            onClick={() => router.push('/issues')}
            icon={AlertTriangle}
            color="bg-amber-50 text-amber-600"
          />
          <QuickActionCard
            title="Riwayat"
            subtitle="Aktivitas hari ini"
            count={menuCounts.logs}
            loading={countsLoading}
            onClick={() => router.push('/logs')}
            icon={Clock}
            color="bg-purple-50 text-purple-600"
          />
          <QuickActionCard
            title="Statistik"
            subtitle="On-time delivery"
            count={menuCounts.onTimeRate}
            countSuffix="%"
            loading={countsLoading}
            onClick={() => router.push('/reports')}
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
            color="bg-muted"
          />
          <StatCard
            icon={Clock}
            label="Belum Mulai"
            value={data?.stats.notStarted || 0}
            color="bg-muted"
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
                <p className="text-muted-foreground text-sm mt-1">
                  {data.stats.myDeptStats.completed} selesai / {data.stats.myDeptStats.total} total
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold">
                  {data.stats.myDeptStats.averageProgress}%
                </span>
                <p className="text-muted-foreground text-sm">rata-rata progress</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted-foreground rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${data.stats.myDeptStats.averageProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* PO List - REPLACING Aktivitas Terbaru */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Daftar PO</h2>
            {canCreatePO && (
              <Link
                href="/pos/new"
                className="px-4 py-2 bg-foreground text-white text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors"
              >
                + Buat PO
              </Link>
            )}
          </div>
          
          {poList.length > 0 ? (
            <div className="space-y-3">
              {poList.map((po) => {
                const daysLeft = getDaysLeft(po.deliveryDeadline);
                const isOverdue = daysLeft !== null && daysLeft < 0;
                const isUrgent = po.isUrgent || (daysLeft !== null && daysLeft <= 3 && daysLeft >= 0);
                
                return (
                  <Link
                    key={po.id}
                    href={`/pos/${po.id}`}
                    className="block p-4 rounded-xl border border-border hover:border-muted-foreground/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono font-medium text-foreground">{po.poNumber}</span>
                          {po.clientPoNumber && (
                            <span className="text-xs text-muted-foreground">({po.clientPoNumber})</span>
                          )}
                          {po.isUrgent && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                              URGENT
                            </span>
                          )}
                          {po.isVendorJob && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-600 rounded-full">
                              VENDOR
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{po.client.name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{po._count.items} item</span>
                          <span>•</span>
                          <span>{new Date(po.poDate).toLocaleDateString('id-ID')}</span>
                          {daysLeft !== null && (
                            <>
                              <span>•</span>
                              <span className={isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-amber-600 font-medium' : ''}>
                                {isOverdue ? `${Math.abs(daysLeft)}h telat` : `${daysLeft}h lagi`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          po.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : po.status === 'completed'
                            ? 'bg-muted text-foreground'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {po.status === 'active' ? 'Aktif' : po.status === 'completed' ? 'Selesai' : 'Batal'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Tidak ada PO ditemukan</p>
          )}
          
          <Link
            href="/pos"
            className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4 pt-4 border-t border-border"
          >
            Lihat semua PO →
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({
  title,
  subtitle,
  count,
  countSuffix = '',
  loading,
  isDestructive,
  onClick,
  icon: Icon,
  color,
}: {
  title: string;
  subtitle: string;
  count: number;
  countSuffix?: string;
  loading: boolean;
  isDestructive?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-2xl p-5 border border-border hover:border-muted-foreground/50 transition-colors cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-muted rounded animate-pulse mb-1" />
      ) : (
        <p className={`text-2xl font-bold ${isDestructive ? 'text-destructive' : 'text-foreground'}`}>
          {count}{countSuffix}
        </p>
      )}
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
    </button>
  );
}
