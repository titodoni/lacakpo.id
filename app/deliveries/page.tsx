'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { Truck, Package, CheckCircle2 } from 'lucide-react';

interface Item {
  id: string;
  itemName: string;
  quantityTotal: number;
  quantityUnit: string;
  quantityDelivered: number;
  isDelivered: boolean;
  purchaseOrder: {
    id: string;
    poNumber: string;
    client: { name: string };
  };
}

export default function DeliveriesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchItems();
    }
  }, [user, userLoading, router]);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items?status=undelivered');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
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

  // Filter items ready for delivery (QC 100%)
  const readyItems = items.filter(item => {
    const qcTrack = item.tracks?.find((t: any) => t.department === 'qc');
    return qcTrack?.progress === 100;
  });

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Manajemen Pengiriman</h1>
            <p className="text-zinc-500 mt-1">
              Tandai item sebagai terkirim dan kelola surat jalan
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">{items.length}</p>
            <p className="text-sm text-blue-600">Item Tertunda</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-2xl font-bold text-emerald-700">{readyItems.length}</p>
            <p className="text-sm text-emerald-600">Siap Dikirim</p>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
            <p className="text-2xl font-bold text-zinc-700">
              {Math.round((readyItems.length / (items.length || 1)) * 100)}%
            </p>
            <p className="text-sm text-zinc-500">Tingkat Kesiapan</p>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Item Siap Dikirim</h2>
          
          {readyItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-zinc-200 text-center">
              <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">Tidak ada item siap dikirim.</p>
              <p className="text-sm text-zinc-400 mt-2">
                Item dengan QC 100% akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {readyItems.map((item) => {
                const remaining = item.quantityTotal - item.quantityDelivered;
                const isPartial = item.quantityDelivered > 0;
                
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-zinc-200 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-900">{item.itemName}</h3>
                        <p className="text-sm text-zinc-500 mt-1">
                          {item.purchaseOrder.client.name} • {item.purchaseOrder.poNumber}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            <span className="text-zinc-400">Total:</span>{' '}
                            <span className="font-medium">{item.quantityTotal} {item.quantityUnit}</span>
                          </span>
                          {isPartial && (
                            <span className="text-sm">
                              <span className="text-zinc-400">Terkirim:</span>{' '}
                              <span className="font-medium text-emerald-600">
                                {item.quantityDelivered} {item.quantityUnit}
                              </span>
                            </span>
                          )}
                          <span className="text-sm">
                            <span className="text-zinc-400">Sisa:</span>{' '}
                            <span className="font-medium text-blue-600">
                              {remaining} {item.quantityUnit}
                            </span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <Truck className="w-4 h-4" />
                        Kirim
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Undelivered Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Semua Item Tertunda</h2>
          
          <div className="grid gap-3">
            {items
              .filter(item => !readyItems.find(r => r.id === item.id))
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-700">{item.itemName}</h3>
                      <p className="text-xs text-zinc-400">
                        {item.purchaseOrder.client.name} • {item.purchaseOrder.poNumber}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                      QC Belum Selesai
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Delivery Modal */}
      {showModal && selectedItem && (
        <DeliveryModal
          item={selectedItem}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
          }}
          onSuccess={fetchItems}
        />
      )}
    </DashboardLayout>
  );
}

function DeliveryModal({
  item,
  onClose,
  onSuccess,
}: {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(
    (item.quantityTotal - item.quantityDelivered).toString()
  );
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [suratJalan, setSuratJalan] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const remaining = item.quantityTotal - item.quantityDelivered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity: parseInt(quantity),
          deliveryDate,
          suratJalanNumber: suratJalan || undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create delivery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Buat Pengiriman</h2>
        <p className="text-zinc-500 text-sm mb-6">{item.itemName}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Jumlah yang Dikirim
            </label>
            <input
              type="number"
              min="1"
              max={remaining}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              required
            />
            <p className="text-xs text-zinc-400 mt-1">
              Maks: {remaining} {item.quantityUnit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Tanggal Pengiriman
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nomor Surat Jalan
            </label>
            <input
              type="text"
              value={suratJalan}
              onChange={(e) => setSuratJalan(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              placeholder="SJ-2026-XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Catatan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-20 px-4 py-2 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none resize-none"
              placeholder="Catatan pengiriman..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Konfirmasi Pengiriman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
