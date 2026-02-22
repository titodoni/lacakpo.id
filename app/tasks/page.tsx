'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { TrackCard } from '@/components/TrackCard';
import { AlertTriangle } from 'lucide-react';

interface Item {
  id: string;
  itemName: string;
  quantityTotal: number;
  quantityUnit: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    client: { name: string };
    deliveryDeadline: string | null;
  };
  tracks: Track[];
}

interface Track {
  id: string;
  department: string;
  progress: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');

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
      // Fetch items from user's department
      const res = await fetch('/api/items?filter=my-dept');
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

  // Determine user's department focus
  const getUserDept = (role: string): string | null => {
    if (role === 'drafter') return 'drafting';
    if (role === 'purchasing') return 'purchasing';
    if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(role)) return 'production';
    if (role === 'qc') return 'qc';
    return null;
  };

  const userDept = user ? getUserDept(user.role) : null;

  // Filter items based on user's department track
  const filteredItems = items.filter((item) => {
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

  const deptLabels: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Purchasing',
    production: 'Production',
    qc: 'QC',
  };

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Tugas Saya
            </h1>
            {userDept && (
              <p className="text-zinc-500 mt-1">
                Departemen {deptLabels[userDept]}
              </p>
            )}
          </div>
          
          {/* Filter Tabs */}
          {userDept && (
            <div className="flex bg-zinc-100 rounded-xl p-1">
              {(['all', 'todo', 'in-progress', 'done'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'todo' ? 'Belum Mulai' : f === 'in-progress' ? 'Sedang Dikerjakan' : f === 'done' ? 'Selesai' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Admin/Super Admin View - No specific department */}
        {!userDept && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800">
                Sebagai {user.role === 'super_admin' ? 'Super Admin' : 'Manager'}, Anda dapat melihat semua item tetapi tidak dapat mengupdate progress langsung.
              </p>
            </div>
          </div>
        )}

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-zinc-200 text-center">
            <p className="text-zinc-500">Tidak ada item ditemukan.</p>
            <p className="text-sm text-zinc-400 mt-2">
              {filter === 'all' 
                ? 'Tidak ada item yang ditugaskan ke departemen Anda.' 
                : `Tidak ada item dengan status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const myTrack = userDept 
                ? item.tracks.find((t) => t.department === userDept)
                : null;
              const otherTracks = item.tracks.filter((t) => t.department !== userDept);
              
              // Check if delivery is urgent
              const isUrgent = item.purchaseOrder.deliveryDeadline && 
                new Date(item.purchaseOrder.deliveryDeadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border ${
                    isUrgent ? 'border-red-200 bg-red-50/30' : 'border-zinc-200'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900">{item.itemName}</h3>
                        {isUrgent && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                            Mendesak
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        {item.quantityTotal} {item.quantityUnit} • {item.purchaseOrder.client.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 font-mono">
                        {item.purchaseOrder.poNumber}
                      </p>
                      {item.purchaseOrder.deliveryDeadline && (
                        <p className={`text-xs mt-1 ${isUrgent ? 'text-red-600 font-medium' : 'text-zinc-400'}`}>
                          Jatuh tempo: {new Date(item.purchaseOrder.deliveryDeadline).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                    <a
                      href={`/pos/${item.purchaseOrder.id}`}
                      className="text-sm text-zinc-500 hover:text-zinc-900"
                    >
                      Lihat PO →
                    </a>
                  </div>

                  {/* My Track (if applicable) */}
                  {myTrack && (
                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                        Progress Anda ({deptLabels[userDept]})
                      </p>
                      <TrackCard
                        track={{
                          ...myTrack,
                          updater: null,
                        }}
                        userRole={user.role}
                        onUpdate={fetchItems}
                      />
                    </div>
                  )}

                  {/* Other Departments Progress */}
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-xs text-zinc-400 mb-3">
                      Departemen Lain
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {otherTracks.map((track) => (
                        <div
                          key={track.id}
                          className="bg-zinc-50 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-500 capitalize">
                              {track.department}
                            </span>
                            <span className={`text-sm font-bold ${
                              track.progress === 100 ? 'text-emerald-600' : 'text-zinc-700'
                            }`}>
                              {track.progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                track.progress === 100 ? 'bg-emerald-500' :
                                track.progress >= 50 ? 'bg-zinc-500' :
                                track.progress > 0 ? 'bg-zinc-300' :
                                'bg-zinc-200'
                              }`}
                              style={{ width: `${track.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
