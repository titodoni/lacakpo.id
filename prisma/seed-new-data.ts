import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting all existing POs and related data...\n');
  
  // Delete in correct order to respect foreign keys
  await prisma.activityLog.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.itemTrack.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  
  console.log('✅ All existing POs deleted\n');
  console.log('🌱 Creating new PO dataset...\n');

  // Get admin user as creator
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!admin) {
    throw new Error('Admin user not found. Please run basic seed first.');
  }

  // Create clients if they don't exist
  const clients = [
    { code: 'PTK', name: 'PT Kreasi Teknik' },
    { code: 'INA', name: 'Indo Manufacturing' },
    { code: 'JAY', name: 'Jaya Abadi Corp' },
    { code: 'MIT', name: 'Mitra Sejati' },
    { code: 'SIN', name: 'Sinergi Metal' },
    { code: 'NUS', name: 'Nusantara Fab' },
    { code: 'DEL', name: 'Delta CNC' },
  ];

  for (const clientData of clients) {
    const existing = await prisma.client.findUnique({
      where: { code: clientData.code },
    });
    if (!existing) {
      await prisma.client.create({ data: clientData });
      console.log(`✅ Created client: ${clientData.name}`);
    }
  }

  const today = new Date();
  const january2026 = new Date('2026-01-15');
  const february2026 = new Date('2026-02-15');

  // PO 1: Multiple items (3 items) - CNC Process
  const po1Client = await prisma.client.findUnique({ where: { code: 'PTK' } });
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-001-MULTI',
      clientId: po1Client!.id,
      poDate: february2026,
      deliveryDeadline: new Date('2026-03-20'),
      status: 'active',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Shaft Roller CNC',
            specification: 'Material: S45C, Diameter 50mm',
            quantityTotal: 10,
            quantityUnit: 'pcs',
            productionType: 'machining',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 60 },
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
          {
            itemName: 'Bearing Housing',
            specification: 'Material: SS400, CNC Turning',
            quantityTotal: 15,
            quantityUnit: 'pcs',
            productionType: 'machining',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 40 },
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
          {
            itemName: 'Gear Shaft',
            specification: 'Material: SCM440, Heat Treatment',
            quantityTotal: 8,
            quantityUnit: 'pcs',
            productionType: 'machining',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 80 },
                { department: 'production', progress: 0 },
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po1.poNumber} - 3 items (CNC)`);

  // PO 2: Fabrication Process
  const po2Client = await prisma.client.findUnique({ where: { code: 'INA' } });
  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-002-FAB',
      clientId: po2Client!.id,
      poDate: february2026,
      deliveryDeadline: new Date('2026-03-25'),
      status: 'active',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Frame Structure A',
            specification: 'Material: SS400, Welding',
            quantityTotal: 5,
            quantityUnit: 'set',
            productionType: 'fabrication',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 75 },
                { department: 'qc', progress: 10 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po2.poNumber} - Fabrication process`);

  // PO 3: Both (CNC + Fabrication)
  const po3Client = await prisma.client.findUnique({ where: { code: 'JAY' } });
  const po3 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-003-BOTH',
      clientId: po3Client!.id,
      poDate: february2026,
      deliveryDeadline: new Date('2026-04-05'),
      status: 'active',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Assembly Unit X',
            specification: 'CNC Parts + Fabricated Frame',
            quantityTotal: 3,
            quantityUnit: 'unit',
            productionType: 'both',
            tracks: {
              create: [
                { department: 'drafting', progress: 90 },
                { department: 'purchasing', progress: 60 },
                { department: 'production', progress: 20 },
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po3.poNumber} - CNC + Fabrication`);

  // PO 4: Vendor Job (Outsource) - CNC
  const po4Client = await prisma.client.findUnique({ where: { code: 'MIT' } });
  const po4 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-004-VENDOR-CNC',
      clientId: po4Client!.id,
      poDate: february2026,
      deliveryDeadline: new Date('2026-03-30'),
      status: 'active',
      isVendorJob: true,
      vendorName: 'PT Precision CNC Jaya',
      vendorPhone: '0812-3456-7890',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Precision Valve Body',
            specification: 'Material: Stainless 316, 5-axis CNC',
            quantityTotal: 20,
            quantityUnit: 'pcs',
            productionType: 'machining',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 0 }, // Vendor handles this
                { department: 'qc', progress: 30 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po4.poNumber} - Vendor CNC`);

  // PO 5: Vendor Job (Outsource) - Fabrication
  const po5Client = await prisma.client.findUnique({ where: { code: 'SIN' } });
  const po5 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-005-VENDOR-FAB',
      clientId: po5Client!.id,
      poDate: february2026,
      deliveryDeadline: new Date('2026-04-10'),
      status: 'active',
      isVendorJob: true,
      vendorName: 'CV Metal Fab Indonesia',
      vendorPhone: '0821-9876-5432',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Tank Silo 1000L',
            specification: 'SS304, Laser Cut + Weld',
            quantityTotal: 2,
            quantityUnit: 'unit',
            productionType: 'fabrication',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 0 }, // Vendor handles this
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po5.poNumber} - Vendor Fabrication`);

  // PO 6: January PO - Normal
  const po6Client = await prisma.client.findUnique({ where: { code: 'NUS' } });
  const po6 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-006-JAN',
      clientId: po6Client!.id,
      poDate: january2026,
      deliveryDeadline: new Date('2026-02-28'),
      status: 'active',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Bracket Support',
            specification: 'Mild Steel, Cut & Bend',
            quantityTotal: 50,
            quantityUnit: 'pcs',
            productionType: 'fabrication',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 100 },
                { department: 'qc', progress: 100 },
                { department: 'delivery', progress: 50 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po6.poNumber} - January PO`);

  // PO 7: January PO - Close Deadline (urgent)
  const po7Client = await prisma.client.findUnique({ where: { code: 'DEL' } });
  const po7 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-007-URGENT',
      clientId: po7Client!.id,
      poDate: january2026,
      deliveryDeadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: 'active',
      isUrgent: true,
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Emergency Spare Part',
            specification: 'Critical Component',
            quantityTotal: 5,
            quantityUnit: 'pcs',
            productionType: 'machining',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 80 },
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po7.poNumber} - January Urgent (Close Deadline)`);

  // PO 8: Delayed Status (Past deadline)
  const po8Client = await prisma.client.findUnique({ where: { code: 'PTK' } });
  const po8 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-008-DELAYED',
      clientId: po8Client!.id,
      poDate: new Date('2026-01-05'),
      deliveryDeadline: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'active',
      createdBy: admin.id,
      items: {
        create: [
          {
            itemName: 'Overdue Component',
            specification: 'Delayed due to material shortage',
            quantityTotal: 12,
            quantityUnit: 'pcs',
            productionType: 'machining',
            tracks: {
              create: [
                { department: 'drafting', progress: 100 },
                { department: 'purchasing', progress: 100 },
                { department: 'production', progress: 45 },
                { department: 'qc', progress: 0 },
                { department: 'delivery', progress: 0 },
              ],
            },
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created PO: ${po8.poNumber} - Delayed Status`);

  console.log('\n🎉 New dataset created successfully!');
  console.log('\n📊 Summary:');
  console.log('   Total POs: 8');
  console.log('   - 1 PO with 3 items (CNC)');
  console.log('   - 2 PO with different processes (CNC, Fabrication, Both)');
  console.log('   - 2 PO with Vendor/Outsource');
  console.log('   - 2 PO in January (2026)');
  console.log('   - 1 PO with Close Deadline (Urgent)');
  console.log('   - 1 PO with Delayed Status');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
