import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo data for tire industry clients
const demoPOs = [
  { poNumber: 'PO-243-GYI-210226', clientCode: 'GYI', clientName: 'Goodyear Indonesia', itemName: 'Bushing Tire', qty: 34, poDate: '2026-02-21', deliveryDate: '2026-03-03', status: 'Production' },
  { poNumber: 'PO-243-BRI-200226', clientCode: 'BRI', clientName: 'Bridgestone Indonesia', itemName: 'Mold Clamp Bolt', qty: 120, poDate: '2026-02-20', deliveryDate: '2026-03-05', status: 'Machining' },
  { poNumber: 'PO-243-MCI-190226', clientCode: 'MCI', clientName: 'Michelin Indonesia', itemName: 'Tire Curing Pin', qty: 60, poDate: '2026-02-19', deliveryDate: '2026-03-06', status: 'QC' },
  { poNumber: 'PO-243-GYI-180226', clientCode: 'GYI', clientName: 'Goodyear Indonesia', itemName: 'Sidewall Plate', qty: 12, poDate: '2026-02-18', deliveryDate: '2026-03-04', status: 'Design Review' },
  { poNumber: 'PO-243-PRL-170226', clientCode: 'PRL', clientName: 'Pirelli Indonesia', itemName: 'Mold Locking Ring', qty: 20, poDate: '2026-02-17', deliveryDate: '2026-03-10', status: 'Material Prep' },
  { poNumber: 'PO-243-CNT-160226', clientCode: 'CNT', clientName: 'Continental Tire', itemName: 'Venting Needle', qty: 500, poDate: '2026-02-16', deliveryDate: '2026-03-08', status: 'Production' },
  { poNumber: 'PO-243-SRI-150226', clientCode: 'SRI', clientName: 'Sumitomo Rubber Indonesia', itemName: 'Bladder Clamp', qty: 45, poDate: '2026-02-15', deliveryDate: '2026-03-07', status: 'QC' },
  { poNumber: 'PO-243-YHI-140226', clientCode: 'YHI', clientName: 'Yokohama Indonesia', itemName: 'Segment Mold Plate', qty: 16, poDate: '2026-02-14', deliveryDate: '2026-03-12', status: 'Machining' },
  { poNumber: 'PO-243-HNK-130226', clientCode: 'HNK', clientName: 'Hankook Tire', itemName: 'Guide Ring', qty: 28, poDate: '2026-02-13', deliveryDate: '2026-03-09', status: 'Production' },
  { poNumber: 'PO-243-TBC-120226', clientCode: 'TBC', clientName: 'Toyo Tire Indonesia', itemName: 'Center Mechanism Pin', qty: 75, poDate: '2026-02-12', deliveryDate: '2026-03-11', status: 'Production' },
  { poNumber: 'PO-243-GYI-110226', clientCode: 'GYI', clientName: 'Goodyear Indonesia', itemName: 'Tire Mold Insert', qty: 18, poDate: '2026-02-11', deliveryDate: '2026-03-06', status: 'QC' },
  { poNumber: 'PO-243-MRF-100226', clientCode: 'MRF', clientName: 'MRF Tire', itemName: 'Wear Plate', qty: 22, poDate: '2026-02-10', deliveryDate: '2026-03-15', status: 'Material Prep' },
  { poNumber: 'PO-243-BKT-090226', clientCode: 'BKT', clientName: 'Balkrishna Industries', itemName: 'Spacer Block', qty: 80, poDate: '2026-02-09', deliveryDate: '2026-03-14', status: 'Production' },
  { poNumber: 'PO-243-GTI-080226', clientCode: 'GTI', clientName: 'Giti Tire', itemName: 'Alignment Pin', qty: 140, poDate: '2026-02-08', deliveryDate: '2026-03-13', status: 'Machining' },
];

// Status to progress mapping
const statusProgress: Record<string, { drafting: number; purchasing: number; production: number; qc: number }> = {
  'Design Review': { drafting: 80, purchasing: 30, production: 0, qc: 0 },
  'Material Prep': { drafting: 100, purchasing: 90, production: 10, qc: 0 },
  'Machining': { drafting: 100, purchasing: 100, production: 60, qc: 0 },
  'Production': { drafting: 100, purchasing: 100, production: 80, qc: 20 },
  'QC': { drafting: 100, purchasing: 100, production: 100, qc: 70 },
};

async function main() {
  console.log('🌱 Seeding demo tire industry data...\n');

  // Get admin user as creator
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!admin) {
    throw new Error('Admin user not found. Please run basic seed first.');
  }

  // Process each PO
  for (const poData of demoPOs) {
    // Create or get client
    let client = await prisma.client.findUnique({
      where: { code: poData.clientCode },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          code: poData.clientCode,
          name: poData.clientName,
        },
      });
      console.log(`✅ Created client: ${client.name}`);
    }

    // Check if PO already exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { poNumber: poData.poNumber },
    });

    if (existingPO) {
      console.log(`⏭️  PO already exists: ${poData.poNumber}`);
      continue;
    }

    // Create PO with item and tracks
    const progress = statusProgress[poData.status] || { drafting: 0, purchasing: 0, production: 0, qc: 0 };

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: poData.poNumber,
        clientId: client.id,
        poDate: new Date(poData.poDate),
        deliveryDeadline: new Date(poData.deliveryDate),
        status: 'active',
        createdBy: admin.id,
        items: {
          create: [
            {
              itemName: poData.itemName,
              quantityTotal: poData.qty,
              quantityUnit: 'pcs',
              tracks: {
                create: [
                  { department: 'drafting', progress: progress.drafting },
                  { department: 'purchasing', progress: progress.purchasing },
                  { department: 'production', progress: progress.production },
                  { department: 'qc', progress: progress.qc },
                ],
              },
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            tracks: true,
          },
        },
      },
    });

    console.log(`✅ Created PO: ${po.poNumber} - ${poData.itemName} (${poData.status})`);
  }

  console.log('\n🎉 Demo data seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   Total POs: ${demoPOs.length}`);
  console.log(`   Clients: ${[...new Set(demoPOs.map(p => p.clientCode))].length}`);
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
