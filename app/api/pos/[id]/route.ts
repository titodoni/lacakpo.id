import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/pos/[id] - Get single PO with items
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            tracks: {
              include: {
                updater: {
                  select: { name: true, username: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        creator: {
          select: { name: true, username: true },
        },
      },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ po });
  } catch (error) {
    console.error('GET /api/pos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

// PUT /api/pos/[id] - Update PO
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const { 
      poNumber, 
      clientPoNumber, 
      clientId, 
      poDate, 
      deliveryDeadline, 
      notes,
      status 
    } = body;

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        poNumber,
        clientPoNumber: clientPoNumber || null,
        clientId,
        poDate: poDate ? new Date(poDate) : undefined,
        deliveryDeadline: deliveryDeadline ? new Date(deliveryDeadline) : null,
        notes: notes || null,
        status: status || undefined,
      },
      include: {
        client: true,
        items: {
          include: {
            tracks: true,
          },
        },
      },
    });

    return NextResponse.json({ po });
  } catch (error) {
    console.error('PUT /api/pos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

// DELETE /api/pos/[id] - Delete PO
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = await params;

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/pos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
