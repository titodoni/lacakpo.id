import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/pos/[id] - Get PO detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            tracks: {
              include: {
                updater: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'ERR_005', message: 'PO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ po });
  } catch (error) {
    console.error('GET /api/pos/[id] error:', error);
    return NextResponse.json(
      { error: 'ERR_006', message: 'Failed to fetch PO' },
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
    const session = await requireAuth();
    const { id } = params;

    // Only admin and manager can update PO
    if (!['super_admin', 'manager'].includes(session.role)) {
      return NextResponse.json(
        { error: 'ERR_007', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      poNumber,
      clientPoNumber,
      clientId,
      poDate,
      deliveryDeadline,
      notes,
      status,
      isUrgent,
      isVendorJob,
      vendorName,
      vendorPhone,
      vendorEstimation,
      items,
    } = body;

    // Validate required fields
    if (!poNumber || !clientId || !poDate) {
      return NextResponse.json(
        { error: 'ERR_008', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'ERR_009', message: 'PO not found' },
        { status: 404 }
      );
    }

    // Check if poNumber is unique (if changed)
    if (poNumber !== existingPO.poNumber) {
      const duplicatePO = await prisma.purchaseOrder.findUnique({
        where: { poNumber },
      });
      if (duplicatePO) {
        return NextResponse.json(
          { error: 'ERR_010', message: 'PO number already exists' },
          { status: 400 }
        );
      }
    }

    // Update PO in transaction
    const updatedPO = await prisma.$transaction(async (tx) => {
      // Update PO
      const po = await tx.purchaseOrder.update({
        where: { id },
        data: {
          poNumber,
          clientPoNumber: clientPoNumber || null,
          clientId,
          poDate: new Date(poDate),
          deliveryDeadline: deliveryDeadline ? new Date(deliveryDeadline) : null,
          notes: notes || null,
          status,
          isUrgent: isUrgent || false,
          isVendorJob: isVendorJob || false,
          vendorName: vendorName || null,
          vendorPhone: vendorPhone || null,
          vendorEstimation: vendorEstimation ? new Date(vendorEstimation) : null,
        },
      });

      // Handle items update if provided
      if (items && Array.isArray(items)) {
        // Get existing item IDs
        const existingItemIds = existingPO.items.map(item => item.id);
        const updatedItemIds = items.filter((item: any) => item.id).map((item: any) => item.id);
        
        // Delete items that are not in the updated list
        const itemsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));
        if (itemsToDelete.length > 0) {
          await tx.item.deleteMany({
            where: { id: { in: itemsToDelete } },
          });
        }

        // Update or create items
        for (const item of items) {
          const itemData = {
            itemName: item.itemName,
            specification: item.specification || null,
            quantityTotal: parseInt(item.quantityTotal),
            quantityUnit: item.quantityUnit || 'pcs',
            productionType: item.productionType || 'both',
          };

          if (item.id) {
            // Update existing item
            await tx.item.update({
              where: { id: item.id },
              data: itemData,
            });
          } else {
            // Create new item
            await tx.item.create({
              data: {
                ...itemData,
                poId: id,
              },
            });
          }
        }
      }

      return po;
    });

    return NextResponse.json({
      success: true,
      po: updatedPO,
    });
  } catch (error) {
    console.error('PUT /api/pos/[id] error:', error);
    return NextResponse.json(
      { error: 'ERR_011', message: 'Failed to update PO' },
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
    const session = await requireAuth();
    const { id } = params;

    // Only admin and manager can delete PO
    if (!['super_admin', 'manager'].includes(session.role)) {
      return NextResponse.json(
        { error: 'ERR_012', message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'ERR_013', message: 'PO not found' },
        { status: 404 }
      );
    }

    // Delete PO (cascade will delete items, tracks, etc.)
    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'PO deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/pos/[id] error:', error);
    return NextResponse.json(
      { error: 'ERR_014', message: 'Failed to delete PO' },
      { status: 500 }
    );
  }
}
