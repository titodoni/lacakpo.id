import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // Create Super Admin - PIN: 12345
  const defaultPin = await bcrypt.hash('12345', 10);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: defaultPin,
      name: 'Administrator',
      role: 'super_admin',
      department: 'management',
      isActive: true,
    },
  });
  console.log('✅ Created admin (username: admin, PIN: 12345)');

  // Create sample operators - All PIN: 12345
  const operators = [
    { username: 'andi', name: 'Andi CNC', role: 'cnc_operator', dept: 'production' },
    { username: 'budi', name: 'Budi Drafter', role: 'drafter', dept: 'drafting' },
    { username: 'sari', name: 'Sari Purchasing', role: 'purchasing', dept: 'purchasing' },
    { username: 'dewi', name: 'Dewi QC', role: 'qc', dept: 'qc' },
    { username: 'finance', name: 'Finance Admin', role: 'finance', dept: 'finance' },
    { username: 'manager', name: 'Pak Manager', role: 'manager', dept: 'management' },
    { username: 'sales', name: 'Sales Admin', role: 'sales_admin', dept: 'sales' },
    { username: 'delivery', name: 'Delivery Staff', role: 'delivery', dept: 'logistics' },
  ];

  for (const op of operators) {
    await prisma.user.upsert({
      where: { username: op.username },
      update: {},
      create: {
        username: op.username,
        passwordHash: defaultPin,
        name: op.name,
        role: op.role,
        department: op.dept,
        isActive: true,
      },
    });
    console.log(`✅ Created ${op.username} (PIN: 12345)`);
  }

  // Sample clients - using create with upsert pattern
  const clients = [
    { code: 'SA', name: 'PT Sinar Abadi', contactPerson: 'Pak Ahmad', phone: '021-5550101' },
    { code: 'DP', name: 'PT Delta Prima', contactPerson: 'Ibu Sari', phone: '021-5550202' },
    { code: 'MK', name: 'PT Maju Kencana', contactPerson: 'Pak Budi', phone: '021-5550303' },
  ];

  for (const clientData of clients) {
    await prisma.client.upsert({
      where: { code: clientData.code },
      update: {},
      create: clientData,
    });
  }
  console.log('\n✅ Created 3 sample clients');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Default credentials for all users:');
  console.log('   Username: admin / andi / budi / sari / dewi / finance / manager / sales / delivery');
  console.log('   PIN: 12345');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
