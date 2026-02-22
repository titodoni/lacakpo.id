import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { prisma } from '@/lib/prisma';

// Calculate delivery status
function getDeliveryStatus(poDate: Date, deliveryDeadline: Date | null) {
  if (!deliveryDeadline) return { status: 'no-deadline', label: 'Tanpa Deadline', color: 'bg-zinc-100 text-zinc-600' };
  
  const now = new Date();
  const deadline = new Date(deliveryDeadline);
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Overdue
  if (diffDays < 0) {
    return { 
      status: 'delayed', 
      label: `Terlambat ${Math.abs(diffDays)} hari`, 
      color: 'bg-red-100 text-red-700 border-red-200',
      urgent: true 
    };
  }
  
  // Due today
  if (diffDays === 0) {
    return { 
      status: 'due-today', 
      label: 'Jatuh Tempo Hari Ini!', 
      color: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
      urgent: true 
    };
  }
  
  // 1-3 days warning
  if (diffDays <= 3) {
    return { 
      status: 'warning', 
      label: `${diffDays} hari lagi`, 
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      urgent: true 
    };
  }
  
  // 4-7 days - approaching
  if (diffDays <= 7) {
    return { 
      status: 'approaching', 
      label: `${diffDays} hari lagi`, 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200' 
    };
  }
  
  // On track
  return { 
    status: 'on-track', 
    label: `${diffDays} hari lagi`, 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  };
}

export default async function POsPage() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      client: true,
      items: {
        select: {
          id: true,
          itemName: true,
          quantityTotal: true,
          quantityUnit: true,
          tracks: {
            select: {
              department: true,
              progress: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Sort by urgency (delayed first, then by deadline)
  const sortedPOs = purchaseOrders.sort((a, b) => {
    const statusA = getDeliveryStatus(a.poDate, a.deliveryDeadline);
    const statusB = getDeliveryStatus(b.poDate, b.deliveryDeadline);
    
    // Urgent items first
    if (statusA.urgent && !statusB.urgent) return -1;
    if (!statusA.urgent && statusB.urgent) return 1;
    
    // Then by deadline
    if (a.deliveryDeadline && b.deliveryDeadline) {
      return new Date(a.deliveryDeadline).getTime() - new Date(b.deliveryDeadline).getTime();
    }
    
    return 0;
  });

  // Extract plain serializable values
  const userData = {
    userId: session.userId,
    username: session.username,
    role: session.role,
    department: session.department,
    name: session.name,
    isLoggedIn: session.isLoggedIn,
  };

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Daftar Purchase Order</h1>
            <p className="text-sm text-zinc-500 mt-1">
                      Menampilkan {sortedPOs.length} pesanan • Item diurutkan berdasarkan deadline
            </p>
          </div>
          {(['sales_admin', 'super_admin'] as string[]).includes(session.role) && (
            <a
              href="/pos/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              + PO Baru
            </a>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">🔥 PENTING</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">Terlambat / Hari Ini</span>
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md">1-3 Hari Lagi</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md">4-7 Hari Lagi</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">Tepat Waktu</span>
        </div>

        {sortedPOs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-zinc-200 text-center">
            <p className="text-zinc-500">Belum ada purchase order.</p>
            <a
              href="/pos/new"
              className="inline-block mt-4 text-zinc-900 font-medium hover:underline"
            >
              Buat PO pertama
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedPOs.map((po) => {
              const deliveryStatus = getDeliveryStatus(po.poDate, po.deliveryDeadline);
              const firstItem = po.items[0];
              const itemCount = po.items.length;
              
              return (
                <a
                  key={po.id}
                  href={`/pos/${po.id}`}
                  className="block bg-white rounded-2xl p-5 border border-zinc-200 hover:border-zinc-400 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Item Info (Main Focus) */}
                    <div className="flex-1 min-w-0">
                      {/* Item Name - Highlighted */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-zinc-900 truncate">
                          {firstItem?.itemName || 'Item Tanpa Nama'}
                          {itemCount > 1 && (
                            <span className="text-sm font-normal text-zinc-500 ml-2">
                              +{itemCount - 1} lainnya
                            </span>
                          )}
                        </h3>
                        {po.isUrgent && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                            🔥 PENTING
                          </span>
                        )}
                      </div>
                      
                      {/* Quantity */}
                      {firstItem && (
                        <p className="text-sm text-zinc-600 mt-1">
                          {firstItem.quantityTotal} {firstItem.quantityUnit}
                        </p>
                      )}
                      
                      {/* PO & Client Info - Secondary */}
                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                        <span className="font-mono text-xs bg-zinc-100 px-2 py-0.5 rounded">
                          {po.poNumber}
                        </span>
                        <span>•</span>
                        <span>{po.client.name}</span>
                      </div>
                      
                      {/* Overall Progress + Department Checklist */}
                      {firstItem && firstItem.tracks.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {/* Overall Progress */}
                          {(() => {
                            const avgProgress = Math.round(
                              firstItem.tracks.reduce((sum, t) => sum + t.progress, 0) / firstItem.tracks.length
                            );
                            return (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      avgProgress === 100 ? 'bg-emerald-500' :
                                      avgProgress >= 75 ? 'bg-zinc-600' :
                                      avgProgress >= 50 ? 'bg-zinc-500' :
                                      avgProgress >= 25 ? 'bg-zinc-400' :
                                      'bg-zinc-300'
                                    }`}
                                    style={{ width: `${avgProgress}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold font-mono ${
                                  avgProgress === 100 ? 'text-emerald-600' : 'text-zinc-700'
                                }`}>
                                  {avgProgress}%
                                </span>
                              </div>
                            );
                          })()}
                          
                          {/* Department Checklist */}
                          <div className="flex gap-3">
                            {firstItem.tracks.map((track) => (
                              <div key={track.department} className="flex items-center gap-1">
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    track.progress === 100 ? 'bg-emerald-500' :
                                    track.progress >= 50 ? 'bg-zinc-500' :
                                    track.progress > 0 ? 'bg-zinc-300' :
                                    'bg-zinc-200'
                                  }`}
                                />
                                <span className="text-xs text-zinc-400 capitalize">
                                  {track.department.slice(0, 3)}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono">
                                  {track.progress}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Delivery Status */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${deliveryStatus.color}`}>
                        {deliveryStatus.label}
                      </span>
                      
                      {/* Delivery Date */}
                      {po.deliveryDeadline && (
                        <p className="text-xs text-zinc-500">
                          Jatuh tempo: {new Date(po.deliveryDeadline).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit'
                          })}
                        </p>
                      )}
                      
                      {/* PO Status */}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        po.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600'
                          : po.status === 'completed'
                          ? 'bg-zinc-100 text-zinc-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
