// const bcrypt = require('bcrypt');
import bcrypt from 'bcrypt';
// const { PrismaClient } = require('@prisma/client');
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NonGuestUserRole } from 'shared-types/CustomTypes'

let role: NonGuestUserRole = 'admin';

async function seed() {
  const hashedPassword = await bcrypt.hash('password', 10);

  const testSkolan = await prisma.gathering.create({
    data: {
      name: 'TestSkolan',
      rooms: {
        createMany: {
          data: [
            { name: 'Klassrum 1' },
            { name: 'Klassrum 2' },
          ]
        }
      },
    }
  })

  const testSkolan2 = await prisma.gathering.create({
    data: {
      name: 'TestSkolan2',
    }
  })

  await prisma.user.create({
    data:
    {
      username: 'admin',
      password: hashedPassword,
      role: {
        create: {
          role: role
        }
      },
    },
  })

  role = 'host'
  await prisma.user.create({
    data: {
      username: 'mrEditor',
      password: hashedPassword,
      role: {
        connectOrCreate: {
          create: {
            role: role
          },
          where: {
            role: role
          }
        }
      },
      gathering: {
        connect: {
          name: 'TestSkolan'
        }
      }
    }
  })


  role = 'client';
  await prisma.user.create({
    data: {
      username: 'mrClient 1',
      password: hashedPassword,
      role: {
        connectOrCreate: {
          create: {
            role: role
          },
          where: {
            role: role
          }
        }
      },
      gathering: {
        connect: {
          name: testSkolan.name
        }
      }
    }
  })

  await prisma.user.create({
    data: {
      username: 'mrClient 2',
      password: hashedPassword,
      role: {
        connectOrCreate: {
          create: {
            role: role
          },
          where: {
            role: role
          }
        }
      },
      gathering: {
        connect: {
          name: testSkolan.name
        }
      }
    }
  })

  role = 'host';
  await prisma.user.create({
    data: {
      username: 'mrEditor2',
      password: hashedPassword,
      role: {
        connectOrCreate: {
          create: {
            role: role
          },
          where: {
            role: role
          }
        }
      },
      gathering: {
        connect: {
          name: testSkolan2.name
        }
      },
    }
  })
}

seed();