import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { ReportsDashboard } from '@/components/reports/ReportsDashboard';
import { ReportsDashboardSkeleton } from '@/components/reports/ReportsDashboardSkeleton';

// Dynamic rendering required for authentication
export const dynamic = 'force-dynamic';

async function getReportData() {
  const now = new Date();

  // Get all items with their POs, tracks, and issues in a single query
  const items = await prisma.item.findMany({
    include: {
      purchaseOrder: true,
      tracks: { select: { department: true, progress: true } },
      issues: { select: { status: true, priority: true, title: true } },
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
    if (item.issues.some((i) => i.status === 'open')) {
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
    openIssues: item.issues.filter((i) => i.status === 'open'),
  });

  return {
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
}

export default async function ReportsPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  // Extract only plain serializable values from session
  const userData = {
    userId: session.userId,
    username: session.username,
    role: session.role,
    department: session.department,
    name: session.name,
    isLoggedIn: session.isLoggedIn,
  };

  // Fetch data on server
  const reportData = await getReportData();

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard Laporan</h1>

        <Suspense fallback={<ReportsDashboardSkeleton />}>
          <ReportsDashboard initialData={reportData} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
