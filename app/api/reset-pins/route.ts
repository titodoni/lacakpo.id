import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const RESET_KEY = 'reset-12345';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key !== RESET_KEY) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
    }
    
    const defaultPin = await bcrypt.hash('12345', 10);
    
    const result = await prisma.user.updateMany({
      data: { passwordHash: defaultPin },
    });
    
    return NextResponse.json({
      success: true,
      message: `Reset ${result.count} users`,
      pin: '12345'
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Reset failed' },
      { status: 500 }
    );
  }
}
