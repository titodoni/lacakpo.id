'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { TrackCard } from '@/components/TrackCard';

interface PO {
  id: string;
  poNumber: string;
  clientPoNumber: string | null;
  poDate: string;
  deliveryDeadline: string | null;
  notes: string | null;
  status: string;
  isUrgent: boolean;
  client: { name: string };
  items: Item[];
}

interface Item {
  id: string;
  itemName: string;
  specification: string | null;
  quantityTotal: number;
  quantityUnit: string;
  productionType: string;
  tracks: Track[];
}

interface Track {
  id: string;
  department: string;
  progress: number;
  updatedAt: string | null;
  updater: { name: string } | null;
}

// Workflow order: Drafting → Purchasing → Production → QC
const departmentOrder: Record<string, number> = {
  drafting: 1,
  purchasing: 2,
  production: 3,
  qc: 4,
};

function sortTracksByWorkflowOrder(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    return (departmentOrder[a.department] || 99) - (departmentOrder[b.department] || 99);
  });
}

export default function PODetailPage() {
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const [po, setPo] = useState<PO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPO();
  }, [params.id]);

  const fetchPO = async () => {
    try {
      const res = await fetch(`/api/pos/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch PO');
      const data = await res.json();
      setPo(data.po);
    } catch (err) {
      setError('Failed to load purchase order');
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

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a
            href="/pos"
            className="text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Kembali
          </a>
        </div>

        {/* PO Info */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900">{po.poNumber}</h1>
                {po.isUrgent && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
                    🔥 PENTING
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
            </div>
            <div className="text-right text-sm text-zinc-500">
              <p>Tanggal PO: {new Date(po.poDate).toLocaleDateString('id-ID')}</p>
              {po.deliveryDeadline && (
                <p className="text-red-500 mt-1">
                  Jatuh tempo: {new Date(po.deliveryDeadline).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>
          {po.notes && (
            <p className="mt-4 text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl">
              {po.notes}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Item ({po.items.length})
          </h2>
          
          {po.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-zinc-200"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-zinc-900">{item.itemName}</h3>
                <p className="text-sm text-zinc-500">
                  Jumlah: {item.quantityTotal} {item.quantityUnit}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Produksi: <span className="capitalize font-medium">{item.productionType}</span>
                </p>
                {item.specification && (
                  <p className="text-sm text-zinc-400 mt-1">
                    {item.specification}
                  </p>
                )}
              </div>

              {/* Tracks - Sorted by workflow order: Drafting → Purchasing → Production → QC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sortTracksByWorkflowOrder(item.tracks).map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    userRole={user.role}
                    onUpdate={fetchPO}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
