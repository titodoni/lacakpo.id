'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';

interface ItemInput {
  id: string;
  name: string;
  spec: string;
  qty: string;
  unit: string;
  productionType: 'machining' | 'fabrication' | 'both';
}

export default function NewPOPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [poNumber, setPoNumber] = useState('');
  const [clientPoNumber, setClientPoNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVendorJob, setIsVendorJob] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEstimation, setVendorEstimation] = useState('');
  const [items, setItems] = useState<ItemInput[]>([
    { id: '1', name: '', spec: '', qty: '1', unit: 'pcs', productionType: 'both' },
  ]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && !['sales_admin', 'super_admin'].includes(user.role)) {
      router.push('/pos');
    }
  }, [user, userLoading, router]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', spec: '', qty: '1', unit: 'pcs', productionType: 'both' },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ItemInput, value: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!poNumber.trim()) {
      setError('Nomor PO wajib diisi');
      return;
    }
    if (!clientName.trim()) {
      setError('Nama klien wajib diisi');
      return;
    }
    if (!poDate) {
      setError('Tanggal PO wajib diisi');
      return;
    }

    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      setError('Minimal satu item wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poNumber: poNumber.trim(),
          clientPoNumber: clientPoNumber.trim() || undefined,
          clientName: clientName.trim(),
          poDate,
          deliveryDeadline: deliveryDeadline || undefined,
          notes: notes.trim() || undefined,
          isUrgent,
          isVendorJob,
          vendorName: vendorName.trim() || undefined,
          vendorPhone: vendorPhone.trim() || undefined,
          vendorEstimation: vendorEstimation || undefined,
          items: validItems.map((item) => ({
            name: item.name,
            spec: item.spec,
            qty: parseInt(item.qty) || 1,
            unit: item.unit,
            productionType: item.productionType,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal membuat PO');
        return;
      }

      router.push('/pos');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat...</p>
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

  return (
    <DashboardLayout user={userData}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <a
            href="/pos"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Purchase Order Baru</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm rounded-xl bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PO Info Card */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border">
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">Informasi PO</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* PO Number */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nomor PO <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="PO-2026-001"
                  disabled={isLoading}
                />
              </div>

              {/* Client PO Number */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  No. PO Client
                </label>
                <input
                  type="text"
                  value={clientPoNumber}
                  onChange={(e) => setClientPoNumber(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Referensi Client"
                  disabled={isLoading}
                />
              </div>

              {/* Client Name */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nama Klien <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Masukkan nama perusahaan klien"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Klien baru akan dibuat jika belum ada
                </p>
              </div>

              {/* PO Date */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Tanggal PO <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Delivery Deadline */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Batas Pengiriman
                </label>
                <input
                  type="date"
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Is Urgent */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 p-3 sm:p-4 border border-border rounded-xl cursor-pointer
                  hover:bg-muted/50 transition-colors bg-card">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-5 h-5 text-destructive rounded focus:ring-destructive"
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="font-medium text-foreground">URGENT</span>
                  </div>
                </label>
              </div>

              {/* Vendor Job */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 p-3 sm:p-4 border border-border rounded-xl cursor-pointer
                  hover:bg-muted/50 transition-colors bg-card">
                  <input
                    type="checkbox"
                    checked={isVendorJob}
                    onChange={(e) => setIsVendorJob(e.target.checked)}
                    className="w-5 h-5 text-primary rounded focus:ring-primary"
                    disabled={isLoading}
                  />
                  <div>
                    <span className="font-medium text-foreground">Pengerjaan Vendor</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Production dept tidak bisa update progress jika opsi ini aktif
                    </p>
                  </div>
                </label>
              </div>

              {/* Vendor Details */}
              {isVendorJob && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Nama Vendor <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                        focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      placeholder="Nama vendor"
                      disabled={isLoading}
                      required={isVendorJob}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      No. Telp Vendor
                    </label>
                    <input
                      type="text"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                        focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      placeholder="Nomor telepon vendor"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Estimasi Penyelesaian Vendor
                    </label>
                    <input
                      type="date"
                      value={vendorEstimation}
                      onChange={(e) => setVendorEstimation(e.target.value)}
                      className="w-full h-11 sm:h-12 px-3 sm:px-4 rounded-xl border border-input bg-background
                        focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Catatan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 sm:h-24 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-input bg-background
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-all"
                  placeholder="Catatan tambahan..."
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Nama Barang</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                  hover:bg-primary-hover active:scale-[0.98] transition-all"
                disabled={isLoading}
              >
                <span className="hidden sm:inline">+ Tambah Barang</span>
                <span className="sm:hidden">+ Tambah</span>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-muted/30 rounded-xl p-3 sm:p-4 border border-border"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Barang ke-{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive text-sm hover:text-destructive/80 transition-colors"
                        disabled={isLoading}
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {/* Item Name */}
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full h-10 sm:h-11 px-3 rounded-lg border border-input bg-background
                          focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="Nama barang *"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Specification */}
                    <div>
                      <input
                        type="text"
                        value={item.spec}
                        onChange={(e) => updateItem(item.id, 'spec', e.target.value)}
                        className="w-full h-10 sm:h-11 px-3 rounded-lg border border-input bg-background
                          focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="Spesifikasi"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        className="flex-1 h-10 sm:h-11 px-3 rounded-lg border border-input bg-background
                          focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        placeholder="Jumlah"
                        min="1"
                        disabled={isLoading}
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-20 sm:w-24 h-10 sm:h-11 px-2 rounded-lg border border-input bg-background
                          focus:border-primary focus:outline-none transition-all"
                        disabled={isLoading}
                      >
                        <option value="pcs">pcs</option>
                        <option value="set">set</option>
                        <option value="kg">kg</option>
                        <option value="m">m</option>
                      </select>
                    </div>

                    {/* Production Type */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">
                        Jenis Produksi
                      </label>
                      <div className="flex gap-2">
                        {(['machining', 'fabrication', 'both'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateItem(item.id, 'productionType', type)}
                            className={`flex-1 h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                              item.productionType === type
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border border-input text-foreground hover:bg-muted'
                            }`}
                            disabled={isLoading}
                          >
                            {type === 'machining' ? 'Machining' : type === 'fabrication' ? 'Fabrikasi' : 'Keduanya'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 sm:pt-4 pb-6 sm:pb-0">
            <a
              href="/pos"
              className="flex-1 h-12 sm:h-14 flex items-center justify-center border border-input text-foreground
                rounded-xl font-semibold hover:bg-muted transition-colors"
            >
              Batal
            </a>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 sm:h-14 bg-primary text-primary-foreground rounded-xl font-semibold
                disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-[0.98]
                transition-all"
            >
              {isLoading ? 'Membuat...' : 'Buat PO'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
