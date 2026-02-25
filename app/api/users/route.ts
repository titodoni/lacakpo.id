import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users - List all active users (for login dropdown)
export async function GET(req: NextRequest) {
  try {
    // Allow public access for login page
    const { searchParams } = new URL(req.url);
    const publicAccess = searchParams.get('public') === 'true';
    
    if (!publicAccess) {
      await requireAuth();
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'ERR_021', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
