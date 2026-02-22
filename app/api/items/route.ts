import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
