import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PUT /api/pos/[id]/finance - Update finance status (invoicing & payment)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    // Only finance can update finance status
    if (session.role !== 'finance') {
      return NextResponse.json(
        { error: 'ERR_017', message: 'Unauthorized: Only Finance can update finance status' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isInvoiced, invoiceNumber, isPaid } = body;

    // Get current PO
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'ERR_018', message: 'PO not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // Handle invoicing
    if (isInvoiced !== undefined) {
      updateData.isInvoiced = isInvoiced;
      if (isInvoiced) {
        updateData.invoicedAt = new Date();
        if (invoiceNumber) {
          updateData.invoiceNumber = invoiceNumber;
        }
      } else {
        updateData.invoicedAt = null;
        updateData.invoiceNumber = null;
      }
    }

    // Handle payment
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      updateData.paidAt = isPaid ? new Date() : null;
    }

    // Check if PO should be marked as finished
    // Finished = paid (delivery not required)
    const shouldBeFinished = isPaid !== undefined ? isPaid : po.isPaid;
    
    if (shouldBeFinished && po.status !== 'finished') {
      updateData.status = 'finished';
      updateData.finishedAt = new Date();
    } else if (!shouldBeFinished && po.status === 'finished') {
      // Revert from finished if unpaid
      updateData.status = 'active';
      updateData.finishedAt = null;
    }

    // Update PO
    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        itemId: po.items[0]?.id || '', // Use first item for log
        actorId: session.userId,
        actorName: session.name || session.username,
        actorRole: session.role,
        department: 'finance',
        actionType: 'finance_update',
        systemMessage: generateFinanceMessage(session.name || session.username, isInvoiced, isPaid, invoiceNumber),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      po: updatedPO,
    });
  } catch (error) {
    console.error('PUT /api/pos/[id]/finance error:', error);
    return NextResponse.json(
      { error: 'ERR_019', message: 'Failed to update finance status' },
      { status: 500 }
    );
  }
}

function generateFinanceMessage(
  actorName: string,
  isInvoiced?: boolean,
  isPaid?: boolean,
  invoiceNumber?: string
): string {
  if (isPaid !== undefined) {
    return isPaid 
      ? `${actorName} menandai pembayaran diterima`
      : `${actorName} membatalkan status pembayaran`;
  }
  
  if (isInvoiced !== undefined) {
    if (isInvoiced) {
      return invoiceNumber
        ? `${actorName} membuat invoice #${invoiceNumber}`
        : `${actorName} menandai invoiced`;
    } else {
      return `${actorName} membatalkan status invoice`;
    }
  }
  
  return `${actorName} mengupdate status finance`;
}
