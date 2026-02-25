import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PATCH /api/issues/[issueId] - Update an issue (edit or resolve)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const session = await requireAuth();
    const { issueId } = params;
    const { title, description, priority, status } = await request.json();

    // Find the issue
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Check permissions: only creator or admin can edit
    const isCreator = issue.createdBy === session.userId;
    const isAdmin = session.role === 'super_admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the creator or admin can edit this issue' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    // Only allow editing if issue is still open
    if (issue.status === 'open') {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) {
        if (!['high', 'medium', 'low'].includes(priority)) {
          return NextResponse.json(
            { error: 'Invalid priority' },
            { status: 400 }
          );
        }
        updateData.priority = priority;
      }
    }

    // Handle status change (resolve/reopen)
    if (status !== undefined) {
      if (status === 'resolved') {
        updateData.status = 'resolved';
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.userId;
      } else if (status === 'open') {
        // Reopen issue
        updateData.status = 'open';
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
        resolver: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({ issue: updatedIssue });
  } catch (error) {
    console.error('Failed to update issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}

// DELETE /api/issues/[issueId] - Delete an issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const session = await requireAuth();
    const { issueId } = params;

    // Find the issue
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Check permissions: only creator or admin can delete
    const isCreator = issue.createdBy === session.userId;
    const isAdmin = session.role === 'super_admin';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the creator or admin can delete this issue' },
        { status: 403 }
      );
    }

    await prisma.issue.delete({
      where: { id: issueId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete issue:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue' },
      { status: 500 }
    );
  }
}
