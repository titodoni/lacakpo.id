import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const session = await requireAuth();
    
    // Get user's department tracks they can update
    const userDepartment = session.department;
    const userRole = session.role;
    
    // Determine which department track to focus on
    let focusDepartment: string | null = null;
    if (['drafter'].includes(userRole)) focusDepartment = 'drafting';
    else if (['purchasing'].includes(userRole)) focusDepartment = 'purchasing';
    else if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(userRole)) focusDepartment = 'production';
    else if (['qc'].includes(userRole)) focusDepartment = 'qc';
    
    // Get all active items with tracks
    const items = await prisma.item.findMany({
      where: {
        purchaseOrder: { status: 'active' },
        isDelivered: false,
      },
      include: {
        purchaseOrder: {
          select: { poNumber: true, client: { select: { name: true } }, deliveryDeadline: true },
        },
        tracks: true,
      },
      take: 100,
    });
    
    // Calculate statistics
    const totalItems = items.length;
    
    // Items by overall progress ranges
    const notStarted = items.filter(i => 
      i.tracks.reduce((sum, t) => sum + t.progress, 0) / i.tracks.length === 0
    ).length;
    
    const inProgress = items.filter(i => {
      const avg = i.tracks.reduce((sum, t) => sum + t.progress, 0) / i.tracks.length;
      return avg > 0 && avg < 100;
    }).length;
    
    const completed = items.filter(i =>
      i.tracks.reduce((sum, t) => sum + t.progress, 0) / i.tracks.length === 100
    ).length;
    
    // Department-specific stats
    let myDeptStats = null;
    if (focusDepartment) {
      const deptTracks = items.flatMap(i => i.tracks).filter(t => t.department === focusDepartment);
      myDeptStats = {
        department: focusDepartment,
        total: deptTracks.length,
        notStarted: deptTracks.filter(t => t.progress === 0).length,
        inProgress: deptTracks.filter(t => t.progress > 0 && t.progress < 100).length,
        completed: deptTracks.filter(t => t.progress === 100).length,
        averageProgress: Math.round(
          deptTracks.reduce((sum, t) => sum + t.progress, 0) / (deptTracks.length || 1)
        ),
      };
    }
    
    // Get POs with items - sorted by delivery deadline (closest first)
    const posWithItems = await prisma.purchaseOrder.findMany({
      where: { status: 'active' },
      include: {
        client: { select: { name: true } },
        items: {
          where: { isDelivered: false },
          include: { tracks: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { deliveryDeadline: 'asc' },
      take: 20,
    });

    // Sort POs by urgency (closest deadline first, null deadlines last)
    const sortedPOs = posWithItems
      .filter(po => po.items.length > 0)
      .map(po => {
        const firstItem = po.items[0];
        const avgProgress = firstItem.tracks.length > 0
          ? Math.round(firstItem.tracks.reduce((sum, t) => sum + t.progress, 0) / firstItem.tracks.length)
          : 0;
        
        // Calculate days until deadline
        let daysLeft: number | null = null;
        let urgency: 'overdue' | 'today' | 'urgent' | 'warning' | 'normal' = 'normal';
        
        if (po.deliveryDeadline) {
          const deadline = new Date(po.deliveryDeadline);
          const now = new Date();
          const diffTime = deadline.getTime() - now.getTime();
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (daysLeft < 0) urgency = 'overdue';
          else if (daysLeft === 0) urgency = 'today';
          else if (daysLeft <= 3) urgency = 'urgent';
          else if (daysLeft <= 7) urgency = 'warning';
        }
        
        return {
          id: po.id,
          poNumber: po.poNumber,
          clientName: po.client.name,
          deliveryDeadline: po.deliveryDeadline,
          daysLeft,
          urgency,
          isUrgent: po.isUrgent,
          itemCount: po.items.length,
          firstItemName: firstItem.itemName,
          firstItemQty: firstItem.quantityTotal,
          firstItemUnit: firstItem.quantityUnit,
          avgProgress,
          tracks: firstItem.tracks
            .map(t => ({
              department: t.department,
              progress: t.progress,
            }))
            .sort((a, b) => {
              const order: Record<string, number> = {
                drafting: 1,
                purchasing: 2,
                production: 3,
                qc: 4,
              };
              return (order[a.department] || 99) - (order[b.department] || 99);
            }),
        };
      })
      .sort((a, b) => {
        // Sort by urgency first
        const urgencyOrder = { overdue: 0, today: 1, urgent: 2, warning: 3, normal: 4 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        // Then by days left
        if (a.daysLeft !== null && b.daysLeft !== null) {
          return a.daysLeft - b.daysLeft;
        }
        return a.daysLeft === null ? 1 : -1;
      });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: { itemName: true },
        },
        actor: {
          select: { name: true },
        },
      },
    });
    
    // Get urgent items (delivery within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const urgentItems = items
      .filter(i => {
        if (!i.purchaseOrder.deliveryDeadline) return false;
        const deadline = new Date(i.purchaseOrder.deliveryDeadline);
        return deadline <= sevenDaysFromNow && deadline >= now;
      })
      .map(i => ({
        id: i.id,
        name: i.itemName,
        poNumber: i.purchaseOrder.poNumber,
        client: i.purchaseOrder.client.name,
        deadline: i.purchaseOrder.deliveryDeadline,
        overallProgress: Math.round(
          i.tracks.reduce((sum, t) => sum + t.progress, 0) / i.tracks.length
        ),
      }))
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
    
    return NextResponse.json({
      stats: {
        totalItems,
        notStarted,
        inProgress,
        completed,
        myDeptStats,
      },
      recentActivity,
      urgentItems,
      poList: sortedPOs.slice(0, 5),
      totalPOCount: sortedPOs.length,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
