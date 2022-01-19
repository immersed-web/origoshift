const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await bcrypt.hash('bajskorv', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: {
        create: {
          role: 'admin'
        }
      }
    }
  })
}

seed();