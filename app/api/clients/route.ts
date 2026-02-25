import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/clients - List all clients
export async function GET() {
  try {
    await requireAuth();
    
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    
    const body = await req.json();
    const { code, name, contactPerson, phone, address } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Client code and name are required' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        code: code.toUpperCase(),
        name,
        contactPerson: contactPerson || null,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/clients error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Client code already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
