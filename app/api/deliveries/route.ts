import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/deliveries - Create delivery record
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Only delivery, admin and manager can create deliveries
    if (!['delivery', 'super_admin', 'manager'].includes(session.role)) {
      return NextResponse.json(
        { error: 'ERR_007', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { itemId, quantity, deliveryDate, suratJalanNumber, notes } = body;

    // Validation
    if (!itemId || !quantity || !deliveryDate) {
      return NextResponse.json(
        { error: 'ERR_008', message: 'Item, quantity, and delivery date are required' },
        { status: 400 }
      );
    }

    // Get item
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { purchaseOrder: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'ERR_024', message: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if quantity is valid
    const remainingQty = item.quantityTotal - item.quantityDelivered;
    if (quantity > remainingQty) {
      return NextResponse.json(
        { error: 'ERR_025', message: `Cannot deliver more than remaining quantity (${remainingQty})` },
        { status: 400 }
      );
    }

    // Create delivery record
    const delivery = await prisma.delivery.create({
      data: {
        itemId,
        quantity: parseInt(quantity),
        deliveryDate: new Date(deliveryDate),
        suratJalanNumber: suratJalanNumber || null,
        notes: notes || null,
        deliveredBy: session.userId,
      },
    });

    // Update item quantity delivered
    const newDeliveredQty = item.quantityDelivered + parseInt(quantity);
    const isFullyDelivered = newDeliveredQty >= item.quantityTotal;

    await prisma.item.update({
      where: { id: itemId },
      data: {
        quantityDelivered: newDeliveredQty,
        isDelivered: isFullyDelivered,
        deliveredAt: isFullyDelivered ? new Date() : item.deliveredAt,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        itemId,
        actorId: session.userId,
        actorName: session.name || session.username,
        actorRole: session.role,
        department: 'delivery',
        actionType: 'delivery_update',
        systemMessage: `${session.name} mengirim ${quantity} ${item.quantityUnit} (${suratJalanNumber || 'tanpa SJ'})`,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      delivery,
      item: {
        ...item,
        quantityDelivered: newDeliveredQty,
        isDelivered: isFullyDelivered,
      },
    });
  } catch (error) {
    console.error('POST /api/deliveries error:', error);
    return NextResponse.json(
      { error: 'ERR_026', message: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}

// GET /api/deliveries - List recent deliveries
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    const where: any = {};
    if (itemId) {
      where.itemId = itemId;
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        item: {
          include: {
            purchaseOrder: {
              include: {
                client: true,
              },
            },
          },
        },
        deliverer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error('GET /api/deliveries error:', error);
    return NextResponse.json(
      { error: 'ERR_027', message: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}
