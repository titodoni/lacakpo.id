'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { DollarSign, CheckCircle2, Clock, FileText, CreditCard, Package, AlertCircle, ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { cn, formatMonthYear } from '@/lib/utils';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  clientPoNumber: string | null;
  poDate: string;
  deliveryDeadline: string | null;
  status: string;
  isUrgent: boolean;
  isInvoiced: boolean;
  invoicedAt: string | null;
  invoiceNumber: string | null;
  isPaid: boolean;
  paidAt: string | null;
  finishedAt: string | null;
  client: { name: string; code: string };
  _count: { items: number };
  items: {
    id: string;
    quantityTotal: number;
    quantityDelivered: number;
  }[];
}

// Helper functions
function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function formatMonthForUrl(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isDateInMonth(dateStr: string | null, monthStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const targetMonth = parseMonth(monthStr);
  return date.getFullYear() === targetMonth.getFullYear() && 
         date.getMonth() === targetMonth.getMonth();
}

export default function FinancePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthString());
  const [filter, setFilter] = useState<'all' | 'uninvoiced' | 'invoiced' | 'paid'>('all');
  
  // State for inline editing
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateType, setUpdateType] = useState<'invoice' | 'paid' | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      // Only finance, admin and manager can access
      if (!['finance', 'super_admin', 'manager'].includes(user.role)) {
        router.push('/');
        return;
      }
      fetchPOs();
    }
  }, [user, userLoading, router]);

  const fetchPOs = async () => {
    try {
      const res = await fetch('/api/pos');
      if (res.ok) {
        const data = await res.json();
        // Fetch items for each PO to calculate delivery status
        const posWithItems = await Promise.all(
          (data.pos || []).map(async (po: PurchaseOrder) => {
            const itemsRes = await fetch(`/api/pos/${po.id}`);
            if (itemsRes.ok) {
              const itemsData = await itemsRes.json();
              return { ...po, items: itemsData.po.items };
            }
            return po;
          })
        );
        setPos(posWithItems);
      }
    } catch (error) {
      console.error('Failed to fetch POs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFinance = async (poId: string, type: 'invoice' | 'paid', currentValue: boolean) => {
    setUpdatingId(poId);
    setUpdateType(type);
    
    try {
      const body: any = {};
      
      if (type === 'invoice') {
        body.isInvoiced = !currentValue;
        // Keep existing invoice number if unchecking
        if (currentValue) {
          body.invoiceNumber = null;
        }
      } else if (type === 'paid') {
        body.isPaid = !currentValue;
      }

      const res = await fetch(`/api/pos/${poId}/finance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setPos(prev => prev.map(po => 
          po.id === poId ? { ...po, ...data.po } : po
        ));
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengupdate status');
      }
    } catch (error) {
      console.error('Failed to update finance:', error);
      alert('ERR_020: Gagal mengupdate status finance');
    } finally {
      setUpdatingId(null);
      setUpdateType(null);
    }
  };

  // Filter POs by month (PO creation date) and status
  const filteredPOs = useMemo(() => {
    return pos.filter((po) => {
      // Filter by month (based on PO creation date)
      const isInMonth = isDateInMonth(po.poDate, currentMonth);
      if (!isInMonth) return false;

      // Filter by finance status
      switch (filter) {
        case 'uninvoiced':
          return !po.isInvoiced;
        case 'invoiced':
          return po.isInvoiced && !po.isPaid;
        case 'paid':
          return po.isPaid;
        default:
          return true;
      }
    });
  }, [pos, currentMonth, filter]);

  // Sort by PO date (newest first)
  const sortedPOs = useMemo(() => {
    return [...filteredPOs].sort((a, b) => {
      const dateA = a.poDate ? new Date(a.poDate).getTime() : 0;
      const dateB = b.poDate ? new Date(b.poDate).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [filteredPOs]);

  // Calculate stats (by PO creation month)
  const stats = useMemo(() => {
    const monthPOs = pos.filter(po => isDateInMonth(po.poDate, currentMonth));
    return {
      total: monthPOs.length,
      uninvoiced: monthPOs.filter(po => !po.isInvoiced).length,
      invoiced: monthPOs.filter(po => po.isInvoiced && !po.isPaid).length,
      paid: monthPOs.filter(po => po.isPaid).length,
    };
  }, [pos, currentMonth]);

  // Check if PO is fully delivered
  const isFullyDelivered = (po: PurchaseOrder) => {
    if (!po.items || po.items.length === 0) return false;
    return po.items.every(item => item.quantityDelivered >= item.quantityTotal);
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

  const isFinance = user.role === 'finance';

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tampilan Keuangan</h1>
          <p className="text-zinc-500 mt-1">
            Tracking invoice dan pembayaran PO
          </p>
        </div>

        {/* Month Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((monthNum, idx) => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            const year = parseInt(currentMonth.split('-')[0]);
            const monthKey = `${year}-${monthNum}`;
            const isActive = currentMonth === monthKey;
            
            return (
              <button
                key={monthNum}
                onClick={() => setCurrentMonth(monthKey)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
              >
                {monthNames[idx]}
              </button>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 rounded-lg">
                <Package className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
                <p className="text-sm text-zinc-500">Total PO</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.uninvoiced}</p>
                <p className="text-sm text-amber-600">Belum Invoice</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.invoiced}</p>
                <p className="text-sm text-blue-600">Menunggu Bayar</p>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.paid}</p>
                <p className="text-sm text-emerald-600">Sudah Lunas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'uninvoiced', 'invoiced', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                filter === f
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              {f === 'all' ? 'Semua PO' : f === 'uninvoiced' ? 'Belum Invoice' : f === 'invoiced' ? 'Menunggu Bayar' : 'Sudah Lunas'}
              <span className={cn(
                'ml-2 px-1.5 py-0.5 rounded text-xs',
                filter === f ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-600'
              )}>
                {f === 'all' ? stats.total : f === 'uninvoiced' ? stats.uninvoiced : f === 'invoiced' ? stats.invoiced : stats.paid}
              </span>
            </button>
          ))}
        </div>

        {/* PO List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Purchase Orders ({sortedPOs.length})
          </h2>
          
          {sortedPOs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-zinc-200 text-center">
              <DollarSign className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">Tidak ada PO ditemukan.</p>
              <p className="text-sm text-zinc-400 mt-2">
                Tidak ada PO dengan filter yang dipilih untuk bulan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPOs.map((po) => {
                const fullyDelivered = isFullyDelivered(po);
                const isUpdating = updatingId === po.id;
                
                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-2xl p-5 border border-zinc-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-zinc-900">{po.poNumber}</h3>
                          {po.isUrgent && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                              PENTING
                            </span>
                          )}
                          {po.status === 'finished' && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              FINISHED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 mt-1">{po.client.name}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          PO Date: {new Date(po.poDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Finance Status Actions */}
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Invoice Checkbox */}
                        <div className={cn(
                          'p-3 rounded-xl border-2 transition-all',
                          po.isInvoiced 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-zinc-50 border-zinc-200'
                        )}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (!isFinance || isUpdating) return;
                                // Toggle invoice status directly
                                handleUpdateFinance(po.id, 'invoice', po.isInvoiced);
                              }}
                              disabled={!isFinance || isUpdating}
                              className={cn(
                                'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                                po.isInvoiced
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'bg-white border-zinc-300 hover:border-emerald-400'
                              )}
                            >
                              {po.isInvoiced && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className={cn(
                                'font-medium',
                                po.isInvoiced ? 'text-emerald-700' : 'text-zinc-700'
                              )}>
                                {po.isInvoiced ? 'Sudah Di-invoice' : 'Belum Di-invoice'}
                              </p>
                              {po.isInvoiced && po.invoiceNumber && (
                                <p className="text-xs text-zinc-500">No: {po.invoiceNumber}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Optional: Show loading when updating */}
                          {isUpdating && updateType === 'invoice' && updatingId === po.id && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </div>
                          )}
                        </div>

                        {/* Paid Checkbox */}
                        <div className={cn(
                          'p-3 rounded-xl border-2 transition-all',
                          po.isPaid 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-zinc-50 border-zinc-200'
                        )}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (!isFinance || isUpdating) return;
                                handleUpdateFinance(po.id, 'paid', po.isPaid);
                              }}
                              disabled={!isFinance || isUpdating}
                              className={cn(
                                'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                                po.isPaid
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'bg-white border-zinc-300 hover:border-emerald-400'
                              )}
                            >
                              {po.isPaid && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className={cn(
                                'font-medium',
                                po.isPaid ? 'text-emerald-700' : 'text-zinc-700'
                              )}>
                                {po.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                              </p>
                            </div>
                          </div>
                          
                          {isUpdating && updateType === 'paid' && updatingId === po.id && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Invoice Number Display */}
                    {po.isInvoiced && po.invoiceNumber && (
                      <div className="mt-3 pt-3 border-t border-zinc-100">
                        <p className="text-sm text-zinc-600">
                          Invoice: <span className="font-medium">{po.invoiceNumber}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
