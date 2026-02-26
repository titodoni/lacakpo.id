import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/items - List items with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');
    const status = searchParams.get('status');
    
    // Determine user's department
    let userDept: string | null = null;
    if (session.role === 'drafter') userDept = 'drafting';
    else if (session.role === 'purchasing') userDept = 'purchasing';
    else if (['cnc_operator', 'milling_operator', 'fab_operator'].includes(session.role)) userDept = 'production';
    else if (session.role === 'qc') userDept = 'qc';
    
    const where: any = {
      purchaseOrder: { status: 'active' },
    };
    
    // Filter by user's department
    if (filter === 'my-dept' && userDept) {
      where.tracks = {
        some: {
          department: userDept,
        },
      };
    }
    
    // Filter by delivery status
    if (status === 'delivered') {
      where.isDelivered = true;
    } else if (status === 'undelivered') {
      where.isDelivered = false;
    }
    
    const items = await prisma.item.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            client: { select: { name: true } },
            deliveryDeadline: true,
            poDate: true,
            isUrgent: true,
            isVendorJob: true,
            vendorName: true,
            isPaid: true,
          },
        },
        tracks: {
          include: {
            updater: {
              select: { name: true },
            },
          },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        issues: {
          where: { status: 'open' },
          include: {
            creator: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    // Map items to include quantityDelivered
    const itemsWithDeliveredQty = items.map(item => ({
      ...item,
      quantityDelivered: item.quantityDelivered || 0,
    }));
    
    return NextResponse.json({ items: itemsWithDeliveredQty });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
