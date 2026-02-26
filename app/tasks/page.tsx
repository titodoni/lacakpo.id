'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { departmentExplanations } from '@/lib/department-info';
import { ItemCard, Item } from '@/components/ItemCard';
import { ReportIssueModal } from '@/components/ReportIssueModal';

const deptLabels: Record<string, string> = {
  drafting: 'Drafting',
  purchasing: 'Purchasing',
  production: 'Produksi',
  qc: 'QC',
  delivery: 'Delivery',
};

function getCardStatus(item: Item): 'urgent' | 'delayed' | 'ongoing' | 'delivery-close' | 'completed' | 'normal' {
  const po = item.purchaseOrder;
  
  if (po.isPaid) return 'completed';
  if (po.isUrgent) return 'urgent';
  if (item.quantityDelivered >= item.quantityTotal) return 'delivery-close';
  
  if (po.deliveryDeadline) {
    const deadline = new Date(po.deliveryDeadline);
    const now = new Date();
    if (deadline < now && item.quantityDelivered < item.quantityTotal) {
      return 'delayed';
    }
  }
  
  const hasProgress = item.tracks.some(t => t.progress > 0 && t.progress < 100);
  if (hasProgress) return 'ongoing';
  
  return 'normal';
}

function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function isDateInMonth(dateStr: string | null, monthStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const targetMonth = parseMonth(monthStr);
  return date.getFullYear() === targetMonth.getFullYear() && 
         date.getMonth() === targetMonth.getMonth();
}

function isItemCompleted(item: Item): boolean {
  return item.quantityDelivered >= item.quantityTotal;
}

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthString());
  const [completionTab, setCompletionTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getUserDept = (role: string): string | null => {
    if (role === 'drafter') return 'drafting';
    if (role === 'purchasing') return 'purchasing';
    if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(role)) return 'production';
    if (role === 'qc') return 'qc';
    if (role === 'delivery') return 'delivery';
    return null;
  };

  const userDept = user ? getUserDept(user.role) : null;
  const isAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      if (user.role === 'finance') {
        router.push('/finance');
        return;
      }
      fetchItems(userDept);
    }
  }, [user, userLoading, router, userDept]);

  const fetchItems = async (dept: string | null, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const url = dept 
        ? '/api/items?filter=my-dept&include=issues' 
        : '/api/items?include=issues';
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  
  const refreshItems = () => fetchItems(userDept, false);

  const departmentFilteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!userDept) return true;
      const myTrack = item.tracks.find((t) => t.department === userDept);
      
      switch (filter) {
        case 'todo':
          return myTrack?.progress === 0;
        case 'in-progress':
          return myTrack && myTrack.progress > 0 && myTrack.progress < 100;
        case 'done':
          return myTrack?.progress === 100;
        default:
          return true;
      }
    });
  }, [items, userDept, filter]);

  const filteredItems = useMemo(() => {
    return departmentFilteredItems.filter((item) => {
      const poDate = item.purchaseOrder?.poDate;
      const isInMonth = isDateInMonth(poDate, currentMonth);
      
      if (!isInMonth) return false;
      
      const isCompleted = isItemCompleted(item);
      
      if (completionTab === 'ongoing') {
        return !isCompleted;
      } else {
        return isCompleted;
      }
    });
  }, [departmentFilteredItems, currentMonth, completionTab]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const dateA = a.purchaseOrder?.poDate 
        ? new Date(a.purchaseOrder.poDate).getTime() 
        : 0;
      const dateB = b.purchaseOrder?.poDate 
        ? new Date(b.purchaseOrder.poDate).getTime() 
        : 0;
      return dateB - dateA;
    });
  }, [filteredItems]);

  const ongoingCount = useMemo(() => {
    return departmentFilteredItems.filter((item) => {
      const isInMonth = isDateInMonth(item.purchaseOrder?.poDate, currentMonth);
      return isInMonth && !isItemCompleted(item);
    }).length;
  }, [departmentFilteredItems, currentMonth]);

  const completedCount = useMemo(() => {
    return departmentFilteredItems.filter((item) => {
      const isInMonth = isDateInMonth(item.purchaseOrder?.poDate, currentMonth);
      return isInMonth && isItemCompleted(item);
    }).length;
  }, [departmentFilteredItems, currentMonth]);

  const handleReportIssue = async (data: { title: string; description: string; priority: 'high' | 'medium' | 'low' }) => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/items/${selectedItem.id}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await refreshItems();
        setIsModalOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to report issue:', error);
    }
  };

  const openReportModal = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
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

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {userDept ? `Tugas ${deptLabels[userDept]}` : 'Semua Item'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {userDept 
                ? 'Item yang ditugaskan ke departemen Anda' 
                : 'Lihat semua item produksi'}
            </p>
          </div>
          
          {userDept && (
            <div className="flex rounded-xl p-1 gap-1 bg-card border border-border">
              {(['all', 'todo', 'in-progress', 'done'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filter === f 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'all' ? 'Semua' : f === 'todo' ? 'Belum' : f === 'in-progress' ? 'Berjalan' : 'Selesai'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Department Explanation */}
        {userDept && departmentExplanations[userDept] && (
          <div className="rounded-2xl p-4 border bg-card border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg shrink-0 bg-accent/20">
                <Info className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1 text-foreground">
                  Keterangan {departmentExplanations[userDept].title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {departmentExplanations[userDept].description}
                </p>
              </div>
            </div>
          </div>
        )}

        {!userDept && user.role !== 'super_admin' && (
          <div className="rounded-2xl p-4 border bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                Anda dapat melihat semua item tetapi tidak dapat mengupdate progress langsung.
              </p>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between gap-2">
          {(() => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const [year, month] = currentMonth.split('-').map(Number);
            
            const prevMonthDate = new Date(year, month - 2, 1);
            const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
            const prevMonthName = monthNames[prevMonthDate.getMonth()];
            
            const nextMonthDate = new Date(year, month, 1);
            const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
            const nextMonthName = monthNames[nextMonthDate.getMonth()];
            
            const currentMonthName = monthNames[month - 1];
            
            return (
              <>
                <button
                  onClick={() => setCurrentMonth(prevMonthKey)}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">{prevMonthName}</span>
                </button>
                
                <div className="flex-1 text-center">
                  <span className="text-lg font-bold text-foreground">
                    {currentMonthName} {year}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentMonth(nextMonthKey)}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  <span className="hidden sm:inline">{nextMonthName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            );
          })()}
        </div>

        {/* Ongoing / Completed Tabs */}
        <div className="flex rounded-xl p-1 gap-1 bg-card border border-border">
          <button
            onClick={() => setCompletionTab('ongoing')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              completionTab === 'ongoing' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="w-4 h-4" />
            Ongoing
            <span className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground">
              {ongoingCount}
            </span>
          </button>
          <button
            onClick={() => setCompletionTab('completed')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              completionTab === 'completed' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Completed
            <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
              {completedCount}
            </span>
          </button>
        </div>

        {/* Items List */}
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl p-12 border text-center bg-card border-border">
            <p className="text-foreground">Tidak ada item ditemukan.</p>
            <p className="text-sm mt-2 text-muted-foreground">
              {completionTab === 'ongoing' 
                ? 'Tidak ada item ongoing untuk bulan ini.' 
                : 'Tidak ada item completed untuk bulan ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                userRole={user.role}
                userDept={userDept}
                userId={user.userId}
                isAdmin={isAdmin}
                onUpdate={refreshItems}
                onReportIssue={openReportModal}
                cardStatus={getCardStatus(item)}
                isVendorJob={item.purchaseOrder?.isVendorJob}
                vendorName={item.purchaseOrder?.vendorName}
                navigateOnClick={!userDept}
              />
            ))}
          </div>
        )}
      </div>

      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleReportIssue}
        itemName={selectedItem?.itemName || ''}
      />
    </DashboardLayout>
  );
}
