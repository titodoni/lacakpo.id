'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { ItemCard, Item, Issue } from '@/components/ItemCard';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { IssueList } from '@/components/IssueList';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, CheckCircle2, Clock, DollarSign, FileText, CreditCard } from 'lucide-react';

// Color Palette
const colors = {
  primary: '#003049',
  danger: '#d62828',
  accent: '#f77f00',
};

interface PO {
  id: string;
  poNumber: string;
  clientPoNumber: string | null;
  poDate: string;
  deliveryDeadline: string | null;
  notes: string | null;
  status: string;
  isUrgent: boolean;
  isVendorJob: boolean;
  vendorName: string | null;
  vendorPhone: string | null;
  vendorEstimation: string | null;
  isInvoiced: boolean;
  invoicedAt: string | null;
  invoiceNumber: string | null;
  isPaid: boolean;
  paidAt: string | null;
  finishedAt: string | null;
  client: { name: string };
  items: Item[];
}

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [po, setPo] = useState<PO | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemIssues, setItemIssues] = useState<Record<string, Issue[]>>({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Finance form state
  const [isUpdatingFinance, setIsUpdatingFinance] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showFinanceForm, setShowFinanceForm] = useState(false);

  useEffect(() => {
    fetchPO();
  }, [params.id]);

  const fetchPO = async () => {
    try {
      const res = await fetch(`/api/pos/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch PO');
      const data = await res.json();
      setPo(data.po);
      
      // Issues are now included in the PO fetch - no N+1 queries
      // Build issues map from the included data
      if (data.po.items) {
        const issuesMap: Record<string, Issue[]> = {};
        for (const item of data.po.items) {
          issuesMap[item.id] = item.issues || [];
        }
        setItemIssues(issuesMap);
      }
    } catch (err) {
      console.error('Failed to load PO');
    } finally {
      setLoading(false);
    }
  };

  const getUserDept = (role: string): string | null => {
    if (role === 'drafter') return 'drafting';
    if (role === 'purchasing') return 'purchasing';
    if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(role)) return 'production';
    if (role === 'qc') return 'qc';
    return null;
  };

  const getCardStatus = (item: Item): 'urgent' | 'delayed' | 'ongoing' | 'delivery-close' | 'completed' | 'normal' => {
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
  };

  const userDept = user ? getUserDept(user.role) : null;

  const handleReportIssue = async (data: { title: string; description: string; priority: 'high' | 'medium' | 'low' }) => {
    if (!selectedItem) return;

    try {
      const res = await fetch(`/api/items/${selectedItem.id}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchPO();
        setIsModalOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to report issue:', error);
    }
  };

  const handleEditIssue = async (data: { title: string; description: string; priority: 'high' | 'medium' | 'low' }) => {
    if (!editingIssue) return;

    try {
      const res = await fetch(`/api/issues/${editingIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setEditingIssue(null);
        await fetchPO();
      }
    } catch (error) {
      console.error('Failed to update issue:', error);
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
        await fetchPO();
      }
    } catch (error) {
      console.error('Failed to resolve issue:', error);
    }
  };

  const handleReopenIssue = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' }),
      });

      if (res.ok) {
        await fetchPO();
      }
    } catch (error) {
      console.error('Failed to reopen issue:', error);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm('Yakin ingin menghapus masalah ini?')) return;

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchPO();
      }
    } catch (error) {
      console.error('Failed to delete issue:', error);
    }
  };

  const openReportModal = (item: Item) => {
    setSelectedItem(item);
    setEditingIssue(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item, issue: Issue) => {
    setSelectedItem(item);
    setEditingIssue(issue);
    setIsModalOpen(true);
  };

  const handleDeletePO = async () => {
    if (!po) return;
    if (!confirm('Yakin ingin menghapus PO ini? Tindakan ini tidak dapat dibatalkan.')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pos/${po.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/pos');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus PO');
      }
    } catch (error) {
      console.error('Failed to delete PO:', error);
      alert('ERR_004: Gagal menghapus PO');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinanceUpdate = async (type: 'invoice' | 'payment') => {
    if (!po) return;
    
    setIsUpdatingFinance(true);
    try {
      const body: any = {};
      
      if (type === 'invoice') {
        body.isInvoiced = !po.isInvoiced;
        if (!po.isInvoiced && invoiceNumber.trim()) {
          body.invoiceNumber = invoiceNumber.trim();
        }
      } else if (type === 'payment') {
        body.isPaid = !po.isPaid;
      }

      const res = await fetch(`/api/pos/${po.id}/finance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setPo({ ...po, ...data.po });
        setInvoiceNumber('');
        setShowFinanceForm(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengupdate status finance');
      }
    } catch (error) {
      console.error('Failed to update finance:', error);
      alert('ERR_020: Gagal mengupdate status finance');
    } finally {
      setIsUpdatingFinance(false);
    }
  };

  // Check if all items are delivered
  const allItemsDelivered = po?.items.every(item => 
    item.quantityDelivered >= item.quantityTotal
  ) ?? false;

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Memuat...</p>
      </div>
    );
  }

  if (!user || !po) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Tidak ditemukan</p>
      </div>
    );
  }

  const userData = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    department: user.department,
    name: user.name,
    isLoggedIn: user.isLoggedIn,
  };

  const isAdmin = user.role === 'super_admin' || user.role === 'manager';
  const isFinance = user.role === 'finance';

  // Merge PO data with issues for items
  // Issues are now pre-fetched with the PO API call (no N+1 queries)
  const itemsWithIssues = po.items.map(item => ({
    ...item,
    purchaseOrder: {
      id: po.id,
      poNumber: po.poNumber,
      client: po.client,
      deliveryDeadline: po.deliveryDeadline,
      poDate: po.poDate,
      isUrgent: po.isUrgent,
      isVendorJob: po.isVendorJob,
      vendorName: po.vendorName,
    },
    issues: item.issues || itemIssues[item.id] || [],
  }));

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a
            href="/tasks"
            className="text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Kembali ke Tugas
          </a>
        </div>

        {/* PO Info */}
        <div className={cn(
          'bg-white rounded-2xl p-6 border',
          po.isUrgent ? 'border-red-300' : 'border-zinc-200'
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900">{po.poNumber}</h1>
                {po.isUrgent && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
                    🔥 PENTING
                  </span>
                )}
                {po.isVendorJob && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                    📦 VENDOR: {po.vendorName}
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    po.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : po.status === 'completed'
                      ? 'bg-zinc-100 text-zinc-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {po.status}
                </span>
              </div>
              <p className="text-zinc-600 mt-1">{po.client.name}</p>
              {po.clientPoNumber && (
                <p className="text-sm text-zinc-400 mt-1">
                  PO Klien: {po.clientPoNumber}
                </p>
              )}
              {po.isVendorJob && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Informasi Vendor</p>
                  <p className="text-sm text-blue-800">Nama: {po.vendorName}</p>
                  {po.vendorPhone && (
                    <p className="text-sm text-blue-800">Telp: {po.vendorPhone}</p>
                  )}
                  {po.vendorEstimation && (
                    <p className="text-sm text-blue-800">
                      Estimasi Selesai: {new Date(po.vendorEstimation).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-500">
                <p>Tanggal PO: {new Date(po.poDate).toLocaleDateString('id-ID')}</p>
                {po.deliveryDeadline && (
                  <p className={cn('mt-1', 
                    new Date(po.deliveryDeadline) < new Date() ? 'text-red-500 font-semibold' : 'text-amber-600'
                  )}>
                    Jatuh tempo: {new Date(po.deliveryDeadline).toLocaleDateString('id-ID')}
                  </p>
                )}
              </div>
              
              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex items-center justify-end gap-2 mt-3">
                  <a
                    href={`/pos/${po.id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </a>
                  <button
                    onClick={handleDeletePO}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {po.notes && (
            <p className="mt-4 text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl">
              {po.notes}
            </p>
          )}
        </div>

        {/* Finance Section */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Status Keuangan
            </h2>
            {po.status === 'finished' && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                FINISHED
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice Status */}
            <div className="p-4 rounded-xl border" style={{ 
              borderColor: po.isInvoiced ? colors.danger : colors.accent,
              backgroundColor: po.isInvoiced ? '#fdf0d5' : 'white'
            }}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${po.isInvoiced ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                  <FileText className={`w-5 h-5 ${po.isInvoiced ? 'text-emerald-600' : 'text-zinc-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {po.isInvoiced ? 'Sudah Di-invoice' : 'Belum Di-invoice'}
                  </p>
                  {po.isInvoiced && po.invoiceNumber && (
                    <p className="text-xs text-zinc-500">No: {po.invoiceNumber}</p>
                  )}
                  {po.isInvoiced && po.invoicedAt && (
                    <p className="text-xs text-zinc-400">
                      {new Date(po.invoicedAt).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
              
              {isFinance && !po.isInvoiced && (
                <div className="mt-3">
                  {!showFinanceForm ? (
                    <button
                      onClick={() => setShowFinanceForm(true)}
                      disabled={isUpdatingFinance}
                      className="w-full py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                    >
                      Tandai Invoiced
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="Nomor Invoice (opsional)"
                        className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFinanceUpdate('invoice')}
                          disabled={isUpdatingFinance}
                          className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isUpdatingFinance ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          onClick={() => { setShowFinanceForm(false); setInvoiceNumber(''); }}
                          className="px-3 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {isFinance && po.isInvoiced && (
                <button
                  onClick={() => handleFinanceUpdate('invoice')}
                  disabled={isUpdatingFinance}
                  className="w-full mt-3 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Batalkan Invoice
                </button>
              )}
            </div>

            {/* Payment Status */}
            <div className="p-4 rounded-xl border" style={{ 
              borderColor: po.isPaid ? colors.danger : colors.accent,
              backgroundColor: po.isPaid ? '#fdf0d5' : 'white'
            }}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${po.isPaid ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                  <CreditCard className={`w-5 h-5 ${po.isPaid ? 'text-emerald-600' : 'text-zinc-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {po.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                  </p>
                  {po.isPaid && po.paidAt && (
                    <p className="text-xs text-zinc-400">
                      {new Date(po.paidAt).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
              
              {isFinance && (
                <button
                  onClick={() => handleFinanceUpdate('payment')}
                  disabled={isUpdatingFinance || (!po.isPaid && !allItemsDelivered)}
                  className="w-full mt-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:bg-zinc-300"
                >
                  {isUpdatingFinance 
                    ? 'Menyimpan...' 
                    : po.isPaid 
                      ? 'Batalkan Pembayaran' 
                      : 'Tandai Dibayar'
                  }
                </button>
              )}
              

            </div>
          </div>

          {/* Finish Status Info */}
          {po.status === 'finished' && po.finishedAt && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Project Finished</span>
                <span className="text-emerald-600">
                  pada {new Date(po.finishedAt).toLocaleDateString('id-ID')}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Item ({po.items.length})
          </h2>
          
          <div className="space-y-3">
            {itemsWithIssues.map((item) => (
              <div key={item.id}>
                <ItemCard
                  item={item}
                  userRole={user.role}
                  userDept={userDept}
                  userId={user.userId}
                  isAdmin={isAdmin}
                  onUpdate={fetchPO}
                  onReportIssue={openReportModal}
                  cardStatus={getCardStatus(item)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIssue(null);
          setSelectedItem(null);
        }}
        onSubmit={editingIssue ? handleEditIssue : handleReportIssue}
        itemName={selectedItem?.itemName || ''}
        editingIssue={editingIssue}
      />
    </DashboardLayout>
  );
}
