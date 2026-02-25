'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { departmentExplanations, getDepartmentExplanation } from '@/lib/department-info';
import { ItemCard, Item, Issue } from '@/components/ItemCard';
import { ReportIssueModal } from '@/components/ReportIssueModal';

// Color Palette
const colors = {
  primary: '#003049',
  danger: '#d62828',
  accent: '#f77f00',
};

const deptLabels: Record<string, string> = {
  drafting: 'Drafting',
  purchasing: 'Purchasing',
  production: 'Produksi',
  qc: 'QC',
  delivery: 'Delivery',
};

// Helper to determine card status for coloring
function getCardStatus(item: Item): 'urgent' | 'delayed' | 'ongoing' | 'delivery-close' | 'completed' | 'normal' {
  const po = item.purchaseOrder;
  
  // Completed: PO is paid
  if (po.isPaid) return 'completed';
  
  // Urgent: PO marked as urgent
  if (po.isUrgent) return 'urgent';
  
  // Delivery Close: All items delivered (but not yet paid)
  if (item.quantityDelivered >= item.quantityTotal) return 'delivery-close';
  
  // Delayed: Past deadline and not delivered
  if (po.deliveryDeadline) {
    const deadline = new Date(po.deliveryDeadline);
    const now = new Date();
    if (deadline < now && item.quantityDelivered < item.quantityTotal) {
      return 'delayed';
    }
  }
  
  // Ongoing: Has progress but not complete
  const hasProgress = item.tracks.some(t => t.progress > 0 && t.progress < 100);
  if (hasProgress) return 'ongoing';
  
  return 'normal';
}

// Helper to get current month string (YYYY-MM)
function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper to parse month string to Date
function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

// Helper to format month for display
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

// Helper to format month for URL
function formatMonthForUrl(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Helper to check if item is completed (delivered & paid)
function isItemCompleted(item: Item): boolean {
  // Item is completed if quantityDelivered >= quantityTotal (fully delivered)
  // Note: isPaid is on PO level, we check item's PO status via delivered quantity
  return item.quantityDelivered >= item.quantityTotal;
}

// Helper to check if date is in specific month
function isDateInMonth(dateStr: string | null, monthStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const targetMonth = parseMonth(monthStr);
  return date.getFullYear() === targetMonth.getFullYear() && 
         date.getMonth() === targetMonth.getMonth();
}

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  
  // Month and completion tabs state
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
      // Finance users should go to finance page
      if (user.role === 'finance') {
        router.push('/finance');
        return;
      }
      // For super_admin and manager (no specific dept), fetch all items
      // For workers with a dept, fetch items relevant to their department
      fetchItems(userDept);
    }
  }, [user, userLoading, router, userDept]);

  const fetchItems = async (dept: string | null) => {
    try {
      const url = dept 
        ? '/api/items?filter=my-dept' 
        : '/api/items';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        
        const itemsWithIssues = await Promise.all(
          items.map(async (item: Item) => {
            try {
              const issuesRes = await fetch(`/api/items/${item.id}/issues`);
              if (issuesRes.ok) {
                const issuesData = await issuesRes.json();
                return { ...item, issues: issuesData.issues };
              }
            } catch (e) {
              console.error(`Failed to fetch issues for item ${item.id}:`, e);
            }
            return item;
          })
        );
        
        setItems(itemsWithIssues);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by department progress (existing filter)
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

  // Filter by month (PO creation date) and completion status
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

  // Sort by PO date (newest first)
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const dateA = a.purchaseOrder?.poDate 
        ? new Date(a.purchaseOrder.poDate).getTime() 
        : 0;
      const dateB = b.purchaseOrder?.poDate 
        ? new Date(b.purchaseOrder.poDate).getTime() 
        : 0;
      return dateB - dateA; // Newest first
    });
  }, [filteredItems]);

  // Count items for tabs (by PO creation month)
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
        await fetchItems(userDept);
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
        <p style={{ color: colors.accent }}>Memuat...</p>
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
            <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
              {userDept ? `Tugas ${deptLabels[userDept]}` : 'Semua Item'}
            </h1>
            <p className="mt-1" style={{ color: colors.accent }}>
              {userDept 
                ? 'Item yang ditugaskan ke departemen Anda' 
                : 'Lihat semua item produksi'}
            </p>
          </div>
          
          {userDept && (
            <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: '#ffffff' }}>
              {(['all', 'todo', 'in-progress', 'done'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: filter === f ? 'white' : 'transparent',
                    color: filter === f ? colors.primary : colors.accent,
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {f === 'all' ? 'Semua' : f === 'todo' ? 'Belum' : f === 'in-progress' ? 'Berjalan' : 'Selesai'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Department Explanation */}
        {userDept && departmentExplanations[userDept] && (
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: '#ffffff', borderColor: colors.accent }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: '#fed7aa' }}>
                <Info className="w-5 h-5" style={{ color: colors.primary }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: colors.primary }}>
                  Keterangan {departmentExplanations[userDept].title}
                </h3>
                <p className="text-sm" style={{ color: colors.accent }}>
                  {departmentExplanations[userDept].description}
                </p>
              </div>
            </div>
          </div>
        )}

        {!userDept && user.role !== 'super_admin' && (
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: '#ffffff', borderColor: colors.danger }}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: colors.danger }} />
              <p className="text-sm" style={{ color: colors.danger }}>
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
            
            // Calculate previous month
            const prevMonthDate = new Date(year, month - 2, 1);
            const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
            const prevMonthName = monthNames[prevMonthDate.getMonth()];
            
            // Calculate next month
            const nextMonthDate = new Date(year, month, 1);
            const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
            const nextMonthName = monthNames[nextMonthDate.getMonth()];
            
            // Current month display
            const currentMonthName = monthNames[month - 1];
            const currentYear = year;
            
            return (
              <>
                {/* Previous Month Button */}
                <button
                  onClick={() => setCurrentMonth(prevMonthKey)}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">{prevMonthName}</span>
                </button>
                
                {/* Current Month Display */}
                <div className="flex-1 text-center">
                  <span className="text-lg font-bold" style={{ color: colors.primary }}>
                    {currentMonthName} {currentYear}
                  </span>
                </div>
                
                {/* Next Month Button */}
                <button
                  onClick={() => setCurrentMonth(nextMonthKey)}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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
        <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: '#ffffff' }}>
          <button
            onClick={() => setCompletionTab('ongoing')}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: completionTab === 'ongoing' ? 'white' : 'transparent',
              color: completionTab === 'ongoing' ? colors.primary : colors.accent,
              boxShadow: completionTab === 'ongoing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Clock className="w-4 h-4" />
            Ongoing
            <span 
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: completionTab === 'ongoing' ? colors.accent : '#fed7aa',
                color: completionTab === 'ongoing' ? 'white' : colors.primary
              }}
            >
              {ongoingCount}
            </span>
          </button>
          <button
            onClick={() => setCompletionTab('completed')}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: completionTab === 'completed' ? 'white' : 'transparent',
              color: completionTab === 'completed' ? colors.primary : colors.accent,
              boxShadow: completionTab === 'completed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Completed
            <span 
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: completionTab === 'completed' ? colors.danger : '#ffffff',
                color: completionTab === 'completed' ? 'white' : colors.accent
              }}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Items List */}
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl p-12 border text-center" style={{ backgroundColor: 'white', borderColor: '#fed7aa' }}>
            <p style={{ color: colors.primary }}>Tidak ada item ditemukan.</p>
            <p className="text-sm mt-2" style={{ color: colors.accent }}>
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
                onUpdate={() => fetchItems(userDept)}
                onReportIssue={openReportModal}
                cardStatus={getCardStatus(item)}
                isVendorJob={item.purchaseOrder?.isVendorJob}
                vendorName={item.purchaseOrder?.vendorName}
                navigateOnClick={!userDept} // Admin/manager navigate, workers click to edit
              />
            ))}
          </div>
        )}
        
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && sortedItems.length > 0 && (
          <details className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
            <summary className="cursor-pointer font-semibold">Debug: {sortedItems.length} items loaded</summary>
            <div className="mt-2 space-y-1 max-h-40 overflow-auto">
              {sortedItems.slice(0, 5).map(item => (
                <div key={item.id} className="font-mono">
                  Item: {item.itemName} → PO ID: {item.purchaseOrder?.id || 'N/A'} ({item.purchaseOrder?.poNumber || 'N/A'})
                </div>
              ))}
              {sortedItems.length > 5 && <div>... and {sortedItems.length - 5} more</div>}
            </div>
          </details>
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
