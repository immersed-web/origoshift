// const bcrypt = require('bcrypt');
import bcrypt from 'bcrypt';
// const { PrismaClient } = require('@prisma/client');
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { UserRole } from 'shared-types/CustomTypes'

let role: Exclude<UserRole, 'guest'> = 'admin';

async function seed() {
  const hashedPassword = await bcrypt.hash('bajskorv', 10);

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

  role = 'gatheringEditor'
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
          name: 'TestSkolan'
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
    }
  })


  await prisma.user.create({
    data: {
      username: 'mrClient 3',
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
      },
      rooms: {
        connect: [
          {
            name_gatheringId: {
              gatheringId: testSkolan.uuid,
              name: 'Klassrum 1'
            }
          }
        ]
      }
    }
  })
}

seed();