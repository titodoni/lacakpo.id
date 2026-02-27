'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { ItemCard, Item, Issue } from '@/components/ItemCard';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { IssueList } from '@/components/IssueList';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, CheckCircle2, Clock, DollarSign, FileText, CreditCard } from 'lucide-react';

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
  
  const [isUpdatingFinance, setIsUpdatingFinance] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showFinanceForm, setShowFinanceForm] = useState(false);

  useEffect(() => {
    fetchPO();
  }, [params.id]);

  const fetchPO = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/pos/${params.id}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch PO');
      const data = await res.json();
      setPo(data.po);
      
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
      if (showLoading) setLoading(false);
    }
  };
  
  const refreshPO = () => fetchPO(false);

  const getUserDept = (role: string): string | null => {
    if (role === 'drafter') return 'drafting';
    if (role === 'purchasing') return 'purchasing';
    if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(role)) return 'production';
    if (role === 'qc') return 'qc';
    return null;
  };

  const getCardStatus = (item: Item): 'urgent' | 'delayed' | 'ongoing' | 'delivery-close' | 'completed' | 'normal' => {
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
        await refreshPO();
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
        await refreshPO();
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
        await refreshPO();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menyelesaikan laporan');
      }
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      alert('Gagal menyelesaikan laporan');
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
        await refreshPO();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal membuka kembali laporan');
      }
    } catch (error) {
      console.error('Failed to reopen issue:', error);
      alert('Gagal membuka kembali laporan');
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm('Yakin ingin menghapus masalah ini?')) return;
    try {
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      if (res.ok) await refreshPO();
    } catch (error) {
      console.error('Failed to delete issue:', error);
    }
  };

  const handleDeletePO = async () => {
    if (!po) return;
    if (!confirm('Yakin ingin menghapus PO ini? Tindakan ini tidak dapat dibatalkan.')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pos/${po.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/pos');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus PO');
      }
    } catch (error) {
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
      alert('ERR_020: Gagal mengupdate status finance');
    } finally {
      setIsUpdatingFinance(false);
    }
  };

  const allItemsDelivered = po?.items.every(item => 
    item.quantityDelivered >= item.quantityTotal
  ) ?? false;

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!user || !po) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Tidak ditemukan</p>
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

  const isAdmin = user.role === 'super_admin';
  const isFinance = user.role === 'finance';

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
          <Link
            href="/tasks"
            prefetch={true}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Kembali ke Tugas
          </Link>
        </div>

        {/* PO Info */}
        <div className={cn(
          'bg-card rounded-2xl p-6 border',
          po.isUrgent ? 'border-destructive' : 'border-border'
        )}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{po.poNumber}</h1>
                {po.isUrgent && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-destructive/10 text-destructive">
                    URGENT
                  </span>
                )}
                {po.isVendorJob && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                    VENDOR: {po.vendorName}
                  </span>
                )}
                <span className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full',
                  po.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  po.status === 'completed' ? 'bg-muted text-muted-foreground' :
                  'bg-destructive/10 text-destructive'
                )}>
                  {po.status}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{po.client.name}</p>
              {po.clientPoNumber && (
                <p className="text-sm text-muted-foreground mt-1">
                  PO Klien: {po.clientPoNumber}
                </p>
              )}
              {po.isVendorJob && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Informasi Vendor</p>
                  <p className="text-sm text-blue-800">Nama: {po.vendorName}</p>
                  {po.vendorPhone && <p className="text-sm text-blue-800">Telp: {po.vendorPhone}</p>}
                  {po.vendorEstimation && (
                    <p className="text-sm text-blue-800">
                      Estimasi Selesai: {new Date(po.vendorEstimation).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                <p>Tanggal PO: {new Date(po.poDate).toLocaleDateString('id-ID')}</p>
                {po.deliveryDeadline && (
                  <p className={cn('mt-1', 
                    new Date(po.deliveryDeadline) < new Date() ? 'text-destructive font-semibold' : 'text-amber-600'
                  )}>
                    Jatuh tempo: {new Date(po.deliveryDeadline).toLocaleDateString('id-ID')}
                  </p>
                )}
              </div>
              
              {isAdmin && (
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Link
                    href={`/pos/${po.id}/edit`}
                    prefetch={true}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDeletePO}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {po.notes && (
            <p className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-xl">
              {po.notes}
            </p>
          )}
        </div>

        {/* Finance Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
            <div className={cn(
              'p-4 rounded-xl border',
              po.isInvoiced ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', po.isInvoiced ? 'bg-emerald-100' : 'bg-muted')}>
                  <FileText className={cn('w-5 h-5', po.isInvoiced ? 'text-emerald-600' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {po.isInvoiced ? 'Invoice dikirim' : 'Belum Di-invoice'}
                  </p>
                  {po.isInvoiced && po.invoiceNumber && (
                    <p className="text-xs text-muted-foreground">No: {po.invoiceNumber}</p>
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
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFinanceUpdate('invoice')}
                          disabled={isUpdatingFinance}
                          className="flex-1 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isUpdatingFinance ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          onClick={() => { setShowFinanceForm(false); setInvoiceNumber(''); }}
                          className="px-3 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Status */}
            <div className={cn(
              'p-4 rounded-xl border',
              po.isPaid ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', po.isPaid ? 'bg-emerald-100' : 'bg-muted')}>
                  <CreditCard className={cn('w-5 h-5', po.isPaid ? 'text-emerald-600' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {po.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                  </p>
                </div>
              </div>
              
              {isFinance && (
                <button
                  onClick={() => handleFinanceUpdate('payment')}
                  disabled={isUpdatingFinance || (!po.isPaid && !allItemsDelivered)}
                  className="w-full mt-3 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:bg-muted"
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
          <h2 className="text-lg font-semibold text-foreground">
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
                  onUpdate={refreshPO}
                  onReportIssue={(item) => { setSelectedItem(item); setIsModalOpen(true); }}
                  cardStatus={getCardStatus(item)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingIssue(null); setSelectedItem(null); }}
        onSubmit={editingIssue ? handleEditIssue : handleReportIssue}
        itemName={selectedItem?.itemName || ''}
        editingIssue={editingIssue}
      />
    </DashboardLayout>
  );
}
