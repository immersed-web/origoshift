
import { RequestHandler, Router, Request as ExpressReq } from 'express';
import prisma from './prismaClient';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import { throwIfUnauthorized, hasAtLeastSecurityLevel } from 'shared-modules/authUtils';
import { securityLevels } from 'shared-types/CustomTypes';
import { validateUserSession } from './utils';


const index: RequestHandler = (req, res) => {
  res.send({ message: 'this is the auth api route. Here youcan interact with the rooms and gatherings' });
};

interface GetGatheringRequest extends ExpressReq {
  body: {
    gatheringName?: string
  }
}

//TODO: should this perhaps only be allowed at all for gatheringEditors or above?
const getGathering:RequestHandler = async (req: GetGatheringRequest, res) => {
  const payload = req.body;
  const userData = req.session.user;
  let gatheringName = payload.gatheringName;

  try {

    if(!userData || !userData.role) {
      throw new Error('no role!');
    }
    throwIfUnauthorized(userData.role, 'gatheringEditor');
    if(!hasAtLeastSecurityLevel(userData.role, 'admin')){
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

// TODO: Dont return the hashed password here (or elsewhere for that matter! Perhaps a prisma middleware would be feasable?)
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

const createGathering: RequestHandler = async (req, res) => {
  const userData = req.session.user;
  const payload = req.body;
  try {
    throwIfUnauthorized(userData?.role, 'admin');
    if(!payload.gatheringName){
      throw new Error('no name provided');
    }
    const createdGathering = await prisma.gathering.create({
      data: {
        name: payload.gatheringName
      }
    });
    res.send(createdGathering);

  } catch (e) {
    const msg = extractMessageFromCatch(e, 'Aaah. Just. Dont!');
    res.status(401).send(msg);
  }
};

export default function createApiRouter() {
  const apiRouter = Router();


  apiRouter.get('', index);
  apiRouter.post('/gathering', validateUserSession, getGathering);
  apiRouter.get('/allgatherings', validateUserSession, allGatherings);
  apiRouter.post('/create-gathering', validateUserSession, createGathering);
  return apiRouter;

}