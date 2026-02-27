import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { triggerPusherEvent } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// GET /api/items/[itemId]/issues - List all issues for an item
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await requireAuth();
    const { itemId } = params;

    const issues = await prisma.issue.findMany({
      where: { itemId },
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
        resolver: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // Open first
        { priority: 'desc' }, // High priority first
        { createdAt: 'desc' },
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

// POST /api/items/[itemId]/issues - Create a new issue
export async function POST(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await requireAuth();
    const { itemId } = params;
    const { title, description, priority } = await request.json();

    // Validate required fields
    if (!title || !priority) {
      return NextResponse.json(
        { error: 'Title and priority are required' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['high', 'medium', 'low'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be high, medium, or low' },
        { status: 400 }
      );
    }

    // Check if item exists with PO info
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { purchaseOrder: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Get user's department from session
    const userDepartment = session.department || 'Unknown';

    const issue = await prisma.issue.create({
      data: {
        itemId,
        title,
        description,
        priority,
        createdBy: session.userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Trigger real-time sync event for new issue
    try {
      await triggerPusherEvent('po-channel', 'issue-created', {
        type: 'issue-created',
        itemId: item.id,
        itemName: item.itemName,
        poNumber: item.purchaseOrder?.poNumber || 'Unknown',
        actorName: session.name,
        issue: {
          id: issue.id,
          title: issue.title,
          priority: issue.priority,
          status: 'open',
          creator: {
            id: session.userId,
            name: session.name,
            role: session.role,
          },
        },
      });
    } catch (pusherError) {
      console.error('Pusher trigger failed for issue creation:', pusherError);
    }

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    console.error('Failed to create issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
