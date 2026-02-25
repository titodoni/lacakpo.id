import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/search - Search POs and items
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const clientId = searchParams.get('client');
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    const status = searchParams.get('status');

    // Build PO where clause
    const poWhere: any = {};
    
    if (query) {
      poWhere.OR = [
        { poNumber: { contains: query, mode: 'insensitive' } },
        { clientPoNumber: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (clientId) {
      poWhere.clientId = clientId;
    }
    
    if (status) {
      poWhere.status = status;
    }
    
    if (dateFrom || dateTo) {
      poWhere.poDate = {};
      if (dateFrom) {
        poWhere.poDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        poWhere.poDate.lte = new Date(dateTo);
      }
    }

    // Search POs
    const pos = await prisma.purchaseOrder.findMany({
      where: poWhere,
      include: {
        client: true,
        items: {
          select: {
            id: true,
            itemName: true,
            specification: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Build Item where clause for separate item search
    const itemWhere: any = {};
    
    if (query) {
      itemWhere.OR = [
        { itemName: { contains: query, mode: 'insensitive' } },
        { specification: { contains: query, mode: 'insensitive' } },
      ];
      
      // Also include items from matched POs
      if (pos.length > 0) {
        itemWhere.OR.push({
          purchaseOrder: {
            OR: [
              { poNumber: { contains: query, mode: 'insensitive' } },
              { clientPoNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
        });
      }
    }

    if (clientId) {
      itemWhere.purchaseOrder = { ...itemWhere.purchaseOrder, clientId };
    }

    if (status) {
      itemWhere.purchaseOrder = { ...itemWhere.purchaseOrder, status };
    }

    // Search Items
    const items = await prisma.item.findMany({
      where: itemWhere,
      include: {
        purchaseOrder: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Format results
    const results: any[] = [];

    // Add PO results
    pos.forEach((po) => {
      results.push({
        id: po.id,
        type: 'po',
        poNumber: po.poNumber,
        clientName: po.client.name,
        status: po.status,
        createdAt: po.createdAt,
      });
    });

    // Add Item results (avoid duplicates from PO search)
    const poIdsFromPOs = new Set(pos.map(po => po.id));
    
    items.forEach((item) => {
      // Only add item if its PO wasn't already added as a PO result
      if (!poIdsFromPOs.has(item.purchaseOrder.id)) {
        results.push({
          id: item.id,
          type: 'item',
          poNumber: item.purchaseOrder.poNumber,
          itemName: item.itemName,
          clientName: item.purchaseOrder.client.name,
          status: item.purchaseOrder.status,
          createdAt: item.createdAt,
        });
      }
    });

    // Sort by createdAt
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ results: results.slice(0, 50) });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: 'ERR_022', message: 'Search failed' },
      { status: 500 }
    );
  }
}
