import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/logs - Get activity logs with filters
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const itemId = searchParams.get('itemId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const where: any = {};
    
    if (department) {
      where.department = department;
    }
    
    if (itemId) {
      where.itemId = itemId;
    }
    
    const logs = await prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: { itemName: true },
        },
        actor: {
          select: { name: true, username: true },
        },
      },
    });
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('GET /api/logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
