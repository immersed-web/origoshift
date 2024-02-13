import { RequestHandler, Router, Request as ExpressReq } from 'express';
import bcrypt from 'bcrypt';
import prisma, { Prisma, users, exclude } from './prismaClient';
import { createJwt } from 'shared-modules/jwtUtils';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import { isLoggedIn } from './utils';
import 'shared-types/augmentedRequest';
import 'shared-types/augmentedSession';
import { UserRole, hasAtLeastSecurityLevel, roleHierarchy, throwIfUnauthorized } from 'schemas';

const index: RequestHandler = (req, res) => {
  res.send({ message: 'this is the auth user route. Whats cookin good lookin?' });
};

interface CreateUserRequest extends ExpressReq {
  body: {
    role?: UserRole,
    username?: string,
    password?: string,
  }
}


const createUser: RequestHandler = async (req: CreateUserRequest, res) => {
  const userData = req.session.user;
  console.log('create user request from:', userData);
  const payload = req.body;
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
    if (!role || !roleHierarchy.includes(role)) {
      throw new Error('created user MUST have a (valid) role!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'provided data is no good!');
    res.status(400).send(msg);
    return;
  }
  try {
    // Who is making this request!!! Thats stored in userData
    const clientSecurityLevel = roleHierarchy.indexOf(userData.role);
    const createdUserSecurityLevel = roleHierarchy.indexOf(role);
    if(clientSecurityLevel < 0 || createdUserSecurityLevel < 0) {
      throw new Error('Invalid role provided');
    }
    if ( createdUserSecurityLevel <= clientSecurityLevel) {
      throw new Error('cant create user with higher or same security level as yourself!!');
    }
    throwIfUnauthorized(userData.role, 'moderator')
    // switch (userData.role) {
    //   case 'guest':
    //   case 'user':
    //     res.status(403).send('You may not create other users! You are not cool enough!');
    //     return;
    //   case 'moderator':
    //     break;
    //   case 'admin': {
    //     break;
    //   }
    //   default:
    //     throw new Error('no role set! We wont allow any such thing from you sir!');
    // }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'failed to create user!');
    res.status(403).send(msg);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userCreate: Prisma.UserCreateArgs['data'] = {
    username: username,
    role: role,
    password: hashedPassword
  };

  try {
    const result = await prisma.user.create({
      data: userCreate
    });
    // We dont wan to send the password back!!!
    const resultWithoutPassword = exclude(result, 'password');
    res.status(201).send(resultWithoutPassword);
    return;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        res.status(409).send('Det användarnamnet är upptaget!');
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


interface CreateSenderRequest extends ExpressReq {
  body: {
    username?: string,
    password?: string,
    venueId?: string,
  }
}
const createSenderForVenue: RequestHandler = async (req : CreateSenderRequest, res) => {
  const userData = req.session.user
  console.log(userData);
  const {password, username, venueId} = req.body 
  try {
    throwIfUnauthorized(userData!.role, 'admin');
    if(!venueId || !username || !password) {
      throw Error('invalid payload!');
    }
  } catch(e) {
    res.status(400).send(extractMessageFromCatch(e, 'your request was no good!'));
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbResponse = await prisma.user.create({
    data: {
      role: 'sender',
      username,
      password: hashedPassword,
      ownedVenues: {
        connect: {
          venueId
        }
      }
    }
  })
  res.send(dbResponse);
}

interface UpdateUserRequest extends ExpressReq {
  body: {
    userId: string,
    role?: UserRole,
    username?: string,
    password?: string,
  }
}
const updateUser: RequestHandler = async (req: UpdateUserRequest, res) => {
  const userData = req.session.user;
  const payload = req.body;
  console.log(payload);
  try {
    if (!userData || !userData.role) {
      throw new Error('no userdata/session present. You are not authorized / logged in!');
    }
    if(!payload.userId) throw Error('no userId provided in payload. Invalid request!');
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'provided data is no good!');
    res.status(400).send(msg);
    return;
  }
  try {
    if (payload.role) {
      const clientSecurityLevel = roleHierarchy.indexOf(userData.role);
      const updatedUserSecurityLevel = roleHierarchy.indexOf(payload.role);
      if (clientSecurityLevel > updatedUserSecurityLevel) {
        throw new Error('cant update a user with higher or same security level as yourself!!');
      }
    }
    throwIfUnauthorized(userData.role, 'moderator');
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'failed to update user!');
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
    role: payload.role,
  };

  try {
    const result = await prisma.user.update({
      where: {
        userId: payload.userId
      },
      data: userUpdate,
    });
    // We dont wan to send the password back!!!
    const resultWithoutPassword = exclude(result, 'password');
    res.status(201).send(resultWithoutPassword);
    return;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        res.status(409).send('användarnamnet är upptaget!');
        return;
      } else {
        console.error('prisma client error when editing user');
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
    userId: string
  }
}
const deleteUser: RequestHandler = async (req: DeleteUserRequest, res) => {
  try {
    const userData = req.session.user;
    if (!userData) {
      throw new Error('not allowed');
    }
    const payload = req.body;
    if (!payload || !payload.userId) {
      throw new Error('no userId provided. cant delete');
    }
    const userToDelete = await users.findUserAsUserData({
      where: {
        userId: payload.userId,
      }
    });
    if (!userToDelete) {
      throw new Error('no user found');
    }
      const clientSecurityLevel = roleHierarchy.indexOf(userData.role);
      const updatedUserSecurityLevel = roleHierarchy.indexOf(userToDelete.role);
      if (clientSecurityLevel >= updatedUserSecurityLevel) {
        throw new Error('cant delete a user with higher or same security level as yourself!');
      }

    throwIfUnauthorized(userData.role, 'moderator');
    const deletedUser = await users.delete({
      where: {
        userId: payload.userId
      }
    });

    res.send(exclude(deletedUser, 'password'));
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'not allowed!');
    res.status(401).send(msg);
  }
};

// interface GetUsersRequest extends ExpressReq {
//   body: {
//     gathering?: string
//     room?: string
//   }
// }

const getAdmins: RequestHandler = async (req, res) => {
  const userData = req.session.user;

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
  const clientSecurityLevel = roleHierarchy.indexOf(userData.role);

  try {
    if (!hasAtLeastSecurityLevel(userData.role, 'superadmin')) {
      throw new Error('Too low security clearance! You loooser!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'Go away. Not authorized');
    res.status(401).send(msg);
  }

  const userSelect: Prisma.UserFindManyArgs & { where: Prisma.UserWhereInput } = {
    where: {
      role: 'admin'
    },
  };

  const response = await users.findMany(userSelect);
  const withoutPasswords = response.map(user => exclude(user, 'password'));
  res.send(withoutPasswords);
};


interface GetSenderRequest extends ExpressReq {
  body: {
    venueId: string
  }
}
const getSender: RequestHandler = async (req: GetSenderRequest, res) => {
  const userData = req.session.user;

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
  const clientSecurityLevel = roleHierarchy.indexOf(userData.role);

  try {
    if (!hasAtLeastSecurityLevel(userData.role, 'admin')) {
      throw new Error('Too low security clearance! You looose!');
    }
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'Go away. Not authorized');
    res.status(401).send(msg);
  }
  const {venueId} = req.body
  if(!venueId) {
    res.status(400).send('no venueId provided. Bad payload');
    return;
  }
  try {
    // TODO: should we check owners, whitelisted or perhaps both?
    const dbResponse = await prisma.venue.findUniqueOrThrow({
      where: {
        venueId,
      },
      include: {
        owners: {
          where: {
            role: 'sender'
          }
        }
      }
    })
    
    if(dbResponse.owners.length > 0) {
      const withoutPassword = exclude(dbResponse.owners[0], 'password')
      res.send(withoutPassword);
      return;
    } else {
      res.status(404).send('no sender for that venue')
    }
  } catch (e) {
    res.status(500).send('db query failed')
    return;
  }
}

const loginUser: RequestHandler = async (req, res) => {
  // console.log('login req received');
  const username = req.body.username;
  const password = req.body.password;
  try {
    const foundUser = await prisma.user.findUnique({ where: { username: username } });
    if (!foundUser) {
      throw new Error('no user with that username found!');
    }
    const correct = await bcrypt.compare(password, foundUser.password);
    if (correct) {
      const userData = users.userResponseToUserData(foundUser);
      // console.log('userdata:', userData);
      req.session.userId = userData.userId;
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
  console.log('received logout request');
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
  const projectName = process.env.EXPOSED_PROJECT_NAME;
  if(projectName){
    res.clearCookie(projectName);
  }
  console.log('user was logged out');
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
  const token = createJwt(req.session.user, 10);
  res.send(token);
};

export default function createUserRouter() {

  const userRouter = Router();

  userRouter.get('', index);

  userRouter.post('/login', loginUser);
  userRouter.get('/logout', logoutUser);

  userRouter.post('/create', isLoggedIn, createUser);
  userRouter.post('/update', isLoggedIn, updateUser);
  userRouter.post('/delete', isLoggedIn, deleteUser);
  userRouter.get('/get-admins', isLoggedIn, getAdmins);
  userRouter.post('/get-sender', isLoggedIn, getSender);
  userRouter.post('/create-sender', isLoggedIn, createSenderForVenue);

  userRouter.get('/me', isLoggedIn, getSelf);

  userRouter.get('/jwt', isLoggedIn, getJwt);

  return userRouter;

}
