import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { prisma } from '@/lib/prisma';

// Calculate delivery status
function getDeliveryStatus(poDate: Date, deliveryDeadline: Date | null) {
  if (!deliveryDeadline) return { status: 'no-deadline', label: 'Tanpa Deadline', color: 'bg-muted text-muted-foreground' };
  
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

// Get deadline display in hours with visual urgency indicators
function getDeadlineDisplayInHours(deliveryDeadline: Date | null): { 
  label: string; 
  className: string;
  isOverdue: boolean;
} {
  if (!deliveryDeadline) {
    return { label: '', className: '', isOverdue: false };
  }
  
  const now = new Date();
  const deadline = new Date(deliveryDeadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 0) {
    // Past deadline: "Xh TELAT" in red bold
    return { 
      label: `${Math.abs(diffHours)}h TELAT`, 
      className: 'text-red-600 font-bold',
      isOverdue: true 
    };
  } else if (diffHours <= 24) {
    // Less than 24h remaining: "Xh lagi" in orange semibold
    return { 
      label: `${diffHours}h lagi`, 
      className: 'text-orange-500 font-semibold',
      isOverdue: false 
    };
  } else {
    // More than 24h remaining: "Xh lagi" in emerald
    return { 
      label: `${diffHours}h lagi`, 
      className: 'text-emerald-600',
      isOverdue: false 
    };
  }
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
            <h1 className="text-2xl font-bold text-foreground">Daftar Purchase Order</h1>
            <p className="text-sm text-muted-foreground mt-1">
                      Menampilkan {sortedPOs.length} pesanan • Item diurutkan berdasarkan deadline
            </p>
          </div>
          {(['sales_admin', 'super_admin'] as string[]).includes(session.role) && (
            <Link
              href="/pos/new"
              prefetch={true}
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              + PO Baru
            </Link>
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
          <div className="bg-card rounded-2xl p-12 border border-border text-center">
            <p className="text-muted-foreground">Belum ada purchase order.</p>
            <Link
              href="/pos/new"
              prefetch={true}
              className="inline-block mt-4 text-foreground font-medium hover:underline"
            >
              Buat PO pertama
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedPOs.map((po) => {
              const deliveryStatus = getDeliveryStatus(po.poDate, po.deliveryDeadline);
              const deadlineDisplay = getDeadlineDisplayInHours(po.deliveryDeadline);
              const firstItem = po.items[0];
              const itemCount = po.items.length;
              
              return (
                <a
                  key={po.id}
                  href={`/pos/${po.id}`}
                  className={`block bg-card rounded-2xl p-5 border border-border hover:border-border transition-all hover:shadow-sm ${
                    deadlineDisplay.isOverdue ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Item Info (Main Focus) */}
                    <div className="flex-1 min-w-0">
                      {/* Item Name - Highlighted */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground truncate">
                          {firstItem?.itemName || 'Item Tanpa Nama'}
                          {itemCount > 1 && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {firstItem.quantityTotal} {firstItem.quantityUnit}
                        </p>
                      )}
                      
                      {/* PO & Client Info - Secondary */}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
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
                                <div className="w-20 h-2.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      avgProgress === 100 ? 'bg-emerald-500' :
                                      avgProgress >= 75 ? 'bg-muted-foreground' :
                                      avgProgress >= 50 ? 'bg-muted-foreground/80' :
                                      avgProgress >= 25 ? 'bg-muted-foreground/60' :
                                      'bg-muted'
                                    }`}
                                    style={{ width: `${avgProgress}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold font-mono ${
                                  avgProgress === 100 ? 'text-emerald-600' : 'text-foreground'
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
                                    track.progress >= 50 ? 'bg-muted-foreground/80' :
                                    track.progress > 0 ? 'bg-muted' :
                                    'bg-muted'
                                  }`}
                                />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {track.department.slice(0, 3)}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
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
                        <p className={`text-xs ${deadlineDisplay.className || 'text-muted-foreground'}`}>
                          {deadlineDisplay.label}
                        </p>
                      )}
                      
                      {/* PO Status */}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        po.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600'
                          : po.status === 'completed'
                          ? 'bg-muted text-muted-foreground'
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
