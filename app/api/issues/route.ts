import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issues
 * Get all issues (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Build where clause
    const where: any = {};
    
    if (status && ['open', 'resolved'].includes(status)) {
      where.status = status;
    }
    
    if (priority && ['high', 'medium', 'low'].includes(priority)) {
      where.priority = priority;
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            itemName: true,
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                client: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Open first
        { priority: 'asc' }, // High priority first
        { createdAt: 'desc' }, // Newest first
      ],
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Failed to fetch issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
