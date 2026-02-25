import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/reset-data - Reset all PO data (demo utility)
export async function POST(req: NextRequest) {
  try {
    const { confirmPassword } = await req.json();
    
    // Security check - require confirmation password
    if (confirmPassword !== 'resetdemo') {
      return NextResponse.json(
        { error: 'Invalid confirmation password' },
        { status: 403 }
      );
    }

    // Delete in correct order to respect foreign keys
    // 1. Activity logs (references items, tracks)
    await prisma.activityLog.deleteMany({});
    
    // 2. Issues (references items)
    await prisma.issue.deleteMany({});
    
    // 3. Deliveries (references items)
    await prisma.delivery.deleteMany({});
    
    // 4. Item tracks (references items)
    await prisma.itemTrack.deleteMany({});
    
    // 5. Items (references POs)
    await prisma.item.deleteMany({});
    
    // 6. Purchase orders (references clients, users)
    await prisma.purchaseOrder.deleteMany({});
    
    // 7. Clients (optional - keep for demo)
    // await prisma.client.deleteMany({});
    
    // Keep users intact for login
    
    return NextResponse.json({
      success: true,
      message: 'Dataset berhasil direset. Semua PO telah dihapus.',
      cleared: {
        activityLogs: true,
        issues: true,
        deliveries: true,
        itemTracks: true,
        items: true,
        purchaseOrders: true,
      }
    });
  } catch (error) {
    console.error('Reset data error:', error);
    return NextResponse.json(
      { error: 'Gagal mereset dataset' },
      { status: 500 }
    );
  }
}
