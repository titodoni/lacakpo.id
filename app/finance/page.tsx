'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Item {
  id: string;
  itemName: string;
  quantityTotal: number;
  quantityUnit: string;
  quantityDelivered: number;
  isDelivered: boolean;
  deliveredAt: string | null;
  purchaseOrder: {
    id: string;
    poNumber: string;
    client: { name: string };
    poDate: string;
  };
  tracks: {
    department: string;
    progress: number;
  }[];
}

export default function FinancePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'delivered' | 'pending'>('all');

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
      // Finance sees delivered items only
      const res = await fetch('/api/items?status=delivered');
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

  // Calculate statistics
  const fullyDelivered = items.filter(i => i.isDelivered).length;
  const partiallyDelivered = items.filter(i => !i.isDelivered && i.quantityDelivered > 0).length;
  const totalQuantity = items.reduce((sum, i) => sum + i.quantityTotal, 0);
  const totalDelivered = items.reduce((sum, i) => sum + i.quantityDelivered, 0);

  const filteredItems = items.filter(item => {
    if (filter === 'delivered') return item.isDelivered;
    if (filter === 'pending') return !item.isDelivered && item.quantityDelivered > 0;
    return true;
  });

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tampilan Keuangan</h1>
          <p className="text-zinc-500 mt-1">
            Item terkirim siap untuk penagihan dan tracking pembayaran
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{fullyDelivered}</p>
                <p className="text-sm text-emerald-600">Terkirim Penuh</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{partiallyDelivered}</p>
                <p className="text-sm text-amber-600">Pengiriman Parsial</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{totalDelivered}</p>
                <p className="text-sm text-blue-600">Total Jumlah Terkirim</p>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-700">{totalQuantity}</p>
                <p className="text-sm text-zinc-500">Total Jumlah Pesanan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Progress */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Progress Pengiriman Keseluruhan</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(totalDelivered / (totalQuantity || 1)) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-zinc-900">
              {Math.round((totalDelivered / (totalQuantity || 1)) * 100)}%
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            {totalDelivered} dari {totalQuantity} item terkirim
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'delivered', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {f === 'all' ? 'Semua Item' : f === 'delivered' ? 'Terkirim Penuh' : 'Parsial'}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Item Terkirim</h2>
          
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-zinc-200 text-center">
              <DollarSign className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">Tidak ada item terkirim ditemukan.</p>
              <p className="text-sm text-zinc-400 mt-2">
                Keuangan hanya dapat melihat item yang sudah terkirim.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((item) => {
                const overallProgress = item.tracks?.length
                  ? Math.round(item.tracks.reduce((sum, t) => sum + t.progress, 0) / item.tracks.length)
                  : 0;
                
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-zinc-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900">{item.itemName}</h3>
                          {item.isDelivered ? (
                            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                              Terkirim Penuh
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                              Parsial
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 mt-1">
                          {item.purchaseOrder.client.name} • {item.purchaseOrder.poNumber}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Tanggal PO: {new Date(item.purchaseOrder.poDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-zinc-900">
                          {item.quantityDelivered} / {item.quantityTotal}
                        </p>
                        <p className="text-xs text-zinc-400">{item.quantityUnit}</p>
                        {item.deliveredAt && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Terkirim {new Date(item.deliveredAt).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">Produksi:</span>
                        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-zinc-600">
                          {overallProgress}%
                        </span>
                      </div>
                    </div>
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
