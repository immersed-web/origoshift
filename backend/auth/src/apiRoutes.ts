
import { RequestHandler, Router, Request as ExpressReq } from 'express';
import prisma from './prismaClient';
// import bcrypt from 'bcrypt';
// import session from 'express-session';
// import { PrismaSessionStore } from '@quixo3/prisma-session-store';
// import prisma, { Prisma, users, exclude } from './prismaClient';
// import { createJwt } from 'shared-modules/jwtUtils';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
// // import { userDataFromDBResponse } from './utils';
// import 'shared-types/augmentedRequest';
import { securityLevels } from 'shared-types/CustomTypes';
import { validateUserSession } from './utils';


const index: RequestHandler = (req, res) => {
  res.send({ message: 'this is the auth api route. Here youcan interact with the rooms and gatherings' });
};

// interface CreateUserRequest extends ExpressReq {
//   body: {
//     role?: UserRole,
//     gathering?: string,
//     username?: string,
//     password?: string,
//   }
// }


// interface GetRoomsRequest extends ExpressReq {
//   body: {
//     gathering?: string
//     // room?: string
//   }
// }

// const getRooms: RequestHandler = async (req: GetRoomsRequest, res) => {
//   const userData = req.session.user;
//   const payload = req.body;

//   try {
//     if (!userData){
//       throw new Error('no client userdata. unauthorized!');
//     }
//     if(!userData.role){
//       throw new Error('you have no role! Thus you are not authorized!');
//     }
//   } catch (e) {
//     const msg = extractMessageFromCatch(e, 'You give bad data!!!!');
//     res.status(400).send(msg);
//     return;
//   }
// const clientSecurityLevel = securityLevels.indexOf(userData.role);

// try {
//   if(clientSecurityLevel < securityLevels.indexOf('sender')){
//     throw new Error('Too low security clearance! You fucking loooser!');
//   }
//   if(clientSecurityLevel < securityLevels.indexOf('admin')){
//     // Below admin in level
//     if(!userData.gathering){
//       throw new Error('With your security clearance, you must be assigned to a gathering to query for users');
//     }
//     if(userData.gathering !== payload.gathering){
//       // throw new Error('You can only query for users in your own gathering!!');
//       console.warn('received get users without gathering provided in payload.');
//     }
//     payload.gathering = userData.gathering;
//   }
// } catch(e){
//   const msg = extractMessageFromCatch(e, 'fuck off. Not authorized');
//   res.status(401).send(msg);
// }

// const userSelect: Prisma.UserFindManyArgs & {where: Prisma.UserWhereInput}  = {
//   where: {},
//   include: {
//     gathering: true,
//     rooms: true,
//     role: true,
//   }
// };

// if(payload.gathering){
//   userSelect.where['gathering'] = {name: payload.gathering};
// }
// if(payload.room){
//   userSelect.where['rooms'] = {some: {name: payload.room }};
// }

// const response = await users.findMany(userSelect);
// const withoutPasswords = response.map(user => exclude(user, 'password'));
// res.send(withoutPasswords);
// };

interface GetGatheringRequest extends ExpressReq {
  body: {
    gathering?: string
    // room?: string
  }
}
const getGathering:RequestHandler = async (req: GetGatheringRequest, res) => {
  const payload = req.body;
  const userData = req.session.user;
  let gatheringName = payload.gathering;

  try {

    if(!userData || !userData.role) {
      throw new Error('no role!');
    }
    const clientSecurityLevel = securityLevels.indexOf(userData.role);
    if(clientSecurityLevel < securityLevels.indexOf('admin')){

      gatheringName = userData.gathering;
    }
    if(!gatheringName){
      throw new Error('either no gatheringName provided or no gatheringName in userData');
    }

    const response = await prisma.gathering.findUnique({
      where: {
        name: gatheringName
      },
      include: {
        users: true,
        rooms: true,
      }
    });

    res.send(response);
  } catch (e) {
    const msg = extractMessageFromCatch(e, 'fuck you! You ar not allowed!');
    res.status(401).send(msg);
  }
};

const allGatherings: RequestHandler = async (req, res) => {
  const userData = req.session.user;
  try {
    if(!userData || !userData.role){
      throw new Error('no role!!!');
    }
    const clientSecurityLevel = securityLevels.indexOf(userData.role);
    if(clientSecurityLevel < securityLevels.indexOf('admin')){
      throw new Error('not authorized! Go fuck yourself!');
    }

    const gatherings = await prisma.gathering.findMany({
      include: {
        rooms: true,
        users: true,
      }
    });
    res.send(gatherings);
  } catch(e) {
    const msg = extractMessageFromCatch(e, 'please dont!');
    res.status(401).send(msg);
  }
};

export default function createApiRouter() {
  const apiRouter = Router();


  apiRouter.get('', index);
  apiRouter.post('/gathering', validateUserSession, getGathering);
  apiRouter.get('/allgatherings', validateUserSession, allGatherings);
  return apiRouter;

}