import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/deliveries - List all deliveries
export async function GET() {
  try {
    await requireAuth();
    
    const deliveries = await prisma.delivery.findMany({
      include: {
        item: {
          select: {
            itemName: true,
            purchaseOrder: {
              select: {
                poNumber: true,
                client: { select: { name: true } },
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
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

// POST /api/deliveries - Create new delivery
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    const body = await req.json();
    const { itemId, quantity, deliveryDate, suratJalanNumber, notes } = body;

    // Validation
    if (!itemId || !quantity || !deliveryDate) {
      return NextResponse.json(
        { error: 'Item, quantity, and delivery date are required' },
        { status: 400 }
      );
    }

    // Get item info
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        purchaseOrder: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Calculate new delivered quantity
    const newDeliveredQty = item.quantityDelivered + parseInt(quantity);
    
    // Check if quantity exceeds total
    if (newDeliveredQty > item.quantityTotal) {
      return NextResponse.json(
        { error: `Delivery quantity exceeds remaining (${item.quantityTotal - item.quantityDelivered} left)` },
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

    // Update item delivery status
    const isFullyDelivered = newDeliveredQty >= item.quantityTotal;
    
    await prisma.item.update({
      where: { id: itemId },
      data: {
        quantityDelivered: newDeliveredQty,
        isDelivered: isFullyDelivered,
        deliveredAt: isFullyDelivered ? new Date() : item.deliveredAt,
      },
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error('POST /api/deliveries error:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
