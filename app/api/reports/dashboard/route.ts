import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Get all items with their PO and tracks in a single query
  const items = await prisma.item.findMany({
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          clientPoNumber: true,
          deliveryDeadline: true,
          isPaid: true,
        },
      },
      tracks: {
        select: { department: true, progress: true },
      },
      issues: {
        select: { id: true, status: true, priority: true, title: true },
        where: { status: 'open' },
      },
    },
  });

  // Calculate metrics in memory (faster than multiple DB queries)
  let delayedCount = 0;
  let problemsCount = 0;
  let finishedPaidCount = 0;
  let ongoingCount = 0;
  let deliveredCount = 0;
  let onTimeCount = 0;

  const delayedItems: typeof items = [];
  const problemItems: typeof items = [];
  const finishedItems: typeof items = [];
  const ongoingItems: typeof items = [];

  for (const item of items) {
    const po = item.purchaseOrder;

    // Delayed: deadline passed and not delivered
    if (po.deliveryDeadline && new Date(po.deliveryDeadline) < now && !item.isDelivered) {
      delayedCount++;
      delayedItems.push(item);
    }

    // Problems: has open issues
    if (item.issues.length > 0) {
      problemsCount++;
      problemItems.push(item);
    }

    // Finished: delivered and paid
    if (item.isDelivered && po.isPaid) {
      finishedPaidCount++;
      finishedItems.push(item);
    }

    // Ongoing: not delivered but has progress
    if (!item.isDelivered && item.tracks.some((t) => t.progress > 0)) {
      ongoingCount++;
      ongoingItems.push(item);
    }

    // On-time calculation
    if (item.isDelivered && item.deliveredAt) {
      deliveredCount++;
      if (po.deliveryDeadline && new Date(item.deliveredAt) <= new Date(po.deliveryDeadline)) {
        onTimeCount++;
      }
    }
  }

  const onTimePercentage = deliveredCount > 0 ? Math.round((onTimeCount / deliveredCount) * 100) : 0;

  // Format response
  const formatItem = (item: (typeof items)[0]) => ({
    id: item.id,
    poId: item.poId,
    name: item.itemName,
    specification: item.specification,
    poNumber: item.purchaseOrder.poNumber,
    clientPoNumber: item.purchaseOrder.clientPoNumber,
    quantity: item.quantityTotal,
    unit: item.quantityUnit,
    deadline: item.purchaseOrder.deliveryDeadline?.toISOString() || null,
    deliveredAt: item.deliveredAt?.toISOString() || null,
    progress: item.tracks.reduce((acc, t) => acc + t.progress, 0) / (item.tracks.length || 1),
    tracks: item.tracks,
    openIssues: item.issues,
  });

  const response = {
    summary: {
      delayed: delayedCount,
      problems: problemsCount,
      finishedPaid: finishedPaidCount,
      ongoing: ongoingCount,
      onTimePercentage,
      totalDelivered: deliveredCount,
      onTimeDelivered: onTimeCount,
    },
    details: {
      delayed: delayedItems.map(formatItem),
      problems: problemItems.map(formatItem),
      finishedPaid: finishedItems.map(formatItem),
      ongoing: ongoingItems.map(formatItem),
    },
  };

  // Add cache headers for CDN/browser caching
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
    },
  });
}
