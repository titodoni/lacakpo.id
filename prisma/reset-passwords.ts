import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🔑 Resetting all PINs to "12345"...\n');

  const defaultPin = await bcrypt.hash('12345', 10);

  // Update all users password
  const result = await prisma.user.updateMany({
    data: {
      passwordHash: defaultPin,
    },
  });

  console.log(`✅ Updated ${result.count} users`);
  console.log('\n📋 New credentials:');
  console.log('   Username: (any user)');
  console.log('   PIN: 12345');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
