import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Check if PO number already exists
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'PO Number already exists' },
        { status: 409 }
      );
    }

    // Find or create client (case-insensitive search for SQLite)
    // SQLite doesn't support mode: 'insensitive', so we fetch all and filter
    const allClients = await prisma.client.findMany();
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

    return NextResponse.json({ po }, { status: 201 });
  } catch (error) {
    console.error('POST /api/pos error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
