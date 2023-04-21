import bcrypt from 'bcrypt';
import { PrismaClient, Role } from "./src/index";
const prisma = new PrismaClient();


async function createOrUpdateUser(role: Role, username: string, hashedPassword: string) {
  const preExistingUser = await prisma.user.findUnique({
    where: {
      username
    }
  })
  if(preExistingUser){
    await prisma.user.update({
      where: {
        userId: preExistingUser.userId
      },
      data: {
        password: hashedPassword,
        role,
      }
    })
  } else {
    await prisma.user.create({
      data:
      {
        username ,
        password: hashedPassword,
        role,
      },
    })
  }
}
async function seedProd() {
  if (!process.env.ADMIN_PASSWORD) {
    throw Error('no admin password provided for seed script. set ADMIN_PASSWORD var in the file .env');
  }

  const password = process.env.ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 10);

  await createOrUpdateUser('superadmin', 'superadmin', hashedPassword);
}



async function seedDev() {
  if (!process.env.ADMIN_PASSWORD) {
    throw Error('no admin password provided for seed script. set ADMIN_PASSWORD var in the file .env');
  }

  const password = process.env.ADMIN_PASSWORD;
  let hashedPassword = await bcrypt.hash(password, 10);
  await createOrUpdateUser('superadmin', 'superadmin', hashedPassword);

  hashedPassword = await bcrypt.hash('123', 10);

  const userRole: Role = 'user';
  await createOrUpdateUser(userRole, 'user1', hashedPassword);

  const cameraRole: Role = 'sender';
  await createOrUpdateUser(cameraRole, 'sender', hashedPassword);

}

if (process.env.DEVELOPMENT) {
  console.log('seeding db with development dummy data');
  seedDev();
} else {
  console.log('seeding db with prod data');
  seedProd();
}
