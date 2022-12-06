import { RequestHandler, Router, Request as ExpressReq } from 'express';
import bcrypt from 'bcrypt';
import prisma, { Prisma, users, exclude } from './prismaClient.js';
import { createJwt } from 'shared-modules/jwtUtils';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import { validateUserSession } from './utils.js';
import 'shared-types/augmentedRequest';
import 'shared-types/augmentedSession';
import { UserRole, securityLevels } from 'shared-types/CustomTypes';


const index: RequestHandler = (req, res) => {
  res.send({ message: 'this is the auth user route. Whats cookin good lookin?' });
};

interface CreateUserRequest extends ExpressReq {
  body: {
    role?: UserRole,
    gathering?: string,
    username?: string,
    password?: string,
  }
}

const createUser: RequestHandler = async (req: CreateUserRequest, res) => {
  const userData = req.session.user;
  const payload = req.body;
  let gathering = undefined;
  const username = payload.username;
  const password = payload.password;
  const role = payload.role;
  try {
    if (!username) {
      throw new Error('no username provided for user. User must be created with a username. Fattar du väl!!!');
    }
    if (!password) {
      throw new Error('no password provided for user. User must be created with a password');
    }
    if (!userData || !userData.role) {
      throw new Error('no userdata/session present. You are not authorized / logged in!');
    }
    if (!role || !securityLevels.includes(role)) {
      throw new Error('created user MUST have a (valid) role!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'provided data is no good!');
    res.status(400).send(msg);
    return;
  }
  try {
    // Who is making this request!!! Thats stored in userData
    const clientSecurityLevel = securityLevels.indexOf(userData.role);
    const createdUserSecurityLevel = securityLevels.indexOf(role);
    if (clientSecurityLevel < createdUserSecurityLevel) {
      throw new Error('cant create user with higher security level than yourself!! STUPID!!');
    }
    switch (userData.role) {
      case 'guest':
      case 'client':
        res.status(403).send('You may not create other users! You are not cool enough!');
        return;
      case 'host':
        if (!userData.gathering) {
          throw new Error('hosts must assign created users to same gathering as themselves. No gathering set for requesting client');
        }
        gathering = userData.gathering;
        break;
      case 'admin': {
        gathering = payload.gathering;
        if (role !== 'admin' && !gathering) {
          throw new Error('Only admin or higher can be created without an assigned gathering');
        }
        break;
      }
      default:
        throw new Error('no role set! We wont allow any such thing from you sir!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'failed to create user!');
    res.status(403).send(msg);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let userCreate: Prisma.UserCreateArgs['data'] = {
    username: username,
    role: {
      connectOrCreate: {
        where: { role: role },
        create: { role: role }
      }
    },
    password: hashedPassword
  };

  if (gathering) {
    const gatheringCreate: Prisma.UserCreateArgs['data']['gathering'] = {
      connectOrCreate: {
        where: {
          name: gathering,
        },
        create: {
          name: gathering,
        }
      }
    };
    userCreate = { ...userCreate, gathering: gatheringCreate };
  }
  try {
    const result = await prisma.user.create({
      data: userCreate, include: {
        role: true,
        gathering: true,
      }
    });
    // We dont wan to send the password back!!!
    const resultWithoutPassword = exclude(result, 'password');
    res.status(201).send(resultWithoutPassword);
    return;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        res.status(409).send({ message: 'username already taken maddafakka!' });
        return;
      } else {
        console.error('prisma client error when creating user');
        console.error(e);
        res.status(501).send(e.message);
        return;
      }
    }
    console.warn(e);
  }

};

interface UpdateUserRequest extends ExpressReq {
  body: {
    uuid: string,
    role?: UserRole,
    gathering?: string,
    username?: string,
    password?: string,
  }
}
const updateUser: RequestHandler = async (req: UpdateUserRequest, res) => {
  const userData = req.session.user;
  const payload = req.body;
  let gathering = undefined;
  try {
    if (!userData || !userData.role) {
      throw new Error('no userdata/session present. You are not authorized / logged in!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'provided data is no good!');
    res.status(400).send(msg);
    return;
  }
  try {
    // Who is making this request!!! Thats stored in userData
    if (payload.role) {
      const clientSecurityLevel = securityLevels.indexOf(userData.role);
      const createdUserSecurityLevel = securityLevels.indexOf(payload.role);
      if (clientSecurityLevel < createdUserSecurityLevel) {
        throw new Error('cant assign a higher security level than yourself!! STUPID!!');
      }
    }
    switch (userData.role) {
      case 'guest':
      case 'client':
        res.status(403).send('You may not edit users! You are not cool enough!');
        return;
      case 'host':
        if (payload.gathering) {
          throw new Error('hosts cant change gathering for existing users');
        }
        break;
      case 'admin': {
        gathering = payload.gathering;
        break;
      }
      default:
        throw new Error('no role set for requesting client! We wont allow any such thing from you sir!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'failed to create user!');
    res.status(403).send(msg);
    return;
  }
  let hashedPassword = undefined;
  if (payload.password) {
    hashedPassword = await bcrypt.hash(payload.password, 10);
  }
  const userUpdate: Prisma.UserUpdateArgs['data'] = {
    username: payload.username,
    password: hashedPassword,
    role: {
      connect: {
        role: payload.role
      }
    },
    // gathering: {
    //   connect: {
    //     name: gathering,
    //   }
    // }
  };

  if (gathering) {
    userUpdate['gathering'] = {
      connect: {
        name: gathering,
      }
    };
  }

  try {
    const result = await prisma.user.update({
      where: {
        uuid: payload.uuid
      },
      data: userUpdate,
      include: {
        role: true,
        gathering: true,
      }
    });
    // We dont wan to send the password back!!!
    const resultWithoutPassword = exclude(result, 'password');
    res.status(201).send(resultWithoutPassword);
    return;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        res.status(409).send({ message: 'username already taken maddafakka!' });
        return;
      } else {
        console.error('prisma client error when creating user');
        console.error(e);
        res.status(501).send(e.message);
        return;
      }
    }
    console.warn(e);
  }
};

interface DeleteUserRequest extends ExpressReq {
  body: {
    uuid: string
  }
}
const deleteUser: RequestHandler = async (req: DeleteUserRequest, res) => {
  try {

    const userData = req.session.user;
    if (!userData) {
      throw new Error('not allowed');
    }
    const payload = req.body;
    if (!payload || !payload.uuid) {
      throw new Error('no uuid provided. cant delete');
    }
    const userToDelete = await users.findUserAsUserData({
      where: {
        uuid: payload.uuid
      }
    });
    if (!userToDelete) {
      throw new Error('no user found');
    }
    const clientSecurityLevel = securityLevels.indexOf(userData.role);
    if (clientSecurityLevel < securityLevels.indexOf('admin')) {
      if (!userData.gathering || !userToDelete.gathering || userData.gathering !== userToDelete.gathering) {
        throw new Error('no can do. too low security level!');
      }
    }
    const deletedUser = await users.delete({
      where: {
        uuid: payload.uuid
      }
    });

    res.send(exclude(deletedUser, 'password'));
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'fuck off!');
    res.status(401).send(msg);
  }
};
interface GetUsersRequest extends ExpressReq {
  body: {
    gathering?: string
    room?: string
  }
}

const getUsers: RequestHandler = async (req: GetUsersRequest, res) => {
  const userData = req.session.user;
  const payload = req.body;

  try {
    if (!userData) {
      throw new Error('no client userdata. unauthorized!');
    }
    if (!userData.role) {
      throw new Error('you have no role! Thus you are not authorized!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'You give bad data!!!!');
    res.status(400).send(msg);
    return;
  }
  const clientSecurityLevel = securityLevels.indexOf(userData.role);

  try {
    if (clientSecurityLevel < securityLevels.indexOf('host')) {
      throw new Error('Too low security clearance! You fucking loooser!');
    }
    if (clientSecurityLevel < securityLevels.indexOf('admin')) {
      // Below admin in level
      if (!userData.gathering) {
        throw new Error('With your security clearance, you must be assigned to a gathering to query for users');
      }
      if (userData.gathering !== payload.gathering) {
        // throw new Error('You can only query for users in your own gathering!!');
        console.warn('received get users without gathering provided in payload.');
      }
      payload.gathering = userData.gathering;
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'fuck off. Not authorized');
    res.status(401).send(msg);
  }

  const userSelect: Prisma.UserFindManyArgs & { where: Prisma.UserWhereInput } = {
    where: {},
    include: {
      gathering: true,
      role: true,
    }
  };

  if (payload.gathering) {
    userSelect.where['gathering'] = { name: payload.gathering };
  }

  const response = await users.findMany(userSelect);
  const withoutPasswords = response.map(user => exclude(user, 'password'));
  res.send(withoutPasswords);
};

const loginUser: RequestHandler = async (req, res) => {
  // console.log('login req received');
  const username = req.body.username;
  const password = req.body.password;
  try {
    const foundUser = await prisma.user.findUnique({ where: { username: username }, include: { role: true, gathering: true } });
    if (!foundUser) {
      throw new Error('no user with that username found!');
    }
    const correct = await bcrypt.compare(password, foundUser.password);
    if (correct) {
      const userData = users.userResponseToUserData(foundUser);
      // console.log('userdata:', userData);
      req.session.userId = userData.uuid;
      req.session.user = userData;
      res.status(200).send();
      return;
    }
  } catch (e) {
    console.error(e);
    // res.status(501).send('failed when trying to login');
    // return;
  }
  res.status(403).send('You shall not pass!');

};

const logoutUser: RequestHandler = async (req, res) => {
  if (req.user) {
    req.user = undefined;
  }
  if (req.session.userId) {
    req.session.userId = undefined;
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        res.status(501).send({ message: 'failed to destroy session' });
        return;
      }
    });
  }
  res.status(200).send();
};

const getSelf: RequestHandler = async (req, res) => {
  if (!(req.session.user)) {
    res.status(403).send('not allowed mr hacker!');
    return;
  }
  res.send(req.session.user);
};

const getJwt: RequestHandler = async (req, res) => {
  if (!req.session.user) {
    res.status(403).send('no user in req obj! Seems you are not logged in!');
    return;
  }
  const token = createJwt(req.session.user, 60);
  res.send(token);
};

export default function createUserRouter() {

  const userRouter = Router();

  userRouter.get('', index);


  // userRouter.get('/dummylogin', (req, res) => {

  //   req.session.userId = 'mrMaster';
  //   res.send('niiice');
  // });

  userRouter.post('/login', loginUser);
  userRouter.get('/logout', logoutUser);

  userRouter.post('/create', validateUserSession, createUser);
  userRouter.post('/update', validateUserSession, updateUser);
  userRouter.post('/delete-user', validateUserSession, deleteUser);
  userRouter.post('/get-users', validateUserSession, getUsers);

  userRouter.get('/me', validateUserSession, getSelf);

  userRouter.get('/jwt', validateUserSession, getJwt);

  // userRouter.get('jwt', async (req, res, next) =>{

  //   const query: Prisma.UserSelect = {
  //     uuid: true,
  //     role: true,

  //   }


  //   const user = await prisma.user.findUnique({where: {uuid: req.session.userId}});


  // });



  return userRouter;

}



// export default createUserRouter;
