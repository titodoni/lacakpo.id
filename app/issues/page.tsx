'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { AlertTriangle, CheckCircle, Clock, AlertCircle, Filter, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Color Palette
const colors = {
  black: '#000807',
  carbonBlack: '#171e1e',
  gunmetal: '#2c3232',
  hunterGreen: '#3d6646',
  shamrock: '#4d995a',
  emerald: '#50c878',
  brightTeal: '#1978c6',
  skyReflection: '#87b6dd',
  paleSky: '#bed5e8',
  platinum: '#f5f3f3',
};

interface Issue {
  id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  item: {
    id: string;
    itemName: string;
    purchaseOrder: {
      id: string;
      poNumber: string;
      client: {
        name: string;
      };
    };
  };
  creator: {
    id: string;
    name: string;
    role: string;
  };
  resolver?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

const priorityConfig = {
  high: { 
    label: 'Tinggi', 
    color: colors.emerald,
    bgColor: `${colors.emerald}15`,
    icon: AlertCircle 
  },
  medium: { 
    label: 'Sedang', 
    color: colors.brightTeal,
    bgColor: `${colors.brightTeal}15`,
    icon: AlertTriangle 
  },
  low: { 
    label: 'Rendah', 
    color: colors.gunmetal,
    bgColor: `${colors.gunmetal}15`,
    icon: Clock 
  },
};

const statusConfig = {
  open: { 
    label: 'Terbuka', 
    color: colors.emerald,
    bgColor: `${colors.emerald}15`,
    icon: AlertCircle 
  },
  resolved: { 
    label: 'Selesai', 
    color: colors.shamrock,
    bgColor: `${colors.shamrock}15`,
    icon: CheckCircle 
  },
};

export default function IssuesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchIssues();
    }
  }, [user, userLoading, router]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/issues');
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (res.ok) {
        fetchIssues();
      }
    } catch (error) {
      console.error('Failed to resolve issue:', error);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    // Status filter
    if (filter !== 'all' && issue.status !== filter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = issue.title.toLowerCase().includes(query);
      const matchesDescription = issue.description?.toLowerCase().includes(query);
      const matchesPONumber = issue.item.purchaseOrder.poNumber.toLowerCase().includes(query);
      const matchesClient = issue.item.purchaseOrder.client.name.toLowerCase().includes(query);
      const matchesItem = issue.item.itemName.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription && !matchesPONumber && !matchesClient && !matchesItem) {
        return false;
      }
    }
    
    return true;
  });

  // Sort by priority (high first) then by date (newest first)
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    return `${diffDays} hari lalu`;
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.platinum }}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: colors.brightTeal }} />
          <p style={{ color: colors.gunmetal }}>Memuat masalah...</p>
        </div>
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

  const openCount = issues.filter(i => i.status === 'open').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;
  const highPriorityCount = issues.filter(i => i.status === 'open' && i.priority === 'high').length;

  return (
    <DashboardLayout user={userData}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.black }}>
              Daftar Masalah
            </h1>
            <p className="mt-1" style={{ color: colors.gunmetal }}>
              Kelola dan pantau masalah produksi
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-3">
            <div 
              className="px-4 py-2 rounded-xl border"
              style={{ backgroundColor: 'white', borderColor: colors.paleSky }}
            >
              <span className="text-2xl font-bold" style={{ color: colors.emerald }}>{openCount}</span>
              <p className="text-xs" style={{ color: colors.gunmetal }}>Terbuka</p>
            </div>
            <div 
              className="px-4 py-2 rounded-xl border"
              style={{ backgroundColor: 'white', borderColor: colors.paleSky }}
            >
              <span className="text-2xl font-bold" style={{ color: colors.shamrock }}>{resolvedCount}</span>
              <p className="text-xs" style={{ color: colors.gunmetal }}>Selesai</p>
            </div>
            {highPriorityCount > 0 && (
              <div 
                className="px-4 py-2 rounded-xl border"
                style={{ backgroundColor: `${colors.emerald}15`, borderColor: colors.emerald }}
              >
                <span className="text-2xl font-bold" style={{ color: colors.emerald }}>{highPriorityCount}</span>
                <p className="text-xs" style={{ color: colors.hunterGreen }}>Prioritas Tinggi</p>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div 
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: 'white', borderColor: colors.paleSky }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.skyReflection }} />
              <input
                type="text"
                placeholder="Cari masalah, PO, atau client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: colors.paleSky,
                  color: colors.black,
                }}
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex rounded-xl p-1" style={{ backgroundColor: colors.paleSky }}>
              {(['all', 'open', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                  style={{
                    backgroundColor: filter === f ? 'white' : 'transparent',
                    color: filter === f ? colors.black : colors.gunmetal,
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {f === 'all' ? 'Semua' : f === 'open' ? 'Terbuka' : 'Selesai'}
                </button>
              ))}
            </div>
            
            {/* Priority Filter */}
            <div className="flex rounded-xl p-1" style={{ backgroundColor: colors.paleSky }}>
              {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                  style={{
                    backgroundColor: priorityFilter === p ? 'white' : 'transparent',
                    color: priorityFilter === p ? colors.black : colors.gunmetal,
                    boxShadow: priorityFilter === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {p === 'all' ? 'Semua' : p === 'high' ? 'Tinggi' : p === 'medium' ? 'Sedang' : 'Rendah'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Issues List */}
        {sortedIssues.length === 0 ? (
          <div 
            className="rounded-2xl p-12 border text-center"
            style={{ backgroundColor: 'white', borderColor: colors.paleSky }}
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.skyReflection }} />
            <p className="text-lg font-medium" style={{ color: colors.black }}>Tidak ada masalah ditemukan</p>
            <p className="text-sm mt-2" style={{ color: colors.gunmetal }}>
              {searchQuery || filter !== 'all' || priorityFilter !== 'all'
                ? 'Coba ubah filter pencarian'
                : 'Semua berjalan lancar! Tidak ada masalah yang dilaporkan.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedIssues.map((issue) => {
              const PriorityIcon = priorityConfig[issue.priority].icon;
              const StatusIcon = statusConfig[issue.status].icon;
              
              return (
                <div
                  key={issue.id}
                  className="rounded-2xl border overflow-hidden transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: 'white', 
                    borderColor: issue.status === 'open' && issue.priority === 'high' 
                      ? colors.emerald 
                      : colors.paleSky,
                  }}
                >
                  {/* Issue Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Priority Badge */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: priorityConfig[issue.priority].bgColor }}
                      >
                        <PriorityIcon 
                          className="w-5 h-5" 
                          style={{ color: priorityConfig[issue.priority].color }} 
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg" style={{ color: colors.black }}>
                              {issue.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: colors.gunmetal }}>
                              <Link 
                                href={`/pos/${issue.item.purchaseOrder.id}`}
                                className="font-mono hover:underline"
                                style={{ color: colors.brightTeal }}
                              >
                                {issue.item.purchaseOrder.poNumber}
                              </Link>
                              <span>•</span>
                              <span>{issue.item.purchaseOrder.client.name}</span>
                              <span>•</span>
                              <span>{issue.item.itemName}</span>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div 
                            className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
                            style={{ 
                              backgroundColor: statusConfig[issue.status].bgColor,
                              color: statusConfig[issue.status].color,
                            }}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig[issue.status].label}
                          </div>
                        </div>
                        
                        {/* Description */}
                        {issue.description && (
                          <p className="mt-3 text-sm" style={{ color: colors.gunmetal }}>
                            {issue.description}
                          </p>
                        )}
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: colors.paleSky }}>
                          <div className="flex items-center gap-4 text-xs" style={{ color: colors.gunmetal }}>
                            <span>Dilaporkan oleh <strong style={{ color: colors.black }}>{issue.creator.name}</strong></span>
                            <span>•</span>
                            <span>{getDaysAgo(issue.createdAt)}</span>
                            <span className="text-xs" style={{ color: colors.skyReflection }}>({formatDate(issue.createdAt)})</span>
                          </div>
                          
                          {/* Actions */}
                          {issue.status === 'open' && (user?.role === 'manager' || user?.role === 'super_admin') && (
                            <button
                              onClick={() => handleResolveIssue(issue.id)}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                              style={{ 
                                backgroundColor: colors.shamrock,
                                color: 'white',
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Tandai Selesai
                            </button>
                          )}
                          
                          {issue.status === 'resolved' && issue.resolver && (
                            <span className="text-xs" style={{ color: colors.shamrock }}>
                              Diselesaikan oleh {issue.resolver.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
