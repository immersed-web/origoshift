// const bcrypt = require('bcrypt');
import bcrypt from 'bcrypt';
// const { PrismaClient } = require('@prisma/client');
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NonGuestUserRole } from 'shared-types/CustomTypes'

// console.log('env vars:', process.env);

let role: NonGuestUserRole = 'admin';
async function seedProd () {
  if(!process.env.ADMIN_PASSWORD){
    throw Error('no admin password provided for seed script. set ADMIN_PASSWORD var in the file .env');
  }
  const password = process.env.ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 10);

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
}

async function seedDev () {
  const hashedPassword = await bcrypt.hash('password', 10);

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

  const testSkolan = await prisma.gathering.create({
    data: {
      name: 'TestSkolan',
      // rooms: {
      //   createMany: {
      //     data: [
      //       { name: 'Klassrum 1' },
      //       { name: 'Klassrum 2' },
      //     ]
      //   }
      // },
    }
  })

  const testSkolan2 = await prisma.gathering.create({
    data: {
      name: 'TestSkolan2',
    }
  })


  role = 'host'
  await prisma.user.create({
    data: {
      username: 'host1',
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


  role = 'client';
  await prisma.user.create({
    data: {
      username: 'elev1',
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
      username: 'elev2',
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
      username: 'host2',
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
  await prisma.user.create({
    data: {
      username: 'elev3',
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
      }
    }
  })
  await prisma.user.create({
    data: {
      username: 'elev4',
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
      }
    }
  })
}

if(process.env.DEVELOPMENT){
  console.log('seeding db with development dummy data');
  seedDev();
}else {
  console.log('seeding db with prod data');
  seedProd();
}