import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { triggerPusherEvent } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// GET /api/pos - List all purchase orders
export async function GET() {
  try {
    await requireAuth();
    
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        client: true,
        items: {
          select: {
            id: true,
            quantityTotal: true,
            quantityDelivered: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ pos });
  } catch (error) {
    console.error('GET /api/pos error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

// POST /api/pos - Create new purchase order
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Only sales_admin and super_admin can create POs
    if (!['sales_admin', 'super_admin'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Sales Admin can create POs' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { 
      poNumber, 
      clientPoNumber, 
      clientName, 
      poDate, 
      deliveryDeadline, 
      notes,
      isUrgent,
      isVendorJob,
      vendorName,
      vendorPhone,
      vendorEstimation,
      items 
    } = body;

    // Validation
    if (!poNumber || !clientName || !poDate) {
      return NextResponse.json(
        { error: 'PO Number, Client Name, and PO Date are required' },
        { status: 400 }
      );
    }

    // Check if PO number already exists and fetch all clients in parallel
    // SQLite doesn't support mode: 'insensitive', so we fetch all clients and filter
    const [existing, allClients] = await Promise.all([
      prisma.purchaseOrder.findUnique({
        where: { poNumber },
      }),
      prisma.client.findMany(),
    ]);

    if (existing) {
      return NextResponse.json(
        { error: 'PO Number already exists' },
        { status: 409 }
      );
    }
    let client = allClients.find(c => 
      c.name.toLowerCase() === clientName.toLowerCase()
    );

    if (!client) {
      // Generate client code from name (first 3 letters uppercase)
      const code = clientName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      let uniqueCode = code;
      let counter = 1;
      
      // Ensure unique code
      while (await prisma.client.findUnique({ where: { code: uniqueCode } })) {
        uniqueCode = `${code}${counter}`;
        counter++;
      }

      client = await prisma.client.create({
        data: {
          code: uniqueCode,
          name: clientName,
        },
      });
    }

    // Create PO with items and tracks
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        clientPoNumber: clientPoNumber || null,
        clientId: client.id,
        poDate: new Date(poDate),
        deliveryDeadline: deliveryDeadline ? new Date(deliveryDeadline) : null,
        notes: notes || null,
        isUrgent: isUrgent || false,
        isVendorJob: isVendorJob || false,
        vendorName: vendorName || null,
        vendorPhone: vendorPhone || null,
        vendorEstimation: vendorEstimation ? new Date(vendorEstimation) : null,
        createdBy: session.userId,
        items: {
          create: items?.map((item: any) => {
            const prodType = item.productionType || 'both';
            
            // Determine which production tracks to create based on production type
            let tracks: any[] = [
              { department: 'drafting', progress: 0 },
              { department: 'purchasing', progress: 0 },
              { department: 'qc', progress: 0 },
              { department: 'delivery', progress: 0 },
            ];
            
            // Add production track based on production type (only if not vendor job)
            if (!isVendorJob && (prodType === 'machining' || prodType === 'both' || prodType === 'fabrication')) {
              tracks.push({ department: 'production', progress: 0 });
            }
            
            return {
              itemName: item.name,
              specification: item.spec || null,
              quantityTotal: parseInt(item.qty) || 1,
              quantityUnit: item.unit || 'pcs',
              productionType: prodType,
              tracks: {
                create: tracks,
              },
            };
          }) || [],
        },
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

    // Fetch full item data with tracks for real-time sync
    const itemsWithFull = await prisma.item.findMany({
      where: { poId: po.id },
      include: {
        tracks: { include: { updater: { select: { name: true } } } },
        issues: true,
        purchaseOrder: { include: { client: { select: { name: true } } } },
      }
    });

    // Trigger real-time sync event for new PO
    try {
      await triggerPusherEvent('po-channel', 'po-created', {
        type: 'po-created',
        poNumber: po.poNumber,
        clientName: client.name,
        actorName: session.name,
        items: itemsWithFull.map(item => ({
          id: item.id,
          po_id: item.poId,
          item_name: item.itemName,
          specification: item.specification,
          quantity_total: item.quantityTotal,
          quantity_unit: item.quantityUnit,
          quantity_delivered: item.quantityDelivered,
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
            status: i.status,
          })),
          po: {
            id: item.purchaseOrder.id,
            po_number: item.purchaseOrder.poNumber,
            po_date: item.purchaseOrder.poDate?.toISOString() || null,
            delivery_deadline: item.purchaseOrder.deliveryDeadline?.toISOString() || null,
            is_urgent: item.purchaseOrder.isUrgent,
            is_vendor_job: item.purchaseOrder.isVendorJob,
            is_paid: item.purchaseOrder.isPaid,
            status: item.purchaseOrder.status,
            client: { name: item.purchaseOrder.client.name },
          },
        })),
      });
    } catch (pusherError) {
      console.error('Pusher trigger failed for PO creation:', pusherError);
    }

    return NextResponse.json({ po }, { status: 201 });
  } catch (error) {
    console.error('POST /api/pos error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
