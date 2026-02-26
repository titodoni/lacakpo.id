import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Secret key untuk proteksi (ganti dengan key random)
const RESET_SECRET = 'reset-pins-2024';

export async function POST(request: Request) {
  try {
    // Check secret dari query param untuk keamanan
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== RESET_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid secret' },
        { status: 401 }
      );
    }
    
    const defaultPin = await bcrypt.hash('12345', 10);
    
    const result = await prisma.user.updateMany({
      data: { passwordHash: defaultPin },
    });
    
    return NextResponse.json({
      success: true,
      message: `Reset ${result.count} users to PIN: 12345`,
    });
  } catch (error) {
    console.error('Reset failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset PINs' },
      { status: 500 }
    );
  }
}
