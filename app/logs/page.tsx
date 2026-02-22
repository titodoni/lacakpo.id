'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { ActivityLogItem } from '@/components/ActivityLogItem';

interface Log {
  id: string;
  department: string;
  actionType: string;
  oldProgress: number | null;
  newProgress: number | null;
  delta: number | null;
  systemMessage: string;
  userNote: string | null;
  createdAt: string;
  item: { itemName: string } | null;
  actor: { name: string; username: string } | null;
}

export default function LogsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchLogs();
    }
  }, [user, userLoading, router, filter]);

  const fetchLogs = async () => {
    try {
      let url = '/api/logs?limit=100';
      if (filter !== 'all') {
        url += `&department=${filter}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
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

  const departments = [
    { value: 'all', label: 'Semua Departemen' },
    { value: 'drafting', label: 'Drafting' },
    { value: 'purchasing', label: 'Purchasing' },
    { value: 'production', label: 'Production' },
    { value: 'qc', label: 'QC' },
  ];

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, Log[]>);

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Riwayat Aktivitas</h1>
            <p className="text-zinc-500 mt-1">
              Lacak semua update progress di seluruh departemen
            </p>
          </div>
          
          {/* Department Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none bg-white"
          >
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-zinc-200">
            <p className="text-2xl font-bold text-zinc-900">{logs.length}</p>
            <p className="text-sm text-zinc-500">Total Update</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">
              {logs.filter(l => l.department === 'drafting').length}
            </p>
            <p className="text-sm text-blue-600">Drafting</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-2xl font-bold text-purple-700">
              {logs.filter(l => l.department === 'purchasing').length}
            </p>
            <p className="text-sm text-purple-600">Purchasing</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-2xl font-bold text-orange-700">
              {logs.filter(l => l.department === 'production').length}
            </p>
            <p className="text-sm text-orange-600">Produksi</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl border border-zinc-200">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-500">Tidak ada riwayat aktivitas.</p>
              <p className="text-sm text-zinc-400 mt-2">
                Update progress akan muncul otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                <div key={date} className="p-6">
                  <h3 className="text-sm font-semibold text-zinc-500 mb-4 sticky top-0 bg-white py-2">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dateLogs.map((log) => (
                      <ActivityLogItem key={log.id} log={log} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
