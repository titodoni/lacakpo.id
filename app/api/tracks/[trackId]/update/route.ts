import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSystemMessage, canUpdateTrack } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// POST /api/tracks/[trackId]/update - Update track progress
export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const session = await requireAuth();
    const { trackId } = await params;
    const body = await req.json();
    const { newProgress, userNote } = body;

    // Validate progress value
    if (newProgress === undefined || newProgress < 0 || newProgress > 100) {
      return NextResponse.json(
        { error: 'ERR_002', message: 'Progress must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Get current track with PO info
    const track = await prisma.itemTrack.findUnique({
      where: { id: trackId },
      include: { 
        item: {
          include: {
            purchaseOrder: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: 'ERR_005', message: 'Track not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canUpdateTrack(session.role, track.department)) {
      return NextResponse.json(
        { error: 'ERR_007', message: 'Forbidden: You cannot update this department' },
        { status: 403 }
      );
    }

    // Check vendor job for production department
    if (track.department === 'production' && track.item.purchaseOrder?.isVendorJob) {
      return NextResponse.json(
        { error: 'ERR_023', message: 'Production cannot update: This PO is handled by vendor' },
        { status: 403 }
      );
    }

    const oldProgress = track.progress;
    const delta = newProgress - oldProgress;

    // Update track
    const updatedTrack = await prisma.itemTrack.update({
      where: { id: trackId },
      data: {
        progress: newProgress,
        updatedBy: session.userId,
        updatedAt: new Date(),
        lastNote: userNote || track.lastNote,
      },
    });

    // Create activity log
    const systemMessage = generateSystemMessage(
      session.name,
      track.department,
      oldProgress,
      newProgress
    );

    const activityLog = await prisma.activityLog.create({
      data: {
        itemId: track.itemId,
        trackId: track.id,
        actorId: session.userId,
        actorName: session.name,
        actorRole: session.role,
        department: track.department,
        oldProgress,
        newProgress,
        delta,
        systemMessage,
        userNote: userNote || null,
      },
    });

    return NextResponse.json({
      track: updatedTrack,
      log: activityLog,
    });
  } catch (error) {
    console.error('POST /api/tracks/[trackId]/update error:', error);
    return NextResponse.json(
      { error: 'ERR_001', message: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
