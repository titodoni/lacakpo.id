import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/items/[itemId] - Get item with tracks and logs
export async function GET(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await requireAuth();
    const { itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        purchaseOrder: {
          select: { poNumber: true, client: { select: { name: true } } },
        },
        tracks: {
          include: {
            updater: {
              select: { name: true, username: true },
            },
          },
          orderBy: { department: 'asc' },
        },
        activityLogs: {
          include: {
            actor: {
              select: { name: true, username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('GET /api/items/[itemId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

// PUT /api/items/[itemId] - Update item
export async function PUT(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await requireAuth();
    const { itemId } = await params;
    const body = await req.json();

    const { itemName, specification, quantityTotal, quantityUnit } = body;

    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        itemName: itemName || undefined,
        specification: specification !== undefined ? specification : undefined,
        quantityTotal: quantityTotal !== undefined ? parseInt(quantityTotal) : undefined,
        quantityUnit: quantityUnit || undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('PUT /api/items/[itemId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[itemId] - Delete item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await requireAuth();
    const { itemId } = await params;

    await prisma.item.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/items/[itemId] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
