import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TasksClient } from './tasks-client';
import { redirect } from 'next/navigation';

// Server component — fetches initial data
export default async function TasksPage() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect('/login');
  }

  // Redirect finance users to finance page
  if (session.role === 'finance') {
    redirect('/finance');
  }

  // Determine user's department
  let userDept: string | null = null;
  if (session.role === 'drafter') userDept = 'drafting';
  else if (session.role === 'purchasing') userDept = 'purchasing';
  else if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(session.role)) userDept = 'production';
  else if (session.role === 'qc') userDept = 'qc';

  // Build where clause (same as working API)
  const where: any = {
    purchaseOrder: { status: 'active' },
    isDelivered: false,
  };

  // Filter by user's department
  if (userDept) {
    where.tracks = {
      some: {
        department: userDept,
      },
    };
  }

  const initialItems = await prisma.item.findMany({
    where,
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          client: { select: { name: true } },
          deliveryDeadline: true,
          poDate: true,
          isUrgent: true,
          isVendorJob: true,
          vendorName: true,
          status: true,
          isPaid: true,
        },
      },
      tracks: {
        include: {
          updater: {
            select: { name: true },
          },
        },
      },
      issues: {
        where: { status: 'open' },
        include: {
          creator: { select: { id: true, name: true, role: true } },
          resolver: { select: { id: true, name: true, role: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Transform to match the store type
  const transformedItems = initialItems.map(item => ({
    id: item.id,
    po_id: item.poId,
    item_name: item.itemName,
    specification: item.specification,
    quantity_total: item.quantityTotal,
    quantity_unit: item.quantityUnit,
    quantity_delivered: item.quantityDelivered || 0,
    is_delivered: item.isDelivered,
    delivered_at: item.deliveredAt?.toISOString() || null,
    tracks: item.tracks.map(t => ({
      id: t.id,
      department: t.department,
      progress: t.progress,
      updated_by: t.updatedBy,
      updated_at: t.updatedAt?.toISOString() || null,
      last_note: t.lastNote,
      updatedByUser: t.updater || null,
    })),
    issues: item.issues.map(i => ({
      id: i.id,
      title: i.title,
      priority: i.priority,
      status: i.status as 'open' | 'resolved',
      creator: i.creator,
      resolver: i.resolver,
      resolvedAt: i.resolvedAt?.toISOString() || null,
    })),
    po: {
      id: item.purchaseOrder.id,
      po_number: item.purchaseOrder.poNumber,
      po_date: item.purchaseOrder.poDate?.toISOString() || null,
      delivery_deadline: item.purchaseOrder.deliveryDeadline?.toISOString() || null,
      is_urgent: item.purchaseOrder.isUrgent,
      is_vendor_job: item.purchaseOrder.isVendorJob,
      status: item.purchaseOrder.status,
      is_paid: item.purchaseOrder.isPaid,
      client: { name: item.purchaseOrder.client.name },
    },
  }));

  return (
    <TasksClient
      initialItems={transformedItems}
      currentUserId={session.userId}
    />
  );
}
