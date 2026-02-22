import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();
    
    return NextResponse.json({
      user: {
        id: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
        department: session.department,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
