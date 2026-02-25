'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
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
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        // Only sales_admin and super_admin can create POs
        if (!['sales_admin', 'super_admin'].includes(data.user.role)) {
          router.push('/pos');
          return;
        }
        setIsAuthorized(true);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

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
    
    // Validation
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
    
    // Validate items
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

  // Show loading while checking auth
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Memeriksa otorisasi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 lg:ml-64">
      <main className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <a
              href="/pos"
              className="text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ← Kembali
            </a>
            <h1 className="text-2xl font-bold text-zinc-900">Purchase Order Baru</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PO Info Card */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Informasi PO</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PO Number */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Nomor PO <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                    placeholder="PO-2026-001"
                    disabled={isLoading}
                  />
                </div>

                {/* Client PO Number */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Client PO Number
                  </label>
                  <input
                    type="text"
                    value={clientPoNumber}
                    onChange={(e) => setClientPoNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                    placeholder="Client Reference"
                    disabled={isLoading}
                  />
                </div>

                {/* Client Name - Text Input */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Nama Klien <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                    placeholder="Masukkan nama perusahaan klien"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Klien baru akan dibuat jika belum ada
                  </p>
                </div>

                {/* PO Date */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Tanggal PO <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                    disabled={isLoading}
                  />
                </div>

                {/* Delivery Deadline */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Delivery Deadline
                  </label>
                  <input
                    type="date"
                    value={deliveryDeadline}
                    onChange={(e) => setDeliveryDeadline(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                    disabled={isLoading}
                  />
                </div>

                {/* Is Urgent */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-zinc-900">Proyek PENTING</span>
                    </div>
                  </label>
                </div>

                {/* Vendor Job */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isVendorJob}
                      onChange={(e) => setIsVendorJob(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <div>
                      <span className="font-medium text-zinc-900">Pengerjaan Vendor</span>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Production dept tidak bisa update progress jika opsi ini aktif
                      </p>
                    </div>
                  </label>
                </div>

                {/* Vendor Details - Show only if isVendorJob */}
                {isVendorJob && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Nama Vendor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                        placeholder="Nama vendor"
                        disabled={isLoading}
                        required={isVendorJob}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        No. Telp Vendor
                      </label>
                      <input
                        type="text"
                        value={vendorPhone}
                        onChange={(e) => setVendorPhone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                        placeholder="Nomor telepon vendor"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Estimasi Penyelesaian Vendor
                      </label>
                      <input
                        type="date"
                        value={vendorEstimation}
                        onChange={(e) => setVendorEstimation(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100 resize-none"
                    placeholder="Catatan tambahan..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
                  disabled={isLoading}
                >
                  + Tambah Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-zinc-50 rounded-xl p-4 border border-zinc-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-500">
                        Item ke-{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 text-sm hover:text-red-600"
                          disabled={isLoading}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Item Name */}
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full h-11 px-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                          placeholder="Nama item *"
                          disabled={isLoading}
                        />
                      </div>
                      
                      {/* Specification */}
                      <div>
                        <input
                          type="text"
                          value={item.spec}
                          onChange={(e) => updateItem(item.id, 'spec', e.target.value)}
                          className="w-full h-11 px-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-none"
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
                          className="flex-1 h-11 px-3 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                          placeholder="Jumlah"
                          min="1"
                          disabled={isLoading}
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-24 h-11 px-2 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:outline-none bg-white"
                          disabled={isLoading}
                        >
                          <option value="pcs">pcs</option>
                          <option value="set">set</option>
                          <option value="kg">kg</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                      
                      {/* Production Type */}
                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">
                          Production Type
                        </label>
                        <div className="flex gap-2">
                          {(['machining', 'fabrication', 'both'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateItem(item.id, 'productionType', type)}
                              className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                                item.productionType === type
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                              }`}
                              disabled={isLoading}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
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
            <div className="flex gap-3 pt-4">
              <a
                href="/pos"
                className="flex-1 h-14 flex items-center justify-center border border-zinc-300 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-50 transition-colors"
              >
                Batal
              </a>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-14 bg-zinc-900 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                {isLoading ? 'Membuat...' : 'Buat PO'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
