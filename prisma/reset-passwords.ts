import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Resetting all passwords to "demo"...\n');

  const defaultPassword = await bcrypt.hash('demo', 10);

  // Update all users password
  const result = await prisma.user.updateMany({
    data: {
      passwordHash: defaultPassword,
    },
  });

  console.log(`✅ Updated ${result.count} users`);
  console.log('\n📋 New credentials:');
  console.log('   Username: (any user)');
  console.log('   Password: demo');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
