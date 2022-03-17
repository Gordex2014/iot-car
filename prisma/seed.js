/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const argon = require('argon2');

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      firstName: 'Admin',
      lastName: 'Admin',
      password: await argon.hash('adminpw'),
      username: 'admin',
      authProvider: 'LOCAL',
      isActive: true,
      role: 'ADMIN',
    },
  });
  console.log(admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
