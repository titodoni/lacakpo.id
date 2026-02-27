import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// POST /api/items/[itemId]/delivery - Update delivery quantity
export async function POST(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const user = await requireAuth();
    const { itemId } = await params;
    const body = await req.json();

    // Only delivery role can update delivery
    if (user.role !== 'delivery' && user.role !== 'super_admin' && user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'ERR_022' },
        { status: 403 }
      );
    }

    const { quantityDelivered } = body;
    if (quantityDelivered === undefined || quantityDelivered < 0) {
      return NextResponse.json(
        { error: 'Invalid quantity', code: 'ERR_023' },
        { status: 400 }
      );
    }

    // Get the item first to check quantity
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { purchaseOrder: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found', code: 'ERR_007' },
        { status: 404 }
      );
    }

    // Validate quantity doesn't exceed total
    const newQuantity = Math.min(parseInt(quantityDelivered), item.quantityTotal);
    const isFullyDelivered = newQuantity >= item.quantityTotal;

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantityDelivered: newQuantity,
        isDelivered: isFullyDelivered,
        deliveredAt: isFullyDelivered ? new Date() : item.deliveredAt,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        itemId: itemId,
        actorId: user.userId,
        actorName: user.name,
        actorRole: user.role,
        department: 'delivery',
        actionType: 'delivery_update',
        systemMessage: `Delivery quantity updated from ${item.quantityDelivered} to ${newQuantity} ${item.quantityUnit} oleh ${user.name}`,
        createdAt: new Date(),
      },
    });

    // Trigger real-time sync event for delivery update
    try {
      await triggerPusherEvent('po-channel', 'item-delivered', {
        type: 'item-delivered',
        itemId: item.id,
        itemName: item.itemName,
        poNumber: item.purchaseOrder?.poNumber || 'Unknown',
        actorName: user.name,
        quantityDelivered: newQuantity,
        isDelivered: isFullyDelivered,
      });
    } catch (pusherError) {
      console.error('Pusher trigger failed for delivery update:', pusherError);
    }

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('POST /api/items/[itemId]/delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery', code: 'ERR_024' },
      { status: 500 }
    );
  }
}
