'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  code: string;
}

interface Item {
  id?: string;
  itemName: string;
  specification: string;
  quantityTotal: number;
  quantityUnit: string;
  productionType: string;
}

interface PO {
  id: string;
  poNumber: string;
  clientPoNumber: string | null;
  clientId: string;
  poDate: string;
  deliveryDeadline: string | null;
  notes: string | null;
  status: string;
  isUrgent: boolean;
  items: Item[];
}

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

export default function EditPOPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [poNumber, setPoNumber] = useState('');
  const [clientPoNumber, setClientPoNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [poDate, setPoDate] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [isUrgent, setIsUrgent] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      // Only admin and manager can edit
      if (!['super_admin', 'manager'].includes(user.role)) {
        router.push(`/pos/${params.id}`);
        return;
      }
      fetchData();
    }
  }, [user, userLoading, router, params.id]);

  const fetchData = async () => {
    try {
      // Fetch clients
      const clientsRes = await fetch('/api/clients');
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }

      // Fetch PO
      const poRes = await fetch(`/api/pos/${params.id}`);
      if (poRes.ok) {
        const poData = await poRes.json();
        const po = poData.po;
        
        setPoNumber(po.poNumber);
        setClientPoNumber(po.clientPoNumber || '');
        setSelectedClient(po.clientId);
        setPoDate(po.poDate.split('T')[0]);
        setDeliveryDeadline(po.deliveryDeadline ? po.deliveryDeadline.split('T')[0] : '');
        setNotes(po.notes || '');
        setStatus(po.status);
        setIsUrgent(po.isUrgent);
        setItems(po.items.map((item: any) => ({
          id: item.id,
          itemName: item.itemName,
          specification: item.specification || '',
          quantityTotal: item.quantityTotal,
          quantityUnit: item.quantityUnit,
          productionType: item.productionType,
        })));
      } else {
        setError('Gagal memuat data PO');
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('ERR_015: Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      itemName: '',
      specification: '',
      quantityTotal: 1,
      quantityUnit: 'pcs',
      productionType: 'both',
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!poNumber.trim()) {
      setError('Nomor PO wajib diisi');
      return;
    }
    if (!selectedClient) {
      setError('Klien wajib dipilih');
      return;
    }
    if (!poDate) {
      setError('Tanggal PO wajib diisi');
      return;
    }
    if (items.length === 0) {
      setError('Minimal 1 item wajib diisi');
      return;
    }
    for (const item of items) {
      if (!item.itemName.trim()) {
        setError('Nama item wajib diisi');
        return;
      }
      if (item.quantityTotal < 1) {
        setError('Jumlah item minimal 1');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poNumber: poNumber.trim(),
          clientPoNumber: clientPoNumber.trim() || null,
          clientId: selectedClient,
          poDate,
          deliveryDeadline: deliveryDeadline || null,
          notes: notes.trim() || null,
          status,
          isUrgent,
          items,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/pos/${params.id}`);
        router.refresh();
      } else {
        setError(data.error || data.message || 'Gagal mengupdate PO');
      }
    } catch (err) {
      console.error('Failed to update PO:', err);
      setError('ERR_016: Gagal mengupdate PO');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ color: colors.gunmetal }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Memuat...</span>
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

  return (
    <DashboardLayout user={userData}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <a
            href={`/pos/${params.id}`}
            className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: colors.gunmetal }}
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </a>
          <h1 className="text-2xl font-bold" style={{ color: colors.black }}>
            Edit PO
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PO Info Card */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: colors.paleSky }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.black }}>
              Informasi PO
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                  Nomor PO <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.paleSky }}
                  placeholder="Contoh: PO-2026-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                  Nomor PO Klien
                </label>
                <input
                  type="text"
                  value={clientPoNumber}
                  onChange={(e) => setClientPoNumber(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.paleSky }}
                  placeholder="Opsional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                  Klien <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white"
                  style={{ borderColor: colors.paleSky }}
                  required
                >
                  <option value="">Pilih Klien</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white"
                  style={{ borderColor: colors.paleSky }}
                >
                  <option value="active">Aktif</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                  Tanggal PO <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.paleSky }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                  Jatuh Tempo Pengiriman
                </label>
                <input
                  type="date"
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.paleSky }}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                Catatan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none"
                style={{ borderColor: colors.paleSky }}
                placeholder="Catatan tambahan..."
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isUrgent"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
              />
              <label htmlFor="isUrgent" className="text-sm font-medium" style={{ color: colors.gunmetal }}>
                Tandai sebagai PO Penting
              </label>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: colors.paleSky }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: colors.black }}>
                Item ({items.length})
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.shamrock }}
              >
                <Plus className="w-4 h-4" />
                Tambah Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-xl p-4"
                  style={{ borderColor: colors.paleSky }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-sm font-medium" style={{ color: colors.gunmetal }}>
                      Item #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                        Nama Item <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: colors.paleSky }}
                        placeholder="Nama item"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                        Spesifikasi
                      </label>
                      <input
                        type="text"
                        value={item.specification}
                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: colors.paleSky }}
                        placeholder="Spesifikasi teknis"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                        Jumlah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantityTotal}
                        onChange={(e) => handleItemChange(index, 'quantityTotal', parseInt(e.target.value) || 1)}
                        className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: colors.paleSky }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                        Satuan
                      </label>
                      <select
                        value={item.quantityUnit}
                        onChange={(e) => handleItemChange(index, 'quantityUnit', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white"
                        style={{ borderColor: colors.paleSky }}
                      >
                        <option value="pcs">pcs</option>
                        <option value="unit">unit</option>
                        <option value="set">set</option>
                        <option value="kg">kg</option>
                        <option value="meter">meter</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.gunmetal }}>
                        Tipe Produksi
                      </label>
                      <select
                        value={item.productionType}
                        onChange={(e) => handleItemChange(index, 'productionType', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white"
                        style={{ borderColor: colors.paleSky }}
                      >
                        <option value="both">Machining + Fabrication</option>
                        <option value="machining">Machining Only</option>
                        <option value="fabrication">Fabrication Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-xl" style={{ borderColor: colors.paleSky }}>
                  <p className="text-sm" style={{ color: colors.gunmetal }}>
                    Belum ada item. Klik "Tambah Item" untuk menambah.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <a
              href={`/pos/${params.id}`}
              className="flex-1 h-14 flex items-center justify-center rounded-xl font-semibold border transition-colors"
              style={{ borderColor: colors.paleSky, color: colors.gunmetal }}
            >
              Batal
            </a>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-14 flex items-center justify-center rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: colors.shamrock }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
